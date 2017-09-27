import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../../base/devices';
import { hideDialog } from '../../base/dialog';

import DeviceSelectionDialogBase from './DeviceSelectionDialogBase';

/**
 * React component for previewing and selecting new audio and video sources.
 *
 * @extends Component
 */
class DeviceSelectionDialog extends Component {
    /**
     * DeviceSelectionDialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * All known audio and video devices split by type. This prop comes from
         * the app state.
         */
        _availableDevices: PropTypes.object,

        /**
         * Device id for the current audio input device. This device will be set
         * as the default audio input device to preview.
         */
        currentAudioInputId: PropTypes.string,

        /**
         * Device id for the current audio output device. This device will be
         * set as the default audio output device to preview.
         */
        currentAudioOutputId: PropTypes.string,

        /**
         * Device id for the current video input device. This device will be set
         * as the default video input device to preview.
         */
        currentVideoInputId: PropTypes.string,

        /**
         * Whether or not the audio selector can be interacted with. If true,
         * the audio input selector will be rendered as disabled. This is
         * specifically used to prevent audio device changing in Firefox, which
         * currently does not work due to a browser-side regression.
         */
        disableAudioInputChange: PropTypes.bool,

        /**
         * True if device changing is configured to be disallowed. Selectors
         * will display as disabled.
         */
        disableDeviceChange: PropTypes.bool,

        /**
         * Invoked to notify the store of app state changes.
         */
        dispatch: PropTypes.func,

        /**
         * Function that checks whether or not a new audio input source can be
         * selected.
         */
        hasAudioPermission: PropTypes.func,

        /**
         * Function that checks whether or not a new video input sources can be
         * selected.
         */
        hasVideoPermission: PropTypes.func,

        /**
         * If true, the audio meter will not display. Necessary for browsers or
         * configurations that do not support local stats to prevent a
         * non-responsive mic preview from displaying.
         */
        hideAudioInputPreview: PropTypes.bool,

        /**
         * Whether or not the audio output source selector should display. If
         * true, the audio output selector and test audio link will not be
         * rendered. This is specifically used for hiding audio output on
         * temasys browsers which do not support such change.
         */
        hideAudioOutputSelect: PropTypes.bool
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            currentAudioInputId,
            currentAudioOutputId,
            currentVideoInputId,
            disableAudioInputChange,
            disableDeviceChange,
            dispatch,
            hasAudioPermission,
            hasVideoPermission,
            hideAudioInputPreview,
            hideAudioOutputSelect
        } = this.props;

        const props = {
            availableDevices: this.props._availableDevices,
            closeModal: () => dispatch(hideDialog()),
            currentAudioInputId,
            currentAudioOutputId,
            currentVideoInputId,
            disableAudioInputChange,
            disableDeviceChange,
            hasAudioPermission,
            hasVideoPermission,
            hideAudioInputPreview,
            hideAudioOutputSelect,
            setAudioInputDevice: id => {
                dispatch(setAudioInputDevice(id));

                return Promise.resolve();
            },
            setAudioOutputDevice: id => {
                dispatch(setAudioOutputDevice(id));

                return Promise.resolve();
            },
            setVideoInputDevice: id => {
                dispatch(setVideoInputDevice(id));

                return Promise.resolve();
            }
        };

        return <DeviceSelectionDialogBase { ...props } />;
    }
}

/**
 * Maps (parts of) the Redux state to the associated DeviceSelectionDialog's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _availableDevices: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _availableDevices: state['features/base/devices']
    };
}

export default connect(_mapStateToProps)(DeviceSelectionDialog);
