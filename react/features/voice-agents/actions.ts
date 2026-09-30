import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { setAudioMuted, setAudioUnmutePermissions } from '../base/media/actions';

import { SET_VOICE_AGENTS, SET_VOICE_AGENT_CONSENT, SET_VOICE_AGENT_SPEAKING } from './actionTypes';
import { VoiceAgentConsentDialog } from './components';
import { IVoiceAgents } from './types';

const DIALOG_NAME = 'VoiceAgentConsentDialog';

/**
 * How the consent dialog was opened. The dialog passes these back with the decision, because the web dialog
 * hides itself (clearing its props) before it calls the decision handlers.
 */
export interface IConsentDialogProps {
    agentId?: string;
    audioWasMuted?: boolean;
    forcedMute?: boolean;
}

/**
 * The props of the currently open consent dialog, if any.
 *
 * @param {Function} getState - The redux getState function.
 * @returns {IConsentDialogProps}
 */
function _dialogProps(getState: IStore['getState']): IConsentDialogProps {
    return (getState()['features/base/dialog'].componentProps as IConsentDialogProps | undefined) ?? {};
}

/**
 * Asks the local participant whether a newly active voice agent may hear them. Mirrors recording consent:
 * the participant is muted, with unmuting blocked, until they decide.
 *
 * @param {string} agentId - The agent asking for consent.
 * @returns {Function}
 */
export function requestVoiceAgentConsent(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // Captured before the forced mute so the participant's own choice can be restored on Allow.
        const audioWasMuted = getState()['features/base/media'].audio.muted;

        batch(() => {
            dispatch(setAudioUnmutePermissions(true, true));
            dispatch(setAudioMuted(true));
            dispatch(openDialog(DIALOG_NAME, VoiceAgentConsentDialog, {
                agentId,
                audioWasMuted,
                forcedMute: true
            }));
        });
    };
}

/**
 * Re-opens the consent dialog for an agent the participant has not allowed yet (e.g. from the meeting
 * label). The mute state is left as it is.
 *
 * @param {string} agentId - The agent to decide about.
 * @returns {Function}
 */
export function showVoiceAgentConsentDialog(agentId: string) {
    return (dispatch: IStore['dispatch']) => {
        dispatch(openDialog(DIALOG_NAME, VoiceAgentConsentDialog, {
            agentId,
            forcedMute: false
        }));
    };
}

/**
 * Lets the agent hear the local participant (and the participant hear the agent), restoring the mute state
 * from before the consent request.
 *
 * @param {string} agentId - The agent that was allowed.
 * @param {IConsentDialogProps} [context] - How the dialog was opened; read from the dialog state if omitted.
 * @returns {Function}
 */
export function allowVoiceAgent(agentId: string, context?: IConsentDialogProps) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { audioWasMuted, forcedMute } = context ?? _dialogProps(getState);

        batch(() => {
            dispatch(setVoiceAgentConsent(agentId, true));
            if (forcedMute) {
                dispatch(setAudioUnmutePermissions(false, true));
                dispatch(setAudioMuted(Boolean(audioWasMuted), false));
            }
            dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * Declines for now: the participant stays muted but may unmute for the other participants; the agent
 * neither hears them nor is shown to them until they allow it later.
 *
 * @param {string} agentId - The agent that was declined.
 * @param {IConsentDialogProps} [context] - How the dialog was opened; read from the dialog state if omitted.
 * @returns {Function}
 */
export function declineVoiceAgent(agentId: string, context?: IConsentDialogProps) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { forcedMute } = context ?? _dialogProps(getState);

        batch(() => {
            dispatch(setVoiceAgentConsent(agentId, false));
            if (forcedMute) {
                dispatch(setAudioUnmutePermissions(false, true));
            }
            dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * Closes the consent dialog if it is asking about the given agent (which left), restoring the mute state.
 *
 * @param {string} agentId - The agent that left.
 * @returns {Function}
 */
export function dismissVoiceAgentConsentDialog(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!isDialogOpen(getState(), VoiceAgentConsentDialog)) {
            return;
        }
        const { agentId: openFor, audioWasMuted, forcedMute } = _dialogProps(getState);

        if (openFor !== agentId) {
            return;
        }

        batch(() => {
            if (forcedMute) {
                dispatch(setAudioUnmutePermissions(false, true));
                dispatch(setAudioMuted(Boolean(audioWasMuted), false));
            }
            dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * Updates the known set of voice agents (mirrored from room metadata).
 *
 * @param {IVoiceAgents} agents - The agents, keyed by agent id.
 * @returns {Object}
 */
export function setVoiceAgents(agents: IVoiceAgents) {
    return {
        type: SET_VOICE_AGENTS,
        agents
    };
}

/**
 * Records the local participant's consent decision for receiving a voice agent's media. Allowing
 * subscribes to the agent's audio source (making it audible); disallowing unsubscribes.
 *
 * @param {string} agentId - The agent the decision applies to.
 * @param {boolean} allowed - Whether receiving the agent's media is allowed.
 * @returns {Object}
 */
export function setVoiceAgentConsent(agentId: string, allowed: boolean) {
    return {
        type: SET_VOICE_AGENT_CONSENT,
        agentId,
        allowed
    };
}

/**
 * Records whether a voice agent is currently speaking (synthetic source sending).
 *
 * @param {string} agentId - The agent the update applies to.
 * @param {boolean} speaking - Whether the agent is speaking.
 * @returns {Object}
 */
export function setVoiceAgentSpeaking(agentId: string, speaking: boolean) {
    return {
        type: SET_VOICE_AGENT_SPEAKING,
        agentId,
        speaking
    };
}
