import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { JitsiTrackEvents } from '../lib-jitsi-meet';

import { trackStreamingStatusChanged } from './actions.any';
import { ITrack } from './types';

/**
 * Syncs the initial track streaming status into redux and keeps it in sync via events.
 *
 * @param {ITrack | undefined} track - The track to sync.
 * @returns {void}
 */
export function useTrackStreamingStatus(track: ITrack | undefined) {
    const dispatch = useDispatch();
    const sourceName = track?.jitsiTrack?.getSourceName();

    const handleStreamingStatusChanged = (jitsiTrack: any, streamingStatus: string) => {
        dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    };

    useEffect(() => {
        if (!track || track.local) {
            return;
        }

        track.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleStreamingStatusChanged);
        dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));

        return () => {
            track.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
        };
    }, [ sourceName ]);
}
