// @flow

import React from 'react';
import { View } from 'react-native';

import { CustomSubmitDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { googleApi } from '../../../../google-api';


import { setLiveStreamKey } from '../../../actions';

import AbstractStartLiveStreamDialog,
{ _mapStateToProps, type Props } from '../AbstractStartLiveStreamDialog';

import GoogleSigninForm from './GoogleSigninForm';
import StreamKeyForm from './StreamKeyForm';
import StreamKeyPicker from './StreamKeyPicker';
import styles from './styles';

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 */
class StartLiveStreamDialog extends AbstractStartLiveStreamDialog<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onStreamKeyChangeNative
            = this._onStreamKeyChangeNative.bind(this);
        this._onStreamKeyPick = this._onStreamKeyPick.bind(this);
        this._onUserChanged = this._onUserChanged.bind(this);
    }

    /**
     * Implements {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <CustomSubmitDialog
                okKey = 'dialog.startLiveStreaming'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit } >
                <View style = { styles.startDialogWrapper }>
                    <GoogleSigninForm
                        onUserChanged = { this._onUserChanged } />
                    <StreamKeyPicker
                        broadcasts = { this.state.broadcasts }
                        onChange = { this._onStreamKeyPick } />
                    <StreamKeyForm
                        onChange = { this._onStreamKeyChangeNative }
                        value = {
                            this.state.streamKey || this.props._streamKey
                        } />
                </View>
            </CustomSubmitDialog>
        );
    }

    _onCancel: () => boolean;

    _onSubmit: () => boolean;

    _onStreamKeyChange: string => void

    _onStreamKeyChangeNative: string => void;

    /**
     * Callback to handle stream key changes.
     *
     * FIXME: This is a temporary method to store the streaming key on mobile
     * for easier use, until the Google sign-in is implemented. We don't store
     * the key on web for security reasons (e.g. We don't want to have the key
     * stored if the used signed out).
     *
     * @private
     * @param {string} streamKey - The new key value.
     * @returns {void}
     */
    _onStreamKeyChangeNative(streamKey) {
        this.props.dispatch(setLiveStreamKey(streamKey));
        this._onStreamKeyChange(streamKey);
    }

    _onStreamKeyPick: string => void

    /**
     * Callback to be invoked when the user selects a stream from the picker.
     *
     * @private
     * @param {string} streamKey - The key of the selected stream.
     * @returns {void}
     */
    _onStreamKeyPick(streamKey) {
        this.setState({
            streamKey
        });
    }

    _onUserChanged: Object => void

    /**
     * A callback to be invoked when an authenticated user changes, so
     * then we can get (or clear) the YouTube stream key.
     *
     * TODO: Handle errors by showing some indication to the user.
     *
     * @private
     * @param {Object} response - The retreived signin response.
     * @returns {void}
     */
    _onUserChanged(response) {
        if (response) {
            googleApi.getTokens()
                .then(tokens => {
                    googleApi.getYouTubeLiveStreams(tokens.accessToken)
                        .then(broadcasts => {
                            this.setState({
                                broadcasts
                            });
                        });
                })
                .catch(() => {
                    this.setState({
                        broadcasts: undefined,
                        streamKey: undefined
                    });
                });
        } else {
            this.setState({
                broadcasts: undefined,
                streamKey: undefined
            });
        }
    }
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
