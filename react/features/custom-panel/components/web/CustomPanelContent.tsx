import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { useCustomPanelApi } from '../../api.web';
import { buildCustomPanelUrl, getCustomPanelUrl } from '../../functions.web';

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
    const baseUrl = useSelector(getCustomPanelUrl);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const meetingId = conference?.getMeetingUniqueId();
    const { classes } = useStyles();
    const { t } = useTranslation();
    const fullUrl = buildCustomPanelUrl(baseUrl, jwt, meetingId);

    // Owns the postMessage Transport lifecycle. In the current ownership
    // model the iframe creates the MessageChannel and the meeting listens
    // on `window` for the handshake, so no iframe `load` or ref wiring is
    // required here. No outgoing events are sent from the meeting yet;
    // when the first one is added, this hook can return a typed sender.
    useCustomPanelApi(fullUrl);

    return (
        <div className = { classes.iframeContainer }>
            {fullUrl && (
                <iframe
                    className = { classes.iframe }
                    src = { fullUrl }
                    title = { t('customPanel.title') } />
            )}
        </div>
    );
};

export default CustomPanelContent;
