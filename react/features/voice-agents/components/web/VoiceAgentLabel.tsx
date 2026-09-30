import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconAI } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { showVoiceAgentConsentDialog } from '../../actions';
import { getVoiceAgentAwaitingConsent } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        agent: {
            background: theme.palette.action01
        }
    };
});

/**
 * Conference-header label shown to everyone while a voice agent is in the meeting. Clicking it reopens the
 * consent dialog for an agent the local participant has not allowed yet.
 *
 * @returns {ReactElement|null}
 */
const VoiceAgentLabel = () => {
    const { classes: styles } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const agents = useSelector((state: IReduxState) => state['features/voice-agents'].agents);
    const awaiting = useSelector(getVoiceAgentAwaitingConsent);

    const onClick = useCallback(() => {
        if (awaiting) {
            dispatch(showVoiceAgentConsentDialog(awaiting));
        }
    }, [ awaiting ]);

    const names = Object.values(agents).map(agent => agent.displayName).filter(Boolean)
        .join(', ');

    if (!names) {
        return null;
    }

    const content = t(awaiting ? 'voiceAgents.labelTooltipAllow' : 'voiceAgents.labelTooltip', { names });

    return (
        <Tooltip
            content = { content }
            position = { 'bottom' }>
            <Label
                accessibilityText = { content }
                className = { styles.agent }
                icon = { IconAI }
                onClick = { awaiting ? onClick : undefined } />
        </Tooltip>
    );
};

export default VoiceAgentLabel;
