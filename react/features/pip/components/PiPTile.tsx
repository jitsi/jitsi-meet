import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import Avatar from '../../base/avatar/components/Avatar';
import Icon from '../../base/icons/components/Icon';
import { IconMicSlash } from '../../base/icons/svg';
import { VIDEO_TYPE } from '../../base/media/constants';
import { isScreenShareParticipant } from '../../base/participants/functions';
import { IParticipant } from '../../base/participants/types';
import { isParticipantAudioMuted } from '../../base/tracks/functions.any';
import { getVideoTrackByParticipant } from '../../base/tracks/functions.web';

interface IProps {

    /**
     * Whether this tile is the local (self) participant, shown smaller.
     */
    local?: boolean;

    /**
     * The participant to render in the tile.
     */
    participant?: IParticipant;
}

const useStyles = makeStyles()(() => {
    return {
        tile: {
            alignItems: 'center',
            background: '#1a1a1a',
            borderRadius: '8px',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            width: '100%'
        },
        canvas: {
            height: '100%',
            width: '100%'
        },
        audioMutedIndicator: {
            alignItems: 'center',
            bottom: '4px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'center',
            left: '4px',
            padding: '2px',
            position: 'absolute',
            zIndex: 2
        }
    };
});

/**
 * Renders a single participant tile (video or avatar) inside the Document PiP grid.
 *
 * @param {IProps} props - The component props.
 * @returns {React.ReactElement}
 */
const PiPTile: React.FC<IProps> = ({ participant }: IProps) => {
    const { classes } = useStyles();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoTrack = useSelector((state: IReduxState) => getVideoTrackByParticipant(state, participant));
    const localFlipX = useSelector((state: IReduxState) => Boolean(state['features/base/settings'].localFlipX));
    const audioMuted = useSelector((state: IReduxState) => isParticipantAudioMuted(participant, state));
    const showVideo = videoTrack?.jitsiTrack && !videoTrack.muted;

    // Screen-share tiles have no audio, so never draw the mic-muted indicator on them.
    const showAudioMuted = audioMuted && !isScreenShareParticipant(participant);

    // Mirror the local self-view camera, exactly like the room thumbnail does:
    // only for the local participant, only for the camera (not screen share)
    // and only when the "mirror my video" setting is enabled.
    const mirror = Boolean(participant?.local)
        && videoTrack?.videoType !== VIDEO_TYPE.DESKTOP
        && localFlipX;

    useEffect(() => {
        const container = containerRef.current;

        if (!container || !showVideo) {
            return;
        }

        // Edge keeps a remote track's decoder bound to the document where the <video> lives, so a
        // video element moved into the PiP window renders black. Instead we keep a hidden <video>
        // in the MAIN document (where WebRTC keeps decoding frames even while the tab is hidden)
        // and paint each frame onto a <canvas> inside the PiP window. canvas.drawImage reads pixels,
        // so it works across documents on every browser.
        //
        // Crucially the draw loop is driven by the PiP window's requestAnimationFrame: the PiP
        // window is always visible, so its rAF runs at full framerate. The main window's rAF (and
        // requestVideoFrameCallback on the hidden source video) is throttled to ~0 Hz when the tab
        // is hidden, which is exactly when PiP is active — that throttling is what left it black.
        const pipWin = (container.ownerDocument.defaultView ?? window) as Window & typeof globalThis;
        const videoElement = document.createElement('video');

        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.style.position = 'absolute';
        videoElement.style.width = '1px';
        videoElement.style.height = '1px';
        videoElement.style.opacity = '0';
        videoElement.style.pointerEvents = 'none';

        videoTrack.jitsiTrack.attach(videoElement);
        document.body.appendChild(videoElement);
        videoElement.play().catch(() => { /* ignored */ });

        const canvas = document.createElement('canvas');

        canvas.className = classes.canvas;
        canvas.style.transform = mirror ? 'scaleX(-1)' : '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let rafHandle = 0;

        const draw = () => {
            const vw = videoElement.videoWidth;
            const vh = videoElement.videoHeight;

            if (ctx && vw && vh) {
                const cw = container.clientWidth || vw;
                const ch = container.clientHeight || vh;

                if (canvas.width !== cw || canvas.height !== ch) {
                    canvas.width = cw;
                    canvas.height = ch;
                }

                // object-fit: cover — scale to fill and center-crop.
                const scale = Math.max(cw / vw, ch / vh);
                const dw = vw * scale;
                const dh = vh * scale;

                ctx.drawImage(videoElement, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
            }

            rafHandle = pipWin.requestAnimationFrame(draw);
        };

        rafHandle = pipWin.requestAnimationFrame(draw);

        return () => {
            if (rafHandle) {
                pipWin.cancelAnimationFrame(rafHandle);
            }
            videoTrack?.jitsiTrack?.detach(videoElement);
            videoElement.remove();
            canvas.remove();
        };
    }, [ videoTrack, showVideo, classes.canvas, mirror ]);

    return (
        <div
            className = { classes.tile }
            ref = { containerRef }>
            { !showVideo && <Avatar
                participantId = { participant?.id }
                size = { 48 } /> }
            { showAudioMuted && <div className = { classes.audioMutedIndicator }>
                <Icon
                    size = { 16 }
                    src = { IconMicSlash } />
            </div> }
        </div>
    );
};

export default PiPTile;
