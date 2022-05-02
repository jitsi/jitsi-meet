// @flow

import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { VideoTrack } from '../../../base/media';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';

type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * The class name that will be used for the container.
     */
    containerClassName: string,

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean,

    /**
     * Indicates whether we are currently running in a mobile browser.
     */
    isMobile: boolean,

    /**
     * Click handler.
     */
    onClick: Function,

    /**
     * Mouse enter handler.
     */
    onMouseEnter: Function,

    /**
     * Mouse leave handler.
     */
    onMouseLeave: Function,

     /**
     * Mouse move handler.
     */
    onMouseMove: Function,

    /**
     * Touch end handler.
     */
    onTouchEnd: Function,

    /**
     * Touch move handler.
     */
    onTouchMove: Function,

    /**
     * Touch start handler.
     */
    onTouchStart: Function,

    /**
     * The ID of the virtual screen share participant.
     */
    participantId: string,

    /**
     * An object with the styles for thumbnail.
     */
    styles: Object,

    /**
     * The type of thumbnail.
     */
    thumbnailType: string,

    /**
     * JitsiTrack instance.
     */
    videoTrack: Object
}

const VirtualScreenshareParticipant = ({
    classes,
    containerClassName,
    isHovered,
    isMobile,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    participantId,
    styles,
    videoTrack,
    thumbnailType
}: Props) => {
    const currentLayout = useSelector(getCurrentLayout);
    const videoTrackId = videoTrack?.jitsiTrack?.getId();
    const video = videoTrack && <VideoTrack
        id = { `remoteVideo_${videoTrackId || ''}` }
        muted = { true }
        style = { styles.video }
        videoTrack = { videoTrack } />;


    return (
        <span
            className = { containerClassName }
            id = { `participant_${participantId}` }
            { ...(isMobile
                ? {
                    onTouchEnd,
                    onTouchMove,
                    onTouchStart
                }
                : {
                    onClick,
                    onMouseEnter,
                    onMouseMove,
                    onMouseLeave
                }
            ) }
            style = { styles.thumbnail }>
            {video}
            <div className = { classes.containerBackground } />
            <div
                className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsTopContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailTopIndicators
                    currentLayout = { currentLayout }
                    isHovered = { isHovered }
                    isVirtualScreenshareParticipant = { true }
                    participantId = { participantId }
                    thumbnailType = { thumbnailType } />
            </div>
            <div
                className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsBottomContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailBottomIndicators
                    className = { classes.indicatorsBackground }
                    currentLayout = { currentLayout }
                    local = { false }
                    participantId = { participantId }
                    showStatusIndicators = { false } />
            </div>
        </span>);
};

export default VirtualScreenshareParticipant;
