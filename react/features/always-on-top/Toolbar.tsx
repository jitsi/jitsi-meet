import React, { useCallback, useEffect, useState } from 'react';

import AudioMuteButton from './AudioMuteButton';
import HangupButton from './HangupButton';
import VideoMuteButton from './VideoMuteButton';

const { api } = window.alwaysOnTop!;

/**
 * The type of the React {@code Component} props of {@link Toolbar}.
 */
interface IProps {

    /**
     * Additional CSS class names to add to the root of the toolbar.
     */
    className: string;

    /**
     * Callback invoked when no longer moused over the toolbar.
     */
    onMouseOut: (e?: React.MouseEvent) => void;

    /**
     * Callback invoked when the mouse has moved over the toolbar.
     */
    onMouseOver: (e?: React.MouseEvent) => void;
}

/**
 * Represents the toolbar in the Always On Top window.
 *
 * @param {Partial<IProps>} props - The props of the component.
 * @returns {JSX.Element}
 */
const Toolbar = (props: Partial<IProps>) => {
    const { className = '', onMouseOut, onMouseOver } = props;
    const [ showAudioButton, setShowAudioButton ] = useState(true);
    const [ showVideoButton, setShowVideoButton ] = useState(true);

    const videoConferenceJoinedListener = useCallback(() => {
        // for electron clients that embed the api and are not updated
        if (!api.isVisitor) {
            console.warn('external API not updated');

            return;
        }

        const isNotVisitor = !api.isVisitor();

        setShowAudioButton(isNotVisitor);
        setShowVideoButton(isNotVisitor);
    }, []);

    useEffect(() => {
        api.on('videoConferenceJoined', videoConferenceJoinedListener);

        videoConferenceJoinedListener();

        return () => {
            api.removeListener('videoConferenceJoined', videoConferenceJoinedListener);
        };
    }, []);

    return (
        <div
            className = { `toolbox-content-items always-on-top-toolbox ${className}` }
            onMouseOut = { onMouseOut }
            onMouseOver = { onMouseOver }>
            { showAudioButton && <AudioMuteButton /> }
            { showVideoButton && <VideoMuteButton /> }
            <HangupButton />
        </div>
    );
};

export default Toolbar;
