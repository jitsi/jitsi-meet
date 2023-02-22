import React, { ReactNode } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { areAudioLevelsEnabled } from '../../../../base/config/functions.web';
import {
    setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice as setAudioOutputDeviceAction
} from '../../../../base/devices/actions.web';
import {
    getAudioInputDeviceData,
    getAudioOutputDeviceData
} from '../../../../base/devices/functions.web';
import Popover from '../../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import {
    getCurrentMicDeviceId,
    getCurrentOutputDeviceId
} from '../../../../base/settings/functions.web';
import { toggleAudioSettings } from '../../../actions';
import { getAudioSettingsVisibility } from '../../../functions.web';

import AudioSettingsContent, { type IProps as AudioSettingsContentProps } from './AudioSettingsContent';


interface IProps extends AudioSettingsContentProps {

    /**
    * Component's children (the audio button).
    */
    children: ReactNode;

    /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean;

    /**
    * Callback executed when the popup closes.
    */
    onClose: Function;

    /**
     * The popup placement enum value.
     */
    popupPlacement: string;
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
    popupPlacement,
    measureAudioLevels
}: IProps) {
    return (
        <div className = 'audio-preview'>
            <Popover
                content = { <AudioSettingsContent
                    currentMicDeviceId = { currentMicDeviceId }
                    currentOutputDeviceId = { currentOutputDeviceId }
                    measureAudioLevels = { measureAudioLevels }
                    microphoneDevices = { microphoneDevices }
                    outputDevices = { outputDevices }
                    setAudioInputDevice = { setAudioInputDevice }
                    setAudioOutputDevice = { setAudioOutputDevice } /> }
                headingId = 'audio-settings-button'
                onPopoverClose = { onClose }
                position = { popupPlacement }
                trigger = 'click'
                visible = { isOpen }>
                {children}
            </Popover>
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        popupPlacement: clientWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end',
        currentMicDeviceId: getCurrentMicDeviceId(state),
        currentOutputDeviceId: getCurrentOutputDeviceId(state),
        isOpen: Boolean(getAudioSettingsVisibility(state)),
        microphoneDevices: getAudioInputDeviceData(state) ?? [],
        outputDevices: getAudioOutputDeviceData(state) ?? [],
        measureAudioLevels: areAudioLevelsEnabled(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleAudioSettings,
    setAudioInputDevice: setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice: setAudioOutputDeviceAction
};

export default connect(mapStateToProps, mapDispatchToProps)(AudioSettingsPopup);
