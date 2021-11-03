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
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import {
    getCurrentMicDeviceId,
    getCurrentOutputDeviceId, getCurrentWaitingAreaMicDeviceId
} from '../../../../base/settings';
import { isJaneWaitingAreaPageVisible } from '../../../../jane-waiting-area';
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

    /**
     * The popup placement enum value.
     */
    popupPlacement: string
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
    outputDevices,
    popupPlacement
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
                placement = { popupPlacement }>
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
    const { clientWidth } = state['features/base/responsive-ui'];
    const currentMicDeviceId = isJaneWaitingAreaPageVisible(state)
        ? getCurrentWaitingAreaMicDeviceId(state) : getCurrentMicDeviceId(state);

    return {
        popupPlacement: clientWidth <= SMALL_MOBILE_WIDTH ? 'auto' : 'top-start',
        currentMicDeviceId,
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
