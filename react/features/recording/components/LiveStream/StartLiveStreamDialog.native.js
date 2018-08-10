// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { googleApi } from '../../../google-api';


import { setLiveStreamKey } from '../../actions';

import AbstractStartLiveStreamDialog, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractStartLiveStreamDialog';
import GoogleSigninForm from './GoogleSigninForm';
import StreamKeyForm from './StreamKeyForm';
import StreamKeyPicker from './StreamKeyPicker';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * The ID for the Google client application used for making stream key
     * related requests on iOS.
     */
    _googleApiIOSClientID: string
};

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
        this._renderDialogContent = this._renderDialogContent.bind(this);
    }

    _onStreamKeyChange: string => void

    _onStreamKeyChangeNative: string => void;

    /**
     * Callback to handle stream key changes.
     *
     * FIXME: This is a temporary method to store the streaming key on mobile
     * for easier use, until the Google sign-in is implemented. We don't store
     * the key on web for security reasons (e.g. we don't want to have the key
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
     * TODO: handle errors by showing some indication to the user.
     *
     * @private
     * @param {Object} response - The retreived signin response.
     * @returns {void}
     */
    _onUserChanged(response) {
        if (response && response.accessToken) {
            googleApi.getYouTubeLiveStreams(response.accessToken)
            .then(broadcasts => {
                this.setState({
                    broadcasts
                });
            });
        } else {
            this.setState({
                broadcasts: undefined,
                streamKey: undefined
            });
        }
    }

    _renderDialogContent: () => React$Component<*>

    /**
     * Renders the platform specific dialog content.
     *
     * @returns {React$Component}
     */
    _renderDialogContent() {
        return (
            <View style = { styles.startDialogWrapper }>
                <GoogleSigninForm
                    clientId = { this.props._googleApiApplicationClientID }
                    iOSClientId = { this.props._googleApiIOSClientID }
                    onUserChanged = { this._onUserChanged } />
                <StreamKeyPicker
                    broadcasts = { this.state.broadcasts }
                    onChange = { this._onStreamKeyPick } />
                <StreamKeyForm
                    onChange = { this._onStreamKeyChangeNative }
                    value = { this.state.streamKey || this.props._streamKey } />
            </View>
        );
    }

}

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _googleApiApplicationClientID: string
 * }}
 */
function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state),
        _googleApiIOSClientID:
            state['features/base/config'].googleApiIOSClientID
    };
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
