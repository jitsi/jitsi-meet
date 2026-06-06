import React, { useEffect, useState } from 'react';

import AudioLevelIndicator from '../../../audio-level-indicator/components/AudioLevelIndicator';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { ITrack } from '../../../base/tracks/types';

const JitsiTrackEvents = JitsiMeetJS.events.track;

interface IProps {

    /**
     * The audio track related to the participant.
     */
    _audioTrack?: ITrack;
}

const ThumbnailAudioIndicator = ({
    _audioTrack
}: IProps) => {
    const [ audioLevel, setAudioLevel ] = useState(0);

    useEffect(() => {
        setAudioLevel(0);
        if (_audioTrack) {
            const { jitsiTrack } = _audioTrack;

            jitsiTrack?.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
        }

        return () => {
            if (_audioTrack) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
            }
        };
    }, [ _audioTrack ]);

    return (
        <span className = 'audioindicator-container'>
            <AudioLevelIndicator audioLevel = { audioLevel } />
        </span>
    );
};

export default ThumbnailAudioIndicator;
