import React, { useEffect, useRef } from 'react';

/**
 * The type of the React {@code Component} props of {@link SecondScreenVideo}.
 */
interface IProps {

    /**
     * Extra CSS class(es) controlling sizing/object-fit (e.g. {@code cover} for
     * camera tiles, {@code screen} for shared screens). The element always fills
     * its container; the default object-fit is {@code contain}.
     */
    className?: string;

    /**
     * The native meeting track to render in the second window.
     */
    track: MediaStreamTrack;

    /**
     * The second-screen window the video is portaled into. Its own
     * {@code MediaStream} constructor is used so the (child-realm) {@code <video>}
     * renders the meeting track by reference.
     */
    win: Window;
}

/**
 * Fills the container; object-fit comes from the {@code second-screen-video} CSS
 * class so callers can override it (e.g. cover for camera tiles).
 */
const VIDEO_STYLE: React.CSSProperties = {
    background: '#000',
    height: '100%',
    width: '100%'
};

/**
 * Renders a meeting track into the second-screen window by cloning it and
 * wrapping the clone in that window's own {@code MediaStream}. This mirrors the
 * feature's original imperative {@code renderTrack}, but driven by React so the
 * clone is stopped automatically when the component unmounts or the track
 * changes. Cloning into the window's own {@code MediaStream} (rather than
 * attaching the meeting-realm stream directly) keeps the {@code srcObject} in the
 * same window realm as the {@code <video>}.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenVideo = ({ className = '', track, win }: IProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        let clone: MediaStreamTrack | undefined;

        if (video) {
            clone = track.clone();
            video.srcObject = new (win as Window & { MediaStream: typeof MediaStream; }).MediaStream([ clone ]);
        }

        return () => {
            clone?.stop();
            if (video) {
                video.srcObject = null;
            }
        };
    }, [ track, win ]);

    return (
        <video
            autoPlay = { true }
            className = { `second-screen-video ${className}`.trim() }
            muted = { true }
            playsInline = { true }
            ref = { videoRef }
            style = { VIDEO_STYLE } />
    );
};

export default SecondScreenVideo;
