import React, { useCallback, useEffect, useRef, useState } from 'react';

import MediaCastReceiver from '../../../modules/media-cast/MediaCastReceiver';
import type { MediaCastSignal, MediaCastSignalHandler } from '../../../modules/media-cast/types';

import AlwaysOnTopView from './AlwaysOnTopView';

const { api } = window.alwaysOnTop;
const TOOLBAR_TIMEOUT = 4000;
const VIDEO_STYLE: React.CSSProperties = {
    height: '100%',
    left: 0,
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    width: '100%'
};

interface IParticipantState {
    avatarURL: string;
    customAvatarBackgrounds: string[];
    displayName: string;
    formattedDisplayName: string;
}

interface IProps {
    registerSignalHandler: (handler: MediaCastSignalHandler) => () => void;
    sendSignal: (signal: MediaCastSignal) => void;
}

/**
 * Document PiP renderer backed by a media-cast receiver.
 *
 * @returns {ReactElement}
 */
export default function DocumentPiP({ registerSignalHandler, sendSignal }: IProps) {
    const [ participant, setParticipant ] = useState<IParticipantState>({
        avatarURL: '',
        customAvatarBackgrounds: [],
        displayName: '',
        formattedDisplayName: ''
    });
    const [ sourceVisible, setSourceVisible ] = useState(
        () => Boolean(api._isLargeVideoVisible() || api._isPrejoinVideoVisible()));
    const [ toolbarVisible, setToolbarVisible ] = useState(true);
    const [ track, setTrack ] = useState<MediaStreamTrack | null>(null);
    const [ trackMuted, setTrackMuted ] = useState(true);
    const hoveredRef = useRef(false);
    const toolbarTimerRef = useRef<number | undefined>(undefined);
    const videoRef = useRef<HTMLVideoElement>(null);

    const updateParticipant = useCallback(() => {
        const userID = api._getOnStageParticipant();

        setParticipant(current => ({
            ...current,
            avatarURL: api.getAvatarURL(userID),
            displayName: api.getDisplayName(userID),
            formattedDisplayName: api._getFormattedDisplayName(userID)
        }));

        setSourceVisible(Boolean(api._isLargeVideoVisible() || api._isPrejoinVideoVisible()));
    }, []);

    const scheduleToolbarHide = useCallback(() => {
        const hideWhenIdle = () => {
            if (hoveredRef.current) {
                toolbarTimerRef.current = window.setTimeout(hideWhenIdle, TOOLBAR_TIMEOUT);
            } else {
                setToolbarVisible(false);
            }
        };

        window.clearTimeout(toolbarTimerRef.current);
        toolbarTimerRef.current = window.setTimeout(hideWhenIdle, TOOLBAR_TIMEOUT);
    }, []);
    const onMouseOut = useCallback(() => {
        hoveredRef.current = false;
    }, []);
    const onMouseOver = useCallback(() => {
        hoveredRef.current = true;
    }, []);

    useEffect(() => {
        let active = true;
        const receiver = new MediaCastReceiver({
            onError: error => console.error('Document PiP receiver failed', error),
            onSignal: sendSignal,
            onTrack: nextTrack => {
                if (active) {
                    setTrack(nextTrack);
                }
            }
        });
        const unregister = registerSignalHandler(signal => receiver.handleSignal(signal));

        return () => {
            active = false;
            unregister();
            receiver.stop();
        };
    }, [ registerSignalHandler, sendSignal ]);

    useEffect(() => {
        if (!track) {
            setTrackMuted(true);

            return;
        }

        const updateMuted = () => setTrackMuted(track.muted || track.readyState !== 'live');

        track.addEventListener('mute', updateMuted);
        track.addEventListener('unmute', updateMuted);
        track.addEventListener('ended', updateMuted);
        updateMuted();

        return () => {
            track.removeEventListener('mute', updateMuted);
            track.removeEventListener('unmute', updateMuted);
            track.removeEventListener('ended', updateMuted);
        };
    }, [ track ]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.srcObject = track ? new MediaStream([ track ]) : null;

        return () => {
            video.srcObject = null;
        };
    }, [ track ]);

    useEffect(() => {
        const avatarChanged = ({ avatarURL, id }: { avatarURL: string; id: string; }) => {
            if (api._getOnStageParticipant() === id) {
                setParticipant(current => ({
                    ...current,
                    avatarURL
                }));
            }
        };
        const displayNameChanged = ({ displayname, formattedDisplayName, id }: {
            displayname: string;
            formattedDisplayName: string;
            id: string;
        }) => {
            if (api._getOnStageParticipant() === id) {
                setParticipant(current => ({
                    ...current,
                    displayName: displayname,
                    formattedDisplayName
                }));
            }
        };

        api.on('avatarChanged', avatarChanged);
        api.on('displayNameChange', displayNameChanged);
        api.on('largeVideoChanged', updateParticipant);
        api.on('prejoinVideoChanged', updateParticipant);
        api.on('videoConferenceJoined', updateParticipant);
        updateParticipant();

        api.getCustomAvatarBackgrounds()
            .then(({ avatarBackgrounds = [] }: { avatarBackgrounds?: string[]; }) => {
                setParticipant(current => ({
                    ...current,
                    customAvatarBackgrounds: avatarBackgrounds
                }));
            })
            .catch(console.error);

        return () => {
            api.removeListener('avatarChanged', avatarChanged);
            api.removeListener('displayNameChange', displayNameChanged);
            api.removeListener('largeVideoChanged', updateParticipant);
            api.removeListener('prejoinVideoChanged', updateParticipant);
            api.removeListener('videoConferenceJoined', updateParticipant);
        };
    }, [ updateParticipant ]);

    useEffect(() => {
        const onMouseMove = () => {
            setToolbarVisible(true);
            scheduleToolbarHide();
        };

        window.addEventListener('mousemove', onMouseMove);
        scheduleToolbarHide();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.clearTimeout(toolbarTimerRef.current);
        };
    }, [ scheduleToolbarHide ]);

    const isVideoDisplayed = Boolean(track && !trackMuted && sourceVisible);

    return (
        <AlwaysOnTopView
            avatarURL = { participant.avatarURL }
            customAvatarBackgrounds = { participant.customAvatarBackgrounds }
            displayName = { participant.displayName }
            formattedDisplayName = { participant.formattedDisplayName }
            isVideoDisplayed = { isVideoDisplayed }
            onMouseOut = { onMouseOut }
            onMouseOver = { onMouseOver }
            toolbarVisible = { toolbarVisible }>
            <video
                autoPlay = { true }
                hidden = { !isVideoDisplayed }
                muted = { true }
                playsInline = { true }
                ref = { videoRef }
                style = { VIDEO_STYLE } />
        </AlwaysOnTopView>
    );
}
