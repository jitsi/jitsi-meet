import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { leaveConference } from '../../base/conference/actions';
import Icon from '../../base/icons/components/Icon';
import { IconHangup, IconMic, IconMicSlash, IconScreenshare, IconVideo, IconVideoOff } from '../../base/icons/svg';
import { MEDIA_TYPE } from '../../base/media/constants';
import { getLocalParticipant } from '../../base/participants/functions';
import { isLocalTrackMuted } from '../../base/tracks/functions.any';
import { isPrejoinPageVisible } from '../../prejoin/functions.any';
import { isScreenVideoShared } from '../../screen-share/functions';
import { isDesktopShareButtonDisabled } from '../../toolbox/functions.web';
import {
    toggleAudioFromPiP,
    toggleScreenShareFromPiP,
    toggleVideoFromPiP
} from '../actions';
import { getDocumentPiPWindow, getPiPGridParticipants } from '../functions';

import PiPTile from './PiPTile';

const useStyles = makeStyles()(() => {
    return {
        container: {
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            width: '100%'
        },
        grid: {
            display: 'grid',
            flex: 1,
            gap: '6px',
            gridAutoRows: '1fr',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            overflow: 'hidden',
            padding: '6px'
        },
        controls: {
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            padding: '8px'
        },
        button: {
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            fill: '#fff',
            height: '40px',
            justifyContent: 'center',
            width: '40px'
        },
        hangup: {
            background: '#d32f2f'
        }
    };
});

/**
 * Renders an adaptive grid of participant tiles, the local self thumbnail and
 * call controls inside the always-on-top Document Picture-in-Picture window.
 *
 * @returns {React.ReactPortal | null}
 */
const DocumentPiP: React.FC = () => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const [ pipWindow, setPipWindow ] = useState<Window | null>(getDocumentPiPWindow());

    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector(getLocalParticipant);
    const gridParticipants = useSelector(getPiPGridParticipants);
    const audioMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO));
    const videoMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO));
    const screenSharing = useSelector(isScreenVideoShared);
    const screenShareDisabled = useSelector(isDesktopShareButtonDisabled);

    const onToggleAudio = useCallback(() => dispatch(toggleAudioFromPiP()), [ dispatch ]);
    const onToggleVideo = useCallback(() => dispatch(toggleVideoFromPiP()), [ dispatch ]);
    const onToggleScreenShare = useCallback(() => dispatch(toggleScreenShareFromPiP()), [ dispatch ]);
    const onHangup = useCallback(() => dispatch(leaveConference()), [ dispatch ]);

    // Toggled/disabled state must be applied via inline styles: dynamically
    // injected CSS-in-JS classes are not propagated into the Document PiP window
    // (its stylesheets are only synced shortly after it opens).
    // Muted audio/video get a grey circle, mirroring the room toolbar's
    // toggled state.
    const audioStyle = { background: audioMuted ? '#5e5e5e' : 'transparent' };
    const videoStyle = { background: videoMuted ? '#5e5e5e' : 'transparent' };
    const screenShareStyle = {
        // Buttons are transparent on the dark bar, mirroring the room toolbar.
        // Active: grey circle, matching the room toolbar's toggled state. The
        // green icon colour is set on the Icon via the `color` prop so it is
        // always green regardless of the default white SVG fill.
        background: screenSharing ? '#5e5e5e' : 'transparent',
        cursor: screenShareDisabled ? 'default' : 'pointer',
        opacity: screenShareDisabled ? 0.5 : 1
    };

    // Pick up the window opened by the togglePiP action.
    useEffect(() => {
        setPipWindow(getDocumentPiPWindow());
    });

    if (!pipWindow) {
        return null;
    }

    return createPortal(
        <div className = { classes.container }>
            <div className = { classes.grid }>
                { gridParticipants.map(p => (
                    <PiPTile
                        key = { p.id }
                        participant = { p } />
                )) }
                { !isOnPrejoin && localParticipant && (
                    <PiPTile
                        key = { localParticipant.id }
                        local = { true }
                        participant = { localParticipant } />
                ) }
            </div>
            <div className = { classes.controls }>
                <button
                    className = { classes.button }
                    onClick = { onToggleAudio }
                    style = { audioStyle }>
                    <Icon
                        size = { 20 }
                        src = { audioMuted ? IconMicSlash : IconMic } />
                </button>
                <button
                    className = { classes.button }
                    onClick = { onToggleVideo }
                    style = { videoStyle }>
                    <Icon
                        size = { 20 }
                        src = { videoMuted ? IconVideoOff : IconVideo } />
                </button>
                <button
                    className = { classes.button }
                    disabled = { screenShareDisabled }
                    onClick = { onToggleScreenShare }
                    style = { screenShareStyle }>
                    <Icon
                        color = 'rgb(0, 255, 0)'
                        size = { 20 }
                        src = { IconScreenshare } />
                </button>
                <button
                    className = { cx(classes.button, classes.hangup) }
                    onClick = { onHangup }>
                    <Icon
                        size = { 20 }
                        src = { IconHangup } />
                </button>
            </div>
        </div>,
        pipWindow.document.body
    );
};

export default DocumentPiP;
