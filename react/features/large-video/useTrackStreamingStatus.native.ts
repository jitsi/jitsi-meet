import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { JitsiTrackEvents } from '../../base/lib-jitsi-meet';
import { trackStreamingStatusChanged } from '../../base/tracks/actions.native';
import { ITrack } from '../../base/tracks/types';

export function useTrackStreamingStatus(videoTrack?: ITrack): void {
    const dispatch = useDispatch();
    const jitsiTrack = videoTrack?.local ? undefined : videoTrack?.jitsiTrack;

    const sourceName = useMemo(() => {
        return jitsiTrack?.getSourceName?.();
    }, [jitsiTrack]);

    useEffect(() => {
        if (!jitsiTrack) {
            return;
        }

        const handle = (_ignored: any, status: string) => {
            dispatch(trackStreamingStatusChanged(jitsiTrack, status));
        };

        jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handle);

        dispatch(
            trackStreamingStatusChanged(
                jitsiTrack,
                jitsiTrack.getTrackStreamingStatus()
            )
        );

        return () => {
            jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handle);

            dispatch(
                trackStreamingStatusChanged(
                    jitsiTrack,
                    jitsiTrack.getTrackStreamingStatus()
                )
            );
        };
    }, [sourceName, dispatch]);
}

