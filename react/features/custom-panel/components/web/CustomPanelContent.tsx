import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { useCustomPanelApi } from '../../api.web';
import { getCustomPanelUrl } from '../../functions.web';

const useStyles = makeStyles()(() => {
    return {
        iframeContainer: {
            boxSizing: 'border-box',
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            height: '100%'
        },

        iframe: {
            border: 'none',
            height: '100%',
            width: '100%'
        }
    };
});

/**
 * Renders the advisor web app in an iframe, loaded with the meeting JWT and id.
 * The {@link CustomPanel} container owns the resize, the close button and the positioning.
 *
 * @returns {JSX.Element | null} The custom panel content or null.
 */
const CustomPanelContent = (): JSX.Element | null => {
    const customPanelUrl = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const meetingId = conference?.getMeetingUniqueId();
    const { classes } = useStyles();

    /**
     * Constructs the iframe URL with JWT and meetingId query parameters.
     */
    const iframeUrl = useMemo(() => {
        if (!customPanelUrl) {
            return '';
        }

        try {
            const url = new URL(customPanelUrl);

            if (jwt) {
                url.searchParams.set('token', jwt);
            }
            if (meetingId) {
                url.searchParams.set('meeting', meetingId);
            }

            return url.toString();
        } catch (e) {
            return '';
        }
    }, [ customPanelUrl, jwt, meetingId ]);

    // Owns the postMessage Transport lifecycle. In the current ownership
    // model the iframe creates the MessageChannel and the meeting listens
    // on `window` for the handshake, so no iframe `load` or ref wiring is
    // required here. No outgoing events are sent from the meeting yet;
    // when the first one is added, this hook can return a typed sender.
    useCustomPanelApi(iframeUrl);

    return (
        <div className = { classes.iframeContainer }>
            {iframeUrl && (
                <iframe
                    allow = 'camera; microphone; display-capture'
                    className = { classes.iframe }
                    src = { iframeUrl }
                    title = 'Custom Panel' />
            )}
        </div>
    );
};

export default CustomPanelContent;
