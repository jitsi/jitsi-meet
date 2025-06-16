import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import JitsiMeetJS from '../../base/lib-jitsi-meet/_.web';

const JitsiTrackEvents = JitsiMeetJS.events.track;

/**
 * The type of the React {@code Component} props of {@link AudioInputPreview}.
 */
interface IProps {

    /**
     * The JitsiLocalTrack to show an audio level meter for.
     */
    track: any;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex'
        },

        section: {
            flex: 1,
            height: '4px',
            borderRadius: '1px',
            backgroundColor: theme.palette.ui04,
            marginRight: theme.spacing(1),

            '&:last-of-type': {
                marginRight: 0
            }
        },

        activeSection: {
            backgroundColor: theme.palette.success01
        }
    };
});

const NO_OF_PREVIEW_SECTIONS = 11;

const AudioInputPreview = (props: IProps) => {
    const [ audioLevel, setAudioLevel ] = useState(0);
    const { classes, cx } = useStyles();

    /**
     * Starts listening for audio level updates from the library.
     *
     * @param {JitsiLocalTrack} track - The track to listen to for audio level
     * updates.
     * @private
     * @returns {void}
     */
    function _listenForAudioUpdates(track: any) {
        _stopListeningForAudioUpdates();

        track?.on(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            setAudioLevel);
    }

    /**
     * Stops listening to further updates from the current track.
     *
     * @private
     * @returns {void}
     */
    function _stopListeningForAudioUpdates() {
        props.track?.off(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            setAudioLevel);
    }

    useEffect(() => {
        _listenForAudioUpdates(props.track);

        return _stopListeningForAudioUpdates;
    }, []);

    useEffect(() => {
        _listenForAudioUpdates(props.track);
        setAudioLevel(0);
    }, [ props.track ]);

    const audioMeterFill = Math.ceil(Math.floor(audioLevel * 100) / (100 / NO_OF_PREVIEW_SECTIONS));

    return (
        <div className = { classes.container } >
            {new Array(NO_OF_PREVIEW_SECTIONS).fill(0)
                    .map((_, idx) =>
                        (<div
                            className = { cx(classes.section, idx < audioMeterFill && classes.activeSection) }
                            key = { idx } />)
                    )}
        </div>
    );
};

export default AudioInputPreview;
