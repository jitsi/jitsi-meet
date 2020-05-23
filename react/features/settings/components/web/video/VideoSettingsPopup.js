// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React from 'react';

import {
    getVideoDeviceIds,
    setVideoInputDeviceAndUpdateSettings
} from '../../../../base/devices';
import { connect } from '../../../../base/redux';
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
    setVideoInputDevice,
    videoDeviceIds
}: Props) {
    return (
        <div className = 'video-preview'>
            <InlineDialog
                content = { <VideoSettingsContent
                    currentCameraDeviceId = { currentCameraDeviceId }
                    setVideoInputDevice = { setVideoInputDevice }
                    toggleVideoSettings = { onClose }
                    videoDeviceIds = { videoDeviceIds } /> }
                isOpen = { isOpen }
                onClose = { onClose }
                position = 'top right'>
                { children }
            </InlineDialog>
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
    return {
        currentCameraDeviceId: getCurrentCameraDeviceId(state),
        isOpen: getVideoSettingsVisibility(state),
        videoDeviceIds: getVideoDeviceIds(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleVideoSettings,
    setVideoInputDevice: setVideoInputDeviceAndUpdateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoSettingsPopup);
