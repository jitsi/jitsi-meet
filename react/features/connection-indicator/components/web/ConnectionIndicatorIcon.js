// @flow

import clsx from 'clsx';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getSourceNameSignalingFeatureFlag } from '../../../base/config';
import { Icon, IconConnectionActive, IconConnectionInactive } from '../../../base/icons';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { trackStreamingStatusChanged } from '../../../base/tracks';

type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * A CSS class that interprets the current connection status as a color.
     */
    colorClass: string,

    /**
     * Disable/enable inactive indicator.
     */
     connectionIndicatorInactiveDisabled: boolean,

    /**
     * JitsiTrack instance.
     */
    track: Object,

    /**
     * Whether or not the connection status is inactive.
     */
    isConnectionStatusInactive: boolean,

    /**
     * Whether or not the connection status is interrupted.
     */
    isConnectionStatusInterrupted: boolean,
}

export const ConnectionIndicatorIcon = ({
    classes,
    colorClass,
    connectionIndicatorInactiveDisabled,
    isConnectionStatusInactive,
    isConnectionStatusInterrupted,
    track
}: Props) => {
    const sourceNameSignalingEnabled = useSelector(state => getSourceNameSignalingFeatureFlag(state));
    const dispatch = useDispatch();
    const sourceName = track?.jitsiTrack?.getSourceName();

    const handleTrackStreamingStatusChanged = streamingStatus => {
        dispatch(trackStreamingStatusChanged(track.jitsiTrack, streamingStatus));
    };

    // TODO: replace this with a custom hook to be reused where track streaming status is needed.
    // TODO: In the hood the listener should updates a local track streaming status instead of that in redux store.
    useEffect(() => {
        if (track && !track.local && sourceNameSignalingEnabled) {
            track.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleTrackStreamingStatusChanged);

            dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
        }

        return () => {
            if (track && !track.local && sourceNameSignalingEnabled) {
                track.jitsiTrack.off(
                    JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    handleTrackStreamingStatusChanged
                );

                dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
            }
        };
    }, [ sourceName ]);

    if (isConnectionStatusInactive) {
        if (connectionIndicatorInactiveDisabled) {
            return null;
        }

        return (
            <span className = 'connection_ninja'>
                <Icon
                    className = { clsx(classes.icon, classes.inactiveIcon, colorClass) }
                    size = { 24 }
                    src = { IconConnectionInactive } />
            </span>
        );
    }

    let emptyIconWrapperClassName = 'connection_empty';

    if (isConnectionStatusInterrupted) {
        // emptyIconWrapperClassName is used by the torture tests to identify lost connection status handling.
        emptyIconWrapperClassName = 'connection_lost';
    }

    return (
        <span className = { emptyIconWrapperClassName }>
            <Icon
                className = { clsx(classes.icon, colorClass) }
                size = { 12 }
                src = { IconConnectionActive } />
        </span>
    );
};
