import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconConnection, IconConnectionInactive } from '../../../base/icons/svg';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { trackStreamingStatusChanged } from '../../../base/tracks/actions.web';
import { ITrack } from '../../../base/tracks/types';

interface IProps {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<'icon' | 'inactiveIcon', string>>;

    /**
     * A CSS class that interprets the current connection status as a color.
     */
    colorClass: string;

    /**
     * Disable/enable inactive indicator.
     */
    connectionIndicatorInactiveDisabled: boolean;

    /**
     * Whether or not the connection status is inactive.
     */
    isConnectionStatusInactive: boolean;

    /**
     * Whether or not the connection status is interrupted.
     */
    isConnectionStatusInterrupted?: boolean;

    /**
     * JitsiTrack instance.
     */
    track?: ITrack;
}

export const ConnectionIndicatorIcon = ({
    classes,
    colorClass,
    connectionIndicatorInactiveDisabled,
    isConnectionStatusInactive,
    isConnectionStatusInterrupted,
    track
}: IProps) => {
    const { cx } = useStyles();
    const dispatch = useDispatch();
    const sourceName = track?.jitsiTrack?.getSourceName();

    const handleTrackStreamingStatusChanged = (jitsiTrack: any, streamingStatus: string) => {
        dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    };

    // TODO: replace this with a custom hook to be reused where track streaming status is needed.
    // TODO: In the hood the listener should updates a local track streaming status instead of that in redux store.
    useEffect(() => {
        if (track && !track.local) {
            track.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleTrackStreamingStatusChanged);

            dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
        }

        return () => {
            if (track && !track.local) {
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
                    className = { cx(classes?.icon, classes?.inactiveIcon, colorClass) }
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
                className = { cx(classes?.icon, colorClass) }
                size = { 16 }
                src = { IconConnection } />
        </span>
    );
};
