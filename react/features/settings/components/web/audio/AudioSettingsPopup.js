// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React from 'react';

import {
    getAudioInputDeviceData,
    getAudioOutputDeviceData,
    setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice as setAudioOutputDeviceAction
} from '../../../../base/devices';
import { connect } from '../../../../base/redux';
import {
    getCurrentMicDeviceId,
    getCurrentOutputDeviceId
} from '../../../../base/settings';
import { toggleAudioSettings } from '../../../actions';
import { getAudioSettingsVisibility } from '../../../functions';

import AudioSettingsContent, { type Props as AudioSettingsContentProps } from './AudioSettingsContent';


type Props = AudioSettingsContentProps & {

   /**
    * Component's children (the audio button).
    */
    children: React$Node,

   /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean,

   /**
    * Callback executed when the popup closes.
    */
    onClose: Function,
}

/**
 * Popup with audio settings.
 *
 * @returns {ReactElement}
 */
function AudioSettingsPopup({
    children,
    currentMicDeviceId,
    currentOutputDeviceId,
    isOpen,
    microphoneDevices,
    setAudioInputDevice,
    setAudioOutputDevice,
    onClose,
    outputDevices
}: Props) {
    return (
        <div className = 'audio-preview'>
            <InlineDialog
                content = { <AudioSettingsContent
                    currentMicDeviceId = { currentMicDeviceId }
                    currentOutputDeviceId = { currentOutputDeviceId }
                    microphoneDevices = { microphoneDevices }
                    outputDevices = { outputDevices }
                    setAudioInputDevice = { setAudioInputDevice }
                    setAudioOutputDevice = { setAudioOutputDevice } /> }
                isOpen = { isOpen }
                onClose = { onClose }
                position = 'top left'>
                {children}
            </InlineDialog>
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        currentMicDeviceId: getCurrentMicDeviceId(state),
        currentOutputDeviceId: getCurrentOutputDeviceId(state),
        isOpen: getAudioSettingsVisibility(state),
        microphoneDevices: getAudioInputDeviceData(state),
        outputDevices: getAudioOutputDeviceData(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleAudioSettings,
    setAudioInputDevice: setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice: setAudioOutputDeviceAction
};

export default connect(mapStateToProps, mapDispatchToProps)(AudioSettingsPopup);
