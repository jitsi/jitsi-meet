import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { getLocalDesktopTrack } from '../../../base/tracks/functions.any';
import { isScreenVideoShared } from '../../functions';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import HangupButton from '../../../toolbox/components/HangupButton';
import ShareDesktopButton from '../../../toolbox/components/web/ShareDesktopButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';

const FLOATING_PREVIEW_STORAGE_KEY = 'floatingScreenSharePreviewPosition';
const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 180;
const MIN_HEIGHT = 140;
const TOOLBAR_HEIGHT = 48;
const HEADER_HEIGHT = 32;
const BORDER = 8;

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
    const isSharing = useSelector(isScreenVideoShared);
    const desktopTrack = useSelector((state: IReduxState) => {
        const tracks = state['features/base/tracks'];
        return getLocalDesktopTrack(tracks);
    });

    const [position, setPosition] = useState(getDefaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const positionRef = useRef(position);
    positionRef.current = position;

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
                        id = 'floating-screen-share-preview-video'
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
                <AudioMuteButton buttonKey = 'microphone' />
                <VideoMuteButton buttonKey = 'camera' />
                <ShareDesktopButton buttonKey = 'desktop' />
                <HangupButton buttonKey = 'hangup' customClass = 'hangup-button' />
            </div>
        </div>
    );
}
