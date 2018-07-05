// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import { setLiveStreamKey } from '../../actions';

import AbstractStartLiveStreamDialog, {
    _mapStateToProps,
    type Props
} from './AbstractStartLiveStreamDialog';
import StreamKeyForm from './StreamKeyForm';

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 */
class StartLiveStreamDialog extends AbstractStartLiveStreamDialog {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onInitializeGoogleApi = this._onInitializeGoogleApi.bind(this);
        this._onStreamKeyChangeNative
            = this._onStreamKeyChangeNative.bind(this);
        this._renderDialogContent = this._renderDialogContent.bind(this);
    }

    _onInitializeGoogleApi: () => Promise<*>

    /**
     * Loads the Google client application used for fetching stream keys.
     * If the user is already logged in, then a request for available YouTube
     * broadcasts is also made.
     *
     * @private
     * @returns {Promise}
     */
    _onInitializeGoogleApi() {
        // This is a placeholder method for the Google feature.
        return Promise.resolve();
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

    _renderDialogContent: () => React$Component<*>

    /**
     * Renders the platform specific dialog content.
     *
     * @returns {React$Component}
     */
    _renderDialogContent() {
        return (
            <View>
                <StreamKeyForm
                    onChange = { this._onStreamKeyChangeNative }
                    value = { this.props._streamKey } />
            </View>
        );
    }

}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
