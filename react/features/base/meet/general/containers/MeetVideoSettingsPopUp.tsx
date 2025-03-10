import React from "react";
import { connect } from "react-redux";

import { IReduxState } from "../../../../app/types";
import { toggleVideoSettings } from "../../../../settings/actions.web";
import VideoSettingsContent from "../../../../settings/components/web/video/VideoSettingsContent";
import { getVideoSettingsVisibility } from "../../../../settings/functions.any";
import { setVideoInputDeviceAndUpdateSettings } from "../../../devices/actions.web";
import { getVideoDeviceIds } from "../../../devices/functions.web";
import { getCurrentCameraDeviceId } from "../../../settings/functions.web";

interface MeetVideoSettingsPopUpProps {
    currentCameraDeviceId: string;
    isOpen: boolean;
    videoDeviceIds: string[];
    setVideoInputDevice: Function;
    onClose: Function;
}

const MeetVideoSettingsPopUp = ({
    currentCameraDeviceId,
    videoDeviceIds,
    setVideoInputDevice,
    onClose,
}: MeetVideoSettingsPopUpProps) => {
    return (
        <div className="flex p-1 rounded-xl">
            <VideoSettingsContent
                currentCameraDeviceId={currentCameraDeviceId}
                setVideoInputDevice={setVideoInputDevice}
                toggleVideoSettings={onClose}
                videoDeviceIds={videoDeviceIds}
            />
        </div>
    );
};

function mapStateToProps(state: IReduxState) {
    return {
        currentCameraDeviceId: getCurrentCameraDeviceId(state),
        isOpen: Boolean(getVideoSettingsVisibility(state)),
        videoDeviceIds: getVideoDeviceIds(state) ?? [],
    };
}

const mapDispatchToProps = {
    onClose: toggleVideoSettings,
    setVideoInputDevice: setVideoInputDeviceAndUpdateSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(MeetVideoSettingsPopUp);
