import { useEffect, useState } from 'react';

import { JitsiTrackEvents } from '../base/lib-jitsi-meet';
import { ITrack } from '../base/tracks/types';

/**
 * Custom hook that listens to the TRACK_STREAMING_STATUS_CHANGED event
 * and returns the current streaming status for the given track.
 *
 * @param {ITrack} track - The track to listen to.
 * @returns {string | undefined} - The current streaming status state.
 */
export function useTrackStreamingStatus(track?: ITrack): string | undefined {
    const [ streamingStatus, setStreamingStatus ] = useState<string | undefined>();
    const sourceName = track?.jitsiTrack?.getSourceName();

    useEffect(() => {
        if (track && !track.local) {
            const handleTrackStreamingStatusChanged = (_jitsiTrack: any, newStreamingStatus: string) => {
                setStreamingStatus(newStreamingStatus);
            };

            track.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleTrackStreamingStatusChanged);

            // Initialize the status
            setStreamingStatus(track.jitsiTrack.getTrackStreamingStatus?.());

            return () => {
                track.jitsiTrack.off(
                    JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    handleTrackStreamingStatusChanged
                );
            };
        }

        // Reset if it becomes local or undefined
        setStreamingStatus(undefined);
    }, [ track, sourceName ]);

    return streamingStatus;
}
