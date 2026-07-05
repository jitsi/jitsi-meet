import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { getLocalParticipant } from '../../base/participants/functions';
import { getCollabDetails, getCollabServerUrl, getWhiteboardInfoForURIString } from '../../whiteboard/functions';

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
 * {@code <video>} second screen cannot. Requires the whiteboard to be open in the
 * meeting (so the collaboration details exist); otherwise a hint is shown.
 *
 * @returns {ReactElement}
 */
const SecondScreenWhiteboard = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const collabDetails = useSelector(getCollabDetails);
    const collabServerUrl = useSelector(getCollabServerUrl);
    const defaultRemoteDisplayName = useSelector(
        (state: IReduxState) => state['features/base/config'].defaultRemoteDisplayName);
    const localParticipantName
        = useSelector((state: IReduxState) => getLocalParticipant(state)?.name)
            || defaultRemoteDisplayName || 'Fellow Jitster';

    const url = collabDetails && collabServerUrl
        ? getWhiteboardInfoForURIString(window.location.href, collabServerUrl, collabDetails, localParticipantName)
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

    return (
        <iframe
            className = { classes.whiteboard }
            src = { url }
            title = { t('multiScreen.whiteboardTitle') } />
    );
};

export default SecondScreenWhiteboard;
