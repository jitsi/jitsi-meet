import React from 'react';

import LocalVideoMenuTriggerButton from '../../../video-menu/components/web/LocalVideoMenuTriggerButton';
import RemoteVideoMenuTriggerButton from '../../../video-menu/components/web/RemoteVideoMenuTriggerButton';

interface IProps {

    /**
     * Hide popover callback.
     */
    hidePopover?: Function;

    /**
     * Whether or not the button is for the local participant.
     */
    local?: boolean;

    /**
     * The id of the participant for which the button is.
     */
    participantId?: string;

    /**
     * Whether popover is visible or not.
     */
    popoverVisible?: boolean;

    /**
     * Show popover callback.
     */
    showPopover?: Function;

    /**
     * The type of thumbnail.
     */
    thumbnailType: string;

    /**
     * Whether or not the component is visible.
     */
    visible: boolean;
}

// eslint-disable-next-line no-confusing-arrow
const VideoMenuTriggerButton = ({
    hidePopover,
    local,
    participantId = '',
    popoverVisible,
    showPopover,
    thumbnailType,
    visible
}: IProps) => local
    ? (
        <span id = 'localvideomenu'>
            <LocalVideoMenuTriggerButton
                buttonVisible = { visible }
                hidePopover = { hidePopover }
                popoverVisible = { popoverVisible }
                showPopover = { showPopover }
                thumbnailType = { thumbnailType } />
        </span>
    )
    : (
        <span id = 'remotevideomenu'>
            <RemoteVideoMenuTriggerButton
                buttonVisible = { visible }
                hidePopover = { hidePopover }
                participantID = { participantId }
                popoverVisible = { popoverVisible }
                showPopover = { showPopover }
                thumbnailType = { thumbnailType } />
        </span>
    );

export default VideoMenuTriggerButton;
