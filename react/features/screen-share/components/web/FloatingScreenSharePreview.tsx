import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { setAudioMuted, setVideoMuted } from '../../../base/media/actions';
import { MEDIA_TYPE, VIDEO_MUTISM_AUTHORITY } from '../../../base/media/constants';
import { IconEnlarge } from '../../../base/icons/svg';
import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { getLocalDesktopTrack, getTrackState, isLocalTrackMuted } from '../../../base/tracks/functions.any';
import { isScreenVideoShared } from '../../functions';
import { startScreenShareFlow } from '../../actions.web';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import HangupButton from '../../../toolbox/components/HangupButton';
import ShareDesktopButton from '../../../toolbox/components/web/ShareDesktopButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';

const FLOATING_PREVIEW_STORAGE_KEY = 'floatingScreenSharePreviewPosition';
const FLOATING_PREVIEW_VIDEO_ID = 'floating-screen-share-preview-video';
const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 180;
const MIN_HEIGHT = 140;
const TOOLBAR_HEIGHT = 48;
const HEADER_HEIGHT = 32;
const BORDER = 8;

const DOC_PIP_WIDTH = 320;
const DOC_PIP_HEIGHT = 280;

const PIP_MESSAGE = {
    TOGGLE_AUDIO: 'PIP_TOGGLE_AUDIO',
    TOGGLE_VIDEO: 'PIP_TOGGLE_VIDEO',
    STOP_SCREEN_SHARE: 'PIP_STOP_SCREEN_SHARE',
    STATE_UPDATE: 'PIP_STATE_UPDATE'
} as const;

const PIP_BROADCAST_CHANNEL = 'medistack-pip-controls';

const PIP_BTN_IDS = {
    MIC: 'pip-mic-btn',
    CAM: 'pip-cam-btn'
} as const;

const PIP_ICONS = {
    mic: '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 1.5C9.51472 1.5 7.5 3.51472 7.5 6V12C7.5 14.4853 9.51472 16.5 12 16.5C14.4853 16.5 16.5 14.4853 16.5 12V6C16.5 3.51472 14.4853 1.5 12 1.5ZM15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z"/><path fill="currentColor" d="M11.25 19.463C7.46001 19.0867 4.5 15.889 4.5 12V10.5C4.5 10.0858 4.83579 9.75 5.25 9.75C5.66421 9.75 6 10.0858 6 10.5V12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12V10.5C18 10.0858 18.3358 9.75 18.75 9.75C19.1642 9.75 19.5 10.0858 19.5 10.5V12C19.5 15.889 16.54 19.0867 12.75 19.463V21.75C12.75 22.1642 12.4142 22.5 12 22.5C11.5858 22.5 11.25 22.1642 11.25 21.75V19.463Z"/></svg>',
    micSlash: '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.5 6.43934V6C16.5 3.51472 14.4853 1.5 12 1.5C9.51472 1.5 7.5 3.51472 7.5 6V12C7.5 12.9719 7.80809 13.8718 8.33194 14.6074L7.26011 15.6792C6.47031 14.6632 6 13.3865 6 12V10.5C6 10.0858 5.66421 9.75 5.25 9.75C4.83579 9.75 4.5 10.0858 4.5 10.5V12C4.5 13.801 5.13477 15.4536 6.19279 16.7465L3.21967 19.7197C2.92678 20.0126 2.92678 20.4874 3.21967 20.7803C3.51256 21.0732 3.98744 21.0732 4.28033 20.7803L20.7803 4.28033C21.0732 3.98744 21.0732 3.51256 20.7803 3.21967C20.4874 2.92678 20.0126 2.92678 19.7197 3.21967L16.5 6.43934ZM15 7.93934V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 12.5564 9.15145 13.0773 9.41536 13.524L15 7.93934Z"/></svg>',
    video: '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M17.25 16.2258V16.5C17.25 18.1569 15.9069 19.5 14.25 19.5H4.5C2.84315 19.5 1.5 18.1569 1.5 16.5V7.5C1.5 5.84315 2.84315 4.5 4.5 4.5H14.25C15.9069 4.5 17.25 5.84315 17.25 7.5V7.7742L20.0838 5.58813C21.0699 4.82739 22.5 5.53034 22.5 6.7758V17.2242C22.5 18.4697 21.0699 19.1726 20.0838 18.4119L17.25 16.2258ZM4.5 6H14.25C15.0784 6 15.75 6.67157 15.75 7.5V16.5C15.75 17.3284 15.0784 18 14.25 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5C3 6.67157 3.67157 6 4.5 6Z"/></svg>',
    videoOff: '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M20.7803 3.21967C21.0732 3.51256 21.0732 3.98744 20.7803 4.28033L4.28033 20.7803C3.98744 21.0732 3.51256 21.0732 3.21967 20.7803C2.92678 20.4874 2.92678 20.0126 3.21967 19.7197L19.7197 3.21967C20.0126 2.92678 20.4874 2.92678 20.7803 3.21967Z"/><path fill="currentColor" d="M21 6.75C21 6.33579 21.3358 6 21.75 6C22.1642 6 22.5 6.33579 22.5 6.75V17.2242C22.5 18.4697 21.0699 19.1726 20.0838 18.4119L17.25 16.2258V16.5C17.25 18.1569 15.9069 19.5 14.25 19.5H9C8.58579 19.5 8.25 19.1642 8.25 18.75C8.25 18.3358 8.58579 18 9 18H14.25C15.0784 18 15.75 17.3284 15.75 16.5V12C15.75 11.5858 16.0858 11.25 16.5 11.25C16.9142 11.25 17.25 11.5858 17.25 12V14.3313L21 17.2242V6.75Z"/></svg>'
} as const;

function getDefaultPosition() {
    try {
        const stored = localStorage.getItem(FLOATING_PREVIEW_STORAGE_KEY);
        if (stored) {
            const { x, y } = JSON.parse(stored);
            if (typeof x === 'number' && typeof y === 'number') {
                return { x, y };
            }
        }
    } catch {
        // ignore
    }
    return {
        x: window.innerWidth - DEFAULT_WIDTH - BORDER,
        y: window.innerHeight - DEFAULT_HEIGHT - TOOLBAR_HEIGHT - HEADER_HEIGHT - BORDER
    };
}

function clampPosition(x: number, y: number) {
    const maxX = window.innerWidth - DEFAULT_WIDTH - BORDER;
    const maxY = window.innerHeight - MIN_HEIGHT - TOOLBAR_HEIGHT - HEADER_HEIGHT - BORDER;
    return {
        x: Math.max(BORDER, Math.min(x, maxX)),
        y: Math.max(BORDER, Math.min(y, maxY))
    };
}

/**
 * A floating, draggable window shown when the local user is screen sharing.
 * Displays a small preview and a bottom bar with mute, video, stop share, and hangup.
 * Similar to Google Meet's screen share preview; position is movable and persisted.
 */
export default function FloatingScreenSharePreview() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const store = useStore() as IStore;
    const isSharing = useSelector(isScreenVideoShared);
    const desktopTrack = useSelector((state: IReduxState) => {
        const tracks = state['features/base/tracks'];
        return getLocalDesktopTrack(tracks);
    });
    const audioMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(getTrackState(state), MEDIA_TYPE.AUDIO));
    const videoMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(getTrackState(state), MEDIA_TYPE.VIDEO));

    const [position, setPosition] = useState(getDefaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewInPiP, setIsPreviewInPiP] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const positionRef = useRef(position);
    positionRef.current = position;
    const docPipWindowRef = useRef<Window | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: position.x,
            posY: position.y
        };
    }, [position]);

    useEffect(() => {
        if (!isDragging) {
            return;
        }
        const onMove = (e: MouseEvent) => {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            const next = clampPosition(
                dragStartRef.current.posX + dx,
                dragStartRef.current.posY + dy
            );
            positionRef.current = next;
            setPosition(next);
        };
        const onUp = () => {
            setIsDragging(false);
            try {
                const { x, y } = positionRef.current;
                localStorage.setItem(FLOATING_PREVIEW_STORAGE_KEY, JSON.stringify({ x, y }));
            } catch {
                // ignore
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (!isSharing) {
            return;
        }
        const onResize = () => {
            setPosition(p => clampPosition(p.x, p.y));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [isSharing]);

    // Exit PiP when user stops screen sharing.
    useEffect(() => {
        if (!isSharing) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => {});
            }
            if (docPipWindowRef.current) {
                try {
                    docPipWindowRef.current.close();
                } catch {
                    // ignore
                }
                docPipWindowRef.current = null;
            }
            setIsPreviewInPiP(false);
        }
    }, [isSharing]);

    // Handle commands from Document PiP window via BroadcastChannel (works reliably across windows).
    useEffect(() => {
        const handlePipCommand = (data: { type?: string }) => {
            if (!data?.type) {
                return;
            }
            const state = store.getState();
            const tracks = getTrackState(state);

            switch (data.type) {
            case PIP_MESSAGE.TOGGLE_AUDIO:
                dispatch(setAudioMuted(!isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO), true));
                break;
            case PIP_MESSAGE.TOGGLE_VIDEO:
                dispatch(setVideoMuted(
                    !isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
                    VIDEO_MUTISM_AUTHORITY.USER,
                    true
                ));
                break;
            case PIP_MESSAGE.STOP_SCREEN_SHARE:
                if (docPipWindowRef.current) {
                    try {
                        docPipWindowRef.current.close();
                    } catch {
                        // ignore
                    }
                    docPipWindowRef.current = null;
                }
                setIsPreviewInPiP(false);
                dispatch(startScreenShareFlow(false));
                break;
            }
        };

        const channel = new BroadcastChannel(PIP_BROADCAST_CHANNEL);
        channel.onmessage = (e: MessageEvent) => handlePipCommand(e.data as { type?: string });

        return () => channel.close();
    }, [dispatch, store]);

    // Sync mic/camera state to Document PiP window via BroadcastChannel so icons update.
    useEffect(() => {
        if (!docPipWindowRef.current || !isSharing) {
            return;
        }
        const channel = new BroadcastChannel(PIP_BROADCAST_CHANNEL);
        channel.postMessage({
            type: PIP_MESSAGE.STATE_UPDATE,
            audioMuted,
            videoMuted,
            micIcon: audioMuted ? 'micSlash' : 'mic',
            camIcon: videoMuted ? 'videoOff' : 'video'
        });
        channel.close();
    }, [audioMuted, videoMuted, isSharing]);

    // Listen for PiP enter/leave so we can show toggled state.
    useEffect(() => {
        if (!isSharing || !document.pictureInPictureEnabled) {
            return;
        }
        const video = document.getElementById(FLOATING_PREVIEW_VIDEO_ID) as HTMLVideoElement | null;
        if (!video) {
            return;
        }
        const onEnter = () => setIsPreviewInPiP(true);
        const onLeave = () => setIsPreviewInPiP(false);
        video.addEventListener('enterpictureinpicture', onEnter);
        video.addEventListener('leavepictureinpicture', onLeave);
        return () => {
            video.removeEventListener('enterpictureinpicture', onEnter);
            video.removeEventListener('leavepictureinpicture', onLeave);
        };
    }, [isSharing, desktopTrack]);

    const togglePreviewPiP = useCallback(async () => {
        const docPiP = 'documentPictureInPicture' in window ? window.documentPictureInPicture : undefined;

        if (docPipWindowRef.current) {
            try {
                docPipWindowRef.current.close();
            } catch {
                // ignore
            }
            docPipWindowRef.current = null;
            setIsPreviewInPiP(false);
            return;
        }

        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
            return;
        }

        // Prefer Document PiP (has mic/camera/stop controls) when available.
        if (docPiP && desktopTrack?.jitsiTrack) {
            try {
                const stream = desktopTrack.jitsiTrack.getOriginalStream();
                if (!stream) {
                    throw new Error('No stream');
                }
                const pipWindow = await docPiP.requestWindow({
                    width: DOC_PIP_WIDTH,
                    height: DOC_PIP_HEIGHT
                });
                docPipWindowRef.current = pipWindow;

                const doc = pipWindow.document;
                doc.documentElement.style.margin = '0';
                doc.documentElement.style.padding = '0';
                doc.body.style.margin = '0';
                doc.body.style.padding = '0';
                doc.body.style.background = '#1c1c1e';
                doc.body.style.color = '#fff';
                doc.body.style.fontFamily = 'sans-serif';
                doc.body.style.display = 'flex';
                doc.body.style.flexDirection = 'column';
                doc.body.style.height = '100%';

                const video = doc.createElement('video');
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.flex = '1';
                video.style.objectFit = 'contain';
                video.style.background = '#000';
                video.srcObject = stream;
                doc.body.appendChild(video);

                const toolbar = doc.createElement('div');
                toolbar.style.display = 'flex';
                toolbar.style.gap = '12px';
                toolbar.style.padding = '12px';
                toolbar.style.background = 'rgba(0,0,0,0.3)';
                toolbar.style.justifyContent = 'center';
                toolbar.style.alignItems = 'center';
                toolbar.style.flexWrap = 'wrap';

                const btnBaseStyle = 'min-width:48px;min-height:48px;width:48px;height:48px;padding:10px;border:none;border-radius:50%;cursor:pointer;background:#3a3a3c;color:#fff;display:flex;align-items:center;justify-content:center;transition:background 0.2s;';
                const channelName = PIP_BROADCAST_CHANNEL;
                const state = store.getState();
                const tracks = getTrackState(state);
                const initialAm = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
                const initialVm = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);

                const micBtn = doc.createElement('button');
                micBtn.id = PIP_BTN_IDS.MIC;
                micBtn.setAttribute('style', btnBaseStyle);
                micBtn.innerHTML = initialAm ? PIP_ICONS.micSlash : PIP_ICONS.mic;
                micBtn.title = 'Mute / Unmute microphone';
                micBtn.onclick = () => { try { new BroadcastChannel(channelName).postMessage({ type: PIP_MESSAGE.TOGGLE_AUDIO }); } catch (_) {} };
                micBtn.onmouseover = () => { micBtn.style.background = '#4a4a4c'; };
                micBtn.onmouseout = () => { micBtn.style.background = '#3a3a3c'; };
                toolbar.appendChild(micBtn);

                const camBtn = doc.createElement('button');
                camBtn.id = PIP_BTN_IDS.CAM;
                camBtn.setAttribute('style', btnBaseStyle);
                camBtn.innerHTML = initialVm ? PIP_ICONS.videoOff : PIP_ICONS.video;
                camBtn.title = 'Camera on / off';
                camBtn.onclick = () => { try { new BroadcastChannel(channelName).postMessage({ type: PIP_MESSAGE.TOGGLE_VIDEO }); } catch (_) {} };
                camBtn.onmouseover = () => { camBtn.style.background = '#4a4a4c'; };
                camBtn.onmouseout = () => { camBtn.style.background = '#3a3a3c'; };
                toolbar.appendChild(camBtn);

                const stopBtn = doc.createElement('button');
                stopBtn.textContent = 'Stop';
                stopBtn.setAttribute('style', btnBaseStyle + 'background:#e74c3c;border-radius:8px;min-width:80px;width:auto;font-size:13px;');
                stopBtn.onclick = () => { try { new BroadcastChannel(channelName).postMessage({ type: PIP_MESSAGE.STOP_SCREEN_SHARE }); } catch (_) {} };
                stopBtn.onmouseover = () => { stopBtn.style.background = '#c0392b'; };
                stopBtn.onmouseout = () => { stopBtn.style.background = '#e74c3c'; };
                toolbar.appendChild(stopBtn);

                doc.body.appendChild(toolbar);

                const stateScript = doc.createElement('script');
                stateScript.textContent = `
(function() {
  var icons = ${JSON.stringify(PIP_ICONS)};
  var ch = new BroadcastChannel('${PIP_BROADCAST_CHANNEL}');
  ch.onmessage = function(e) {
    var d = e.data;
    if (!d || d.type !== '${PIP_MESSAGE.STATE_UPDATE}') return;
    var micBtn = document.getElementById('${PIP_BTN_IDS.MIC}');
    var camBtn = document.getElementById('${PIP_BTN_IDS.CAM}');
    if (micBtn && d.micIcon && icons[d.micIcon]) micBtn.innerHTML = icons[d.micIcon];
    if (camBtn && d.camIcon && icons[d.camIcon]) camBtn.innerHTML = icons[d.camIcon];
  };
})();
`;
                doc.body.appendChild(stateScript);

                const sendStateToPip = () => {
                    const state = store.getState();
                    const tracks = getTrackState(state);
                    const am = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
                    const vm = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);
                    const ch = new BroadcastChannel(PIP_BROADCAST_CHANNEL);
                    ch.postMessage({
                        type: PIP_MESSAGE.STATE_UPDATE,
                        audioMuted: am,
                        videoMuted: vm,
                        micIcon: am ? 'micSlash' : 'mic',
                        camIcon: vm ? 'videoOff' : 'video'
                    });
                    ch.close();
                };
                sendStateToPip();

                pipWindow.addEventListener('pagehide', () => {
                    docPipWindowRef.current = null;
                    setIsPreviewInPiP(false);
                });

                setIsPreviewInPiP(true);
            } catch {
                docPipWindowRef.current = null;
                setIsPreviewInPiP(false);
                // Fallback to video PiP
                const video = document.getElementById(FLOATING_PREVIEW_VIDEO_ID) as HTMLVideoElement | null;
                if (video) {
                    video.requestPictureInPicture().catch(() => {});
                }
            }
            return;
        }

        const video = document.getElementById(FLOATING_PREVIEW_VIDEO_ID) as HTMLVideoElement | null;
        if (video) {
            video.requestPictureInPicture().catch(() => {});
        }
    }, [desktopTrack, store, t]);

    if (!isSharing) {
        return null;
    }

    return (
        <div
            className = 'floating-screen-share-preview'
            style = {{
                left: position.x,
                top: position.y,
                width: DEFAULT_WIDTH,
                minHeight: MIN_HEIGHT
            }}>
            <div
                className = 'floating-screen-share-preview-header'
                onMouseDown = { handleMouseDown }
                role = 'button'
                tabIndex = { 0 }
                aria-label = { t('dialog.dragAndDrop', 'Drag to move') }>
                <span className = 'floating-screen-share-preview-title'>
                    { t('toolbar.stopScreenSharing') }
                </span>
            </div>
            <div className = 'floating-screen-share-preview-video'>
                {desktopTrack?.jitsiTrack && (
                    <VideoTrack
                        id = { FLOATING_PREVIEW_VIDEO_ID }
                        className = 'floating-screen-share-preview-video-track'
                        muted = { true }
                        style = { {
                            objectFit: 'contain',
                            width: '100%',
                            height: '100%'
                        } }
                        videoTrack = { desktopTrack } />
                )}
                {!desktopTrack?.jitsiTrack && (
                    <div className = 'floating-screen-share-preview-placeholder'>
                        { t('dialog.screenIsShared') }
                    </div>
                )}
            </div>
            <div className = 'floating-screen-share-preview-toolbar toolbox-content-items'>
                { document.pictureInPictureEnabled && (
                    <button
                        aria-label = { t('toolbar.accessibilityLabel.keepPreviewOnAllTabs') }
                        className = { `floating-preview-pip-button toolbox-icon ${isPreviewInPiP ? 'toggled' : ''}` }
                        onClick = { togglePreviewPiP }
                        title = { t('toolbar.accessibilityLabel.keepPreviewOnAllTabs') }
                        type = 'button'>
                        <IconEnlarge />
                    </button>
                ) }
                <AudioMuteButton buttonKey = 'microphone' />
                <VideoMuteButton buttonKey = 'camera' />
                <ShareDesktopButton buttonKey = 'desktop' />
                <HangupButton buttonKey = 'hangup' customClass = 'hangup-button' />
            </div>
        </div>
    );
}
