import { useEffect } from 'react';

import { IStore } from '../../app/types';
import { JitsiTrackEvents } from '../../base/lib-jitsi-meet';
import { trackStreamingStatusChanged } from '../../base/tracks/actions.native';
import { ITrack } from '../../base/tracks/types';

export function useLocalTrackStreamingStatus(
        videoTrack: ITrack | undefined,
        dispatch: IStore['dispatch'],
        handleTrackStreamingStatusChanged: (jitsiTrack: any, streamingStatus: string) => void
) {
    useEffect(() => {
        if (!videoTrack || videoTrack.local) {
            return;
        }

        const jitsiTrack = videoTrack.jitsiTrack;

        jitsiTrack.on(
                        JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                        handleTrackStreamingStatusChanged
        );

        dispatch(trackStreamingStatusChanged(
                        jitsiTrack,
                        jitsiTrack.getTrackStreamingStatus()
        ));

        return () => {
            jitsiTrack.off(
                                JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                                handleTrackStreamingStatusChanged
            );

            dispatch(trackStreamingStatusChanged(
                                jitsiTrack,
                                jitsiTrack.getTrackStreamingStatus()
            ));
        };
    }, [ videoTrack, dispatch, handleTrackStreamingStatusChanged ]);
}
