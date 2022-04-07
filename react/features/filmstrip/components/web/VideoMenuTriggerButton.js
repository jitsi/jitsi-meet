// @flow

import React from 'react';

import { LocalVideoMenuTriggerButton, RemoteVideoMenuTriggerButton } from '../../../video-menu';

type Props = {

    /**
     * The current layout of the filmstrip.
     */
    currentLayout: string,

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
     * Whether or not the component is visible.
     */
    visible: boolean
}

// eslint-disable-next-line no-confusing-arrow
const VideoMenuTriggerButton = ({
    currentLayout,
    hidePopover,
    local,
    participantId,
    popoverVisible,
    showPopover,
    visible
}: Props) => local
    ? (
        <span id = 'localvideomenu'>
            <LocalVideoMenuTriggerButton
                buttonVisible = { visible }
                currentLayout = { currentLayout }
                hidePopover = { hidePopover }
                popoverVisible = { popoverVisible }
                showPopover = { showPopover } />
        </span>
    )
    : (
        <span id = 'remotevideomenu'>
            <RemoteVideoMenuTriggerButton
                buttonVisible = { visible }
                currentLayout = { currentLayout }
                hidePopover = { hidePopover }
                participantID = { participantId }
                popoverVisible = { popoverVisible }
                showPopover = { showPopover } />
        </span>
    );

export default VideoMenuTriggerButton;
