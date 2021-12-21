// @flow

import React, { useEffect, useState } from 'react';

import { AudioLevelIndicator } from '../../../audio-level-indicator';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';

const JitsiTrackEvents = JitsiMeetJS.events.track;

type Props = {

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object
}

const ThumbnailAudioIndicator = ({
    _audioTrack
}: Props) => {
    const [ audioLevel, setAudioLevel ] = useState(0);

    useEffect(() => {
        setAudioLevel(0);
        if (_audioTrack) {
            const { jitsiTrack } = _audioTrack;

            jitsiTrack && jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
        }

        return () => {
            if (_audioTrack) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
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
