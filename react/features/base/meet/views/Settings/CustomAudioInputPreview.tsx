import React, { useEffect, useState } from "react";
import JitsiMeetJS from "../../../lib-jitsi-meet/_.web";

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

const BAR_HEIGHTS = [20, 8, 26, 8, 20];
const NUM_BARS = 5;

const AudioInputPreview = (props: IProps) => {
    const [audioLevel, setAudioLevel] = useState(0);

    /**
     * Starts listening for audio level updates from the library.
     */
    function _listenForAudioUpdates(track: any) {
        _stopListeningForAudioUpdates();

        track?.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
    }

    /**
     * Stops listening to further updates from the current track.
     */
    function _stopListeningForAudioUpdates() {
        props.track?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, setAudioLevel);
    }

    useEffect(() => {
        _listenForAudioUpdates(props.track);
        return _stopListeningForAudioUpdates;
    }, []);

    useEffect(() => {
        _listenForAudioUpdates(props.track);
        setAudioLevel(0);
    }, [props.track]);

    const activeBars = Math.ceil(audioLevel * NUM_BARS);

    return (
        <div className="flex items-center justify-center w-fit h-full">
            <div className="flex items-end gap-1.5 h-10 p-1">
                {BAR_HEIGHTS.map((baseHeight, index) => {
                    const isActive = index < activeBars;
                    const barClass = isActive ? "bg-primary" : "bg-primary/20";

                    return (
                        <div key={index} className="flex h-full items-center justify-center">
                            <div
                                className={`w-0.5 rounded-full transition-all duration-100 ease-in-out min-h-0.5 ${barClass}`}
                                style={{ height: `${baseHeight}px` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AudioInputPreview;
