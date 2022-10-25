// @flow

import React from 'react';

import {
    getVideoDeviceIds,
    setVideoInputDeviceAndUpdateSettings
} from '../../../../base/devices';
import Popover from '../../../../base/popover/components/Popover.web';
import { connect } from '../../../../base/redux';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import { getCurrentCameraDeviceId } from '../../../../base/settings';
import { toggleVideoSettings } from '../../../actions';
import { getVideoSettingsVisibility } from '../../../functions';

import VideoSettingsContent, { type Props as VideoSettingsProps } from './VideoSettingsContent';


type Props = VideoSettingsProps & {

    /**
    * Component children (the Video button).
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
 * Popup with a preview of all the video devices.
 *
 * @returns {ReactElement}
 */
function VideoSettingsPopup({
    currentCameraDeviceId,
    children,
    isOpen,
    onClose,
    popupPlacement,
    setVideoInputDevice,
    videoDeviceIds
}: Props) {
    return (
        <div className = 'video-preview'>
            <Popover
                content = { <VideoSettingsContent
                    currentCameraDeviceId = { currentCameraDeviceId }
                    setVideoInputDevice = { setVideoInputDevice }
                    toggleVideoSettings = { onClose }
                    videoDeviceIds = { videoDeviceIds } /> }
                onPopoverClose = { onClose }
                position = { popupPlacement }
                trigger = 'click'
                visible = { isOpen }>
                { children }
            </Popover>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the associated {@code VideoSettingsPopup}'s
 * props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        currentCameraDeviceId: getCurrentCameraDeviceId(state),
        isOpen: getVideoSettingsVisibility(state),
        popupPlacement: clientWidth <= SMALL_MOBILE_WIDTH ? 'auto' : 'top-end',
        videoDeviceIds: getVideoDeviceIds(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleVideoSettings,
    setVideoInputDevice: setVideoInputDeviceAndUpdateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoSettingsPopup);
