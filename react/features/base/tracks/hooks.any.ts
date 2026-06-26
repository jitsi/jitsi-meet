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
    const jitsiTrack = track?.jitsiTrack;
    const sourceName = jitsiTrack?.getSourceName();

    const handleStreamingStatusChanged = (changedTrack: any, streamingStatus: string) => {
        dispatch(trackStreamingStatusChanged(changedTrack, streamingStatus));
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

        // The dependency must be the track OBJECT, not its source name: on a P2P<->JVB switch the remote track is
        // replaced by a new JitsiRemoteTrack with the SAME source name. Keying on the source name leaves the
        // listener on the old (removed) track and nobody subscribed to the new one, so once its streaming status
        // tracker is disposed the status is stuck as null in redux and the tile falls back to the avatar while
        // video is in fact flowing.
    }, [ jitsiTrack ]);
}
