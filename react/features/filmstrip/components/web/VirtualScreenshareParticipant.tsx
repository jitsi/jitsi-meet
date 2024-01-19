import clsx from 'clsx';
import React, { TouchEventHandler } from 'react';
import { useSelector } from 'react-redux';

import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { ITrack } from '../../../base/tracks/types';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';

import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';

interface IProps {

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The class name that will be used for the container.
     */
    containerClassName: string;

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean;

    /**
     * Indicates whether the thumbnail is for local screenshare or not.
     */
    isLocal: boolean;

    /**
     * Indicates whether we are currently running in a mobile browser.
     */
    isMobile: boolean;

    /**
     * Click handler.
     */
    onClick: (e?: React.MouseEvent) => void;

    /**
     * Mouse enter handler.
     */
    onMouseEnter: (e?: React.MouseEvent) => void;

    /**
     * Mouse leave handler.
     */
    onMouseLeave: (e?: React.MouseEvent) => void;

    /**
     * Mouse move handler.
     */
    onMouseMove: (e?: React.MouseEvent) => void;

    /**
     * Touch end handler.
     */
    onTouchEnd: TouchEventHandler;

    /**
     * Touch move handler.
     */
    onTouchMove: TouchEventHandler;

    /**
     * Touch start handler.
     */
    onTouchStart: TouchEventHandler;

    /**
     * The ID of the virtual screen share participant.
     */
    participantId: string;

    /**
     * Whether or not to display a tint background over tile.
     */
    shouldDisplayTintBackground: boolean;

    /**
     * An object with the styles for thumbnail.
     */
    styles: any;

    /**
     * The type of thumbnail.
     */
    thumbnailType: string;

    /**
     * JitsiTrack instance.
     */
    videoTrack: ITrack;
}

const VirtualScreenshareParticipant = ({
    classes,
    containerClassName,
    isHovered,
    isLocal,
    isMobile,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    participantId,
    shouldDisplayTintBackground,
    styles,
    videoTrack,
    thumbnailType
}: IProps) => {
    const currentLayout = useSelector(getCurrentLayout);
    const videoTrackId = videoTrack?.jitsiTrack?.getId();
    const video = videoTrack && <VideoTrack
        id = { isLocal ? 'localScreenshare_container' : `remoteVideo_${videoTrackId || ''}` }
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
                    isHovered = { isHovered }
                    participantId = { participantId }
                    thumbnailType = { thumbnailType } />
            </div>
            {shouldDisplayTintBackground && <div className = { classes.tintBackground } />}
            <div
                className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsBottomContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailBottomIndicators
                    className = { classes.indicatorsBackground }
                    local = { false }
                    participantId = { participantId }
                    showStatusIndicators = { true } />
            </div>
        </span>);
};

export default VirtualScreenshareParticipant;
