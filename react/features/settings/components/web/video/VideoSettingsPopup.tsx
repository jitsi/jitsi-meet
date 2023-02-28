import React, { ReactNode } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import {
    setVideoInputDeviceAndUpdateSettings
} from '../../../../base/devices/actions.web';
import {
    getVideoDeviceIds
} from '../../../../base/devices/functions.web';
import Popover from '../../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import { getCurrentCameraDeviceId } from '../../../../base/settings/functions.web';
import { toggleVideoSettings } from '../../../actions';
import { getVideoSettingsVisibility } from '../../../functions.web';

import VideoSettingsContent, { type IProps as VideoSettingsProps } from './VideoSettingsContent';


interface IProps extends VideoSettingsProps {

    /**
    * Component children (the Video button).
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
}: IProps) {
    return (
        <div className = 'video-preview'>
            <Popover
                content = { <VideoSettingsContent
                    currentCameraDeviceId = { currentCameraDeviceId }
                    setVideoInputDevice = { setVideoInputDevice }
                    toggleVideoSettings = { onClose }
                    videoDeviceIds = { videoDeviceIds } /> }
                headingId = 'video-settings-button'
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
function mapStateToProps(state: IReduxState) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        currentCameraDeviceId: getCurrentCameraDeviceId(state),
        isOpen: Boolean(getVideoSettingsVisibility(state)),
        popupPlacement: clientWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end',
        videoDeviceIds: getVideoDeviceIds(state) ?? []
    };
}

const mapDispatchToProps = {
    onClose: toggleVideoSettings,
    setVideoInputDevice: setVideoInputDeviceAndUpdateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoSettingsPopup);
