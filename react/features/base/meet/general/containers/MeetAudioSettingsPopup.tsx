import React from "react";
import { connect } from "react-redux";

import { IReduxState } from "../../../../app/types";
import { toggleAudioSettings } from "../../../../settings/actions.web";
import AudioSettingsContent from "../../../../settings/components/web/audio/AudioSettingsContent";
import { getAudioSettingsVisibility } from "../../../../settings/functions.any";
import { areAudioLevelsEnabled } from "../../../config/functions.web";
import {
    setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice as setAudioOutputDeviceAction,
} from "../../../devices/actions.web";
import { getAudioInputDeviceData, getAudioOutputDeviceData } from "../../../devices/functions.web";
import { getCurrentMicDeviceId, getCurrentOutputDeviceId } from "../../../settings/functions.web";

interface MeetAudioSettingsPopUpProps {
    currentMicDeviceId: string;
    currentOutputDeviceId?: string;
    isOpen: boolean;
    microphoneDevices: Array<{ deviceId: string; label: string }>;
    outputDevices: Array<{ deviceId: string; label: string }>;
    setAudioInputDevice: Function;
    setAudioOutputDevice: Function;
    onClose: Function;
    measureAudioLevels: boolean;
    audioTrack?: any;
}

const MeetAudioSettingsPopUp = ({
    currentMicDeviceId,
    currentOutputDeviceId,
    microphoneDevices,
    outputDevices,
    setAudioInputDevice,
    setAudioOutputDevice,
    measureAudioLevels,
}: MeetAudioSettingsPopUpProps) => {
    return (
        <div className="flex p-1 rounded-xl">
            <AudioSettingsContent
                currentMicDeviceId={currentMicDeviceId}
                currentOutputDeviceId={currentOutputDeviceId}
                measureAudioLevels={measureAudioLevels}
                microphoneDevices={microphoneDevices}
                outputDevices={outputDevices}
                setAudioInputDevice={setAudioInputDevice}
                setAudioOutputDevice={setAudioOutputDevice}
            />
        </div>
    );
};

function mapStateToProps(state: IReduxState) {
    return {
        currentMicDeviceId: getCurrentMicDeviceId(state),
        currentOutputDeviceId: getCurrentOutputDeviceId(state),
        isOpen: Boolean(getAudioSettingsVisibility(state)),
        microphoneDevices: getAudioInputDeviceData(state) ?? [],
        outputDevices: getAudioOutputDeviceData(state) ?? [],
        measureAudioLevels: areAudioLevelsEnabled(state),
    };
}

const mapDispatchToProps = {
    onClose: toggleAudioSettings,
    setAudioInputDevice: setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice: setAudioOutputDeviceAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(MeetAudioSettingsPopUp);
