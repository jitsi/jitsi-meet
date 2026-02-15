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

const PIP_BTN_IDS = {
    MIC: 'pip-mic-btn',
    CAM: 'pip-cam-btn'
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

    // Handle commands from Document PiP window (mic, camera, stop share).
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin || event.source !== docPipWindowRef.current) {
                return;
            }
            const data = event.data as { type?: string };
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
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [dispatch, store]);

    // Sync mic/camera state to the "keep on all tabs" (Document PiP) window so button labels stay correct.
    useEffect(() => {
        const pipWin = docPipWindowRef.current;
        if (!pipWin || !isSharing) {
            return;
        }
        pipWin.postMessage({
            type: PIP_MESSAGE.STATE_UPDATE,
            audioMuted: audioMuted,
            videoMuted: videoMuted,
            micLabel: audioMuted ? t('toolbar.accessibilityLabel.unmute') : t('toolbar.accessibilityLabel.mute'),
            camLabel: videoMuted ? t('toolbar.accessibilityLabel.videounmute') : t('toolbar.accessibilityLabel.videomute')
        }, '*');
    }, [audioMuted, videoMuted, isSharing, t]);

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
        const docPiP = document.documentPictureInPicture;

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
                toolbar.style.gap = '8px';
                toolbar.style.padding = '8px';
                toolbar.style.background = 'rgba(0,0,0,0.3)';
                toolbar.style.justifyContent = 'center';
                toolbar.style.flexWrap = 'wrap';

                const btnStyle = 'padding:8px 12px;border:none;border-radius:6px;cursor:pointer;background:#3a3a3c;color:#fff;font-size:13px;';
                const stopShareLabel = t('toolbar.stopScreenSharing');

                const micBtn = doc.createElement('button');
                micBtn.id = PIP_BTN_IDS.MIC;
                micBtn.setAttribute('style', btnStyle);
                micBtn.onclick = () => pipWindow.opener?.postMessage({ type: PIP_MESSAGE.TOGGLE_AUDIO }, '*');
                toolbar.appendChild(micBtn);

                const camBtn = doc.createElement('button');
                camBtn.id = PIP_BTN_IDS.CAM;
                camBtn.setAttribute('style', btnStyle);
                camBtn.onclick = () => pipWindow.opener?.postMessage({ type: PIP_MESSAGE.TOGGLE_VIDEO }, '*');
                toolbar.appendChild(camBtn);

                const stopBtn = doc.createElement('button');
                stopBtn.textContent = stopShareLabel;
                stopBtn.setAttribute('style', btnStyle + 'background:#e74c3c;');
                stopBtn.onclick = () => pipWindow.opener?.postMessage({ type: PIP_MESSAGE.STOP_SCREEN_SHARE }, '*');
                toolbar.appendChild(stopBtn);

                doc.body.appendChild(toolbar);

                const stateScript = doc.createElement('script');
                stateScript.textContent = `
(function() {
  window.addEventListener('message', function(e) {
    var d = e.data;
    if (d && d.type === '${PIP_MESSAGE.STATE_UPDATE}') {
      var micBtn = document.getElementById('${PIP_BTN_IDS.MIC}');
      var camBtn = document.getElementById('${PIP_BTN_IDS.CAM}');
      if (micBtn && d.micLabel !== undefined) micBtn.textContent = d.micLabel;
      if (camBtn && d.camLabel !== undefined) camBtn.textContent = d.camLabel;
    }
  });
})();
`;
                doc.body.appendChild(stateScript);

                const sendStateToPip = () => {
                    const state = store.getState();
                    const tracks = getTrackState(state);
                    const am = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);
                    const vm = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);
                    pipWindow.postMessage({
                        type: PIP_MESSAGE.STATE_UPDATE,
                        audioMuted: am,
                        videoMuted: vm,
                        micLabel: am ? t('toolbar.accessibilityLabel.unmute') : t('toolbar.accessibilityLabel.mute'),
                        camLabel: vm ? t('toolbar.accessibilityLabel.videounmute') : t('toolbar.accessibilityLabel.videomute')
                    }, '*');
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
    }, [desktopTrack, t]);

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
