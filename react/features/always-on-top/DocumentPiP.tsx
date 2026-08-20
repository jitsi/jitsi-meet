import React, { useCallback, useEffect, useRef, useState } from 'react';

import MediaCastReceiver from '../base/media-cast/MediaCastReceiver';
import type { MediaCastSignal, MediaCastSignalHandler } from '../base/media-cast/types.web';

import AlwaysOnTopView from './AlwaysOnTopView';

/**
 * External API instance exposed to the dedicated Document PiP window.
 */
const { api } = window.alwaysOnTop;

/**
 * Delay in milliseconds before hiding the PiP toolbar after pointer activity stops.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * Layout applied to the React-owned video element without cropping shared content.
 */
const VIDEO_STYLE: React.CSSProperties = {
    height: '100%',
    left: 0,
    objectFit: 'contain',
    position: 'absolute',
    top: 0,
    width: '100%'
};

/**
 * Participant metadata rendered by the shared always-on-top presentation.
 */
interface IParticipantState {
    /** Participant avatar URL. */
    avatarURL: string;

    /** Configured avatar background palette. */
    customAvatarBackgrounds: string[];

    /** Participant display name used for avatar hashing. */
    displayName: string;

    /** Participant display name formatted for presentation. */
    formattedDisplayName: string;
}

/**
 * Signals received from the meeting iframe before the media-cast receiver is ready are buffered
 * here and flushed once the receiver registers itself. The host forwards signals through the
 * embedder API, which is available from the moment this bundle executes, so buffering must start
 * at module scope rather than on React mount.
 */
const pendingSignals: MediaCastSignal[] = [];

/**
 * The signal handler the media-cast receiver has registered, if any.
 */
let receiverSignalHandler: MediaCastSignalHandler | undefined;

/**
 * Whether the API signal listener is currently registered.
 */
let signalBridgeRegistered = false;

/**
 * Forwards one media-cast signal to the receiver, buffering it until the receiver is ready.
 *
 * @param {Object} payload - Event payload received from the embedder API.
 * @param {MediaCastSignal} payload.signal - The signal to forward.
 * @returns {void}
 */
const onSignal = ({ signal }: { signal: MediaCastSignal; }) => {
    if (receiverSignalHandler) {
        receiverSignalHandler(signal);
    } else {
        pendingSignals.push(signal);
    }
};

/**
 * Registers the media-cast receiver's signal handler, flushing any buffered signals, and returns
 * a function that unregisters it.
 *
 * @param {MediaCastSignalHandler} handler - The receiver's signal handler.
 * @returns {Function} Unregister function.
 */
const registerSignalHandler = (handler: MediaCastSignalHandler): (() => void) => {
    receiverSignalHandler = handler;

    for (const signal of pendingSignals.splice(0)) {
        handler(signal);
    }

    return () => {
        if (receiverSignalHandler === handler) {
            receiverSignalHandler = undefined;
        }
    };
};

/**
 * Registers the API listener at most once. It is invoked at module load so signals arriving before
 * React mounts are buffered, and again on mount to tolerate development-only remounts.
 *
 * @returns {void}
 */
const registerSignalBridge = () => {
    if (signalBridgeRegistered) {
        return;
    }

    signalBridgeRegistered = true;
    api.on('_documentPiPSignal', onSignal);
};

/**
 * Removes the API listener and clears all receiver and buffered-signal references.
 *
 * @returns {void}
 */
const cleanupSignalBridge = () => {
    if (signalBridgeRegistered) {
        api.removeListener('_documentPiPSignal', onSignal);
        signalBridgeRegistered = false;
    }

    receiverSignalHandler = undefined;
    pendingSignals.length = 0;
};

registerSignalBridge();

/**
 * Document PiP renderer backed by a media-cast receiver.
 *
 * @returns {ReactElement}
 */
export default function DocumentPiP() {
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

        registerSignalBridge();

        const receiver = new MediaCastReceiver({
            onError: error => console.error('Document PiP receiver failed', error),
            onSignal: signal => api._sendDocumentPiPSignal(signal),
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
            receiver.dispose();
            cleanupSignalBridge();
        };
    }, []);

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
