import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

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

import AudioSettingsContent from './AudioSettingsContent';


interface IProps {

    /**
    * Component's children (the audio button).
    */
    children: ReactNode;

    /**
    * The deviceId of the microphone in use.
    */
    currentMicDeviceId: string;

    /**
    * The deviceId of the output device in use.
    */
    currentOutputDeviceId?: string;

    /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean;

    /**
    * Used to decide whether to measure audio levels for microphone devices.
    */
    measureAudioLevels: boolean;

    /**
    * A list with objects containing the labels and deviceIds
    * of all the input devices.
    */
    microphoneDevices: Array<{ deviceId: string; label: string; }>;

    /**
    * Callback executed when the popup closes.
    */
    onClose: Function;

    /**
    * A list of objects containing the labels and deviceIds
    * of all the output devices.
    */
    outputDevices: Array<{ deviceId: string; label: string; }>;

    /**
     * The popup placement enum value.
     */
    popupPlacement: string;

    /**
    * Used to set a new microphone as the current one.
    */
    setAudioInputDevice: Function;

    /**
    * Used to set a new output device as the current one.
    */
    setAudioOutputDevice: Function;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'inline-block'
        }
    };
});

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
    const { classes, cx } = useStyles();

    return (
        <div className = { cx(classes.container, 'audio-preview') }>
            <Popover
                allowClick = { true }
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
