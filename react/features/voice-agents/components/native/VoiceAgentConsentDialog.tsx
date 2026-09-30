import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from 'react-native-dialog';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import Link from '../../../base/react/components/native/Link';
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
 * visible to them).
 *
 * @param {IProps} props - The props.
 * @returns {JSX.Element}
 */
export default function VoiceAgentConsentDialog({ agentId, audioWasMuted, forcedMute }: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const agent = useSelector((state: IReduxState) => state['features/voice-agents'].agents[agentId]);
    const consentLearnMoreLink = useSelector(
        (state: IReduxState) => state['features/base/config'].voiceAgents?.consentLearnMoreLink);
    const name = agent?.displayName ?? agentId;

    const allow = useCallback(() => {
        dispatch(allowVoiceAgent(agentId, { audioWasMuted, forcedMute }));

        return true;
    }, [ agentId, audioWasMuted, forcedMute ]);

    const decline = useCallback(() => {
        dispatch(declineVoiceAgent(agentId, { forcedMute }));

        return true;
    }, [ agentId, forcedMute ]);

    return (
        <ConfirmDialog
            cancelLabel = { 'voiceAgents.notNow' }
            confirmLabel = { 'voiceAgents.allow' }
            onCancel = { decline }
            onSubmit = { allow }
            title = { 'voiceAgents.nativeTitle' }
            verticalButtons = { true }>
            <Dialog.Description>
                { `${t('voiceAgents.consentTitle', { name })}. ` }
                { t(forcedMute ? 'voiceAgents.consentDescriptionMuted' : 'voiceAgents.consentDescription') }
                { consentLearnMoreLink && (
                    <Link url = { consentLearnMoreLink }>
                        { ` (${t('dialog.learnMore')})` }
                    </Link>
                ) }
            </Dialog.Description>
        </ConfirmDialog>
    );
}
