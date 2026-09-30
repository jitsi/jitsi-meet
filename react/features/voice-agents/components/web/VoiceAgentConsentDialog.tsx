import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Dialog from '../../../base/ui/components/web/Dialog';
import { allowVoiceAgent, declineVoiceAgent } from '../../actions';

interface IProps {

    /**
     * The agent asking for consent.
     */
    agentId: string;

    /**
     * Whether the participant was muted before the dialog forced a mute; restored on Allow.
     */
    audioWasMuted?: boolean;

    /**
     * Whether the participant was muted for the decision (initial request) or opened the dialog themselves.
     */
    forcedMute?: boolean;
}

/**
 * Asks whether a voice agent may hear the local participant (which also makes the agent audible and
 * visible to them). Cannot be dismissed without a decision, like the recording consent dialog.
 *
 * @param {IProps} props - The props.
 * @returns {JSX.Element}
 */
export default function VoiceAgentConsentDialog({ agentId, audioWasMuted, forcedMute }: IProps) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const agent = useSelector((state: IReduxState) => state['features/voice-agents'].agents[agentId]);
    const consentLearnMoreLink = useSelector(
        (state: IReduxState) => state['features/base/config'].voiceAgents?.consentLearnMoreLink);
    const name = agent?.displayName ?? agentId;

    useEffect(() => {
        APP.API.notifyVoiceAgentConsentDialogOpen(true, agentId);

        return () => {
            APP.API.notifyVoiceAgentConsentDialogOpen(false, agentId);
        };
    }, [ agentId ]);

    const allow = useCallback(() => {
        dispatch(allowVoiceAgent(agentId, { audioWasMuted, forcedMute }));
    }, [ agentId, audioWasMuted, forcedMute ]);

    const decline = useCallback(() => {
        dispatch(declineVoiceAgent(agentId, { forcedMute }));
    }, [ agentId, forcedMute ]);

    return (
        <Dialog
            cancel = {{ translationKey: 'voiceAgents.notNow' }}
            disableBackdropClose = { true }
            disableEscape = { true }
            hideCloseButton = { true }
            ok = {{ translationKey: 'voiceAgents.allow' }}
            onCancel = { decline }
            onSubmit = { allow }
            title = { t('voiceAgents.consentTitle', { name }) }>
            { t(forcedMute ? 'voiceAgents.consentDescriptionMuted' : 'voiceAgents.consentDescription') }
            { consentLearnMoreLink && (
                <>
                    {' '}
                    <a
                        href = { consentLearnMoreLink }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('dialog.learnMore') }
                    </a>
                    {'.'}
                </>
            ) }
        </Dialog>
    );
}
