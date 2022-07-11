// @flow

import React from 'react';

import { LocalVideoMenuTriggerButton, RemoteVideoMenuTriggerButton } from '../../../video-menu';

type Props = {

    /**
     * Hide popover callback.
     */
    hidePopover: Function,

    /**
     * Whether or not the button is for the local participant.
     */
    local: boolean,

    /**
     * The id of the participant for which the button is.
     */
    participantId?: string,

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean,

    /**
     * Show popover callback.
     */
    showPopover: Function,

    /**
     * The type of thumbnail.
     */
    thumbnailType: string,

    /**
     * Whether or not the component is visible.
     */
    visible: boolean
}

// eslint-disable-next-line no-confusing-arrow
const VideoMenuTriggerButton = ({
    hidePopover,
    local,
    participantId,
    popoverVisible,
    showPopover,
    thumbnailType,
    visible
}: Props) => local
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
