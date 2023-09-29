import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

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

import VideoSettingsContent from './VideoSettingsContent';


interface IProps {

    /**
    * Component children (the Video button).
    */
    children: ReactNode;

    /**
     * The deviceId of the camera device currently being used.
     */
    currentCameraDeviceId: string;

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

    /**
     * Callback invoked to change current camera.
     */
    setVideoInputDevice: Function;

    /**
     * All the camera device ids currently connected.
     */
    videoDeviceIds: string[];
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            background: 'none',
            display: 'inline-block'
        }
    };
});

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
    const { classes, cx } = useStyles();

    return (
        <div className = { cx('video-preview', classes.container) }>
            <Popover
                allowClick = { true }
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
