import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { JitsiTrackEvents } from '../../base/lib-jitsi-meet';
import { trackStreamingStatusChanged } from '../../base/tracks/actions.native';
import { ITrack } from '../../base/tracks/types';

/**
 * Custom hook to manage track streaming status.
 * Listens to track streaming status changes and dispatches appropriate actions.
 * Only processes non-local video tracks.
 *
 * @param {ITrack | undefined} videoTrack - The video track to monitor.
 * @returns {void}
 */
export function useTrackStreamingStatus(videoTrack: ITrack | undefined): void {
    const dispatch = useDispatch();

    useEffect(() => {
        // Only process non-local tracks
        if (!videoTrack || videoTrack.local) {
            return;
        }

        const { jitsiTrack } = videoTrack;

        /**
         * Handler for track streaming status changes.
         * Dispatches an action to update the track streaming status in the app state.
         *
         * @param {any} track - The JitsiTrack instance.
         * @param {string} streamingStatus - The updated streaming status.
         * @returns {void}
         */
        const handleTrackStreamingStatusChanged = (track: any, streamingStatus: string) => {
            dispatch(trackStreamingStatusChanged(track, streamingStatus));
        };

        // Subscribe to track streaming status change events
        jitsiTrack.on(
            JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
            handleTrackStreamingStatusChanged
        );

        // Dispatch initial status update
        const currentStatus = jitsiTrack.getTrackStreamingStatus();

        dispatch(trackStreamingStatusChanged(jitsiTrack, currentStatus));

        // Cleanup: Remove event listener when component unmounts or track changes
        return () => {
            jitsiTrack.off(
                JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                handleTrackStreamingStatusChanged
            );

            // Dispatch final status update on cleanup
            const finalStatus = jitsiTrack.getTrackStreamingStatus();

            dispatch(trackStreamingStatusChanged(jitsiTrack, finalStatus));
        };
    }, [ videoTrack, dispatch ]);
}
