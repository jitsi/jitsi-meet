import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { getURLWithoutParams } from '../../base/connection/utils';
import { getLocalParticipant } from '../../base/participants/functions';
import {
    getCollabDetails,
    getCollabServerUrl,
    getWhiteboardInfoForURIString,
    isWhiteboardEnabled,
    isWhiteboardOpen
} from '../../whiteboard/functions';

/**
 * The styles, injected into the second window via its own Emotion cache.
 */
const useStyles = makeStyles()(() => {
    return {
        whiteboard: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#fff'
        },
        placeholder: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#040404'
        },
        message: {
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.5)'
        }
    };
});

/**
 * Renders the meeting's shared whiteboard on a second screen by loading the
 * standalone whiteboard page ({@code static/whiteboard.html}) in an iframe,
 * pointed at the same collaboration room as the meeting. The iframe runs the
 * whiteboard (Excalidraw) in its own browsing context, so there are no
 * cross-window-realm issues, and it stays live via the shared collab server.
 * This is the kind of non-video content the portal makes possible and a
 * {@code <video>} second screen cannot. Requires the whiteboard to be enabled and
 * currently open in the meeting; otherwise a hint is shown.
 *
 * @returns {ReactElement}
 */
const SecondScreenWhiteboard = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const whiteboardEnabled = useSelector(isWhiteboardEnabled);
    const whiteboardOpen = useSelector(isWhiteboardOpen);
    const collabDetails = useSelector(getCollabDetails);
    const collabServerUrl = useSelector(getCollabServerUrl);
    const locationURL = useSelector((state: IReduxState) => state['features/base/connection'].locationURL);
    const defaultRemoteDisplayName = useSelector(
        (state: IReduxState) => state['features/base/config'].defaultRemoteDisplayName);
    const localParticipantName
        = useSelector((state: IReduxState) => getLocalParticipant(state)?.name)
            || defaultRemoteDisplayName || 'Fellow Jitster';

    // Gate on isWhiteboardOpen, not just on the collaboration details: closing the
    // whiteboard only flips `isOpen`, the details live on until RESET_WHITEBOARD
    // (conference leave), so keying off them alone would keep a closed whiteboard
    // on the second screen.
    //
    // Build the standalone whiteboard URL from the canonical meeting location
    // (base/connection), not window.location: the latter can carry a
    // `#config.x=...` fragment whose own `/` characters break the path
    // derivation in getWhiteboardInfoForURIString. Strip hash/query first.
    const url = whiteboardEnabled && whiteboardOpen && collabDetails && collabServerUrl && locationURL
        ? getWhiteboardInfoForURIString(
            getURLWithoutParams(locationURL).href,
            collabServerUrl,
            collabDetails,
            localParticipantName)
        : undefined;

    if (!url) {
        return (
            <div className = { classes.placeholder }>
                <div className = { classes.message }>
                    { t('multiScreen.whiteboardInactive') }
                </div>
            </div>
        );
    }

    // Scope the embedded whiteboard, mirroring the native WebView's no-multi-window
    // and navigation-interception scoping: allow the same-origin app to run and
    // export drawings, but block top-level navigation and form submission.
    // allow-same-origin is required for the collab/storage session; combined with
    // allow-scripts the boundary is soft for same-origin content, so this is
    // defense-in-depth rather than a hard sandbox.
    return (
        <iframe
            allow = 'clipboard-read; clipboard-write'
            className = { classes.whiteboard }
            sandbox = 'allow-same-origin allow-scripts allow-downloads allow-popups'
            src = { url }
            title = { t('multiScreen.whiteboardTitle') } />
    );
};

export default SecondScreenWhiteboard;
