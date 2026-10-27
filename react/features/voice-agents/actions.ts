import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { setAudioMuted, setAudioUnmutePermissions } from '../base/media/actions';

import { SET_VOICE_AGENTS, SET_VOICE_AGENT_CONSENT, SET_VOICE_AGENT_CONSENT_MUTE } from './actionTypes';
import VoiceAgentConsentDialog from './components/VoiceAgentConsentDialog';
import { IVoiceAgentConsentMute, IVoiceAgents } from './types';

const DIALOG_NAME = 'VoiceAgentConsentDialog';

/**
 * The props of the consent dialog.
 */
export interface IConsentDialogProps {
    agentId?: string;
    forcedMute?: boolean;
}

/**
 * Saves, or forgets, the local participant's state from before a consent request muted them.
 *
 * @param {IVoiceAgentConsentMute} [consentMute] - The saved state; omitted to forget it.
 * @returns {Object}
 */
function _setConsentMute(consentMute?: IVoiceAgentConsentMute) {
    return {
        type: SET_VOICE_AGENT_CONSENT_MUTE,
        consentMute
    };
}

/**
 * Undoes a consent request's mute: releases the unmute block if the request took it, restores the mute state from
 * before the request when asked to, and forgets the saved state.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @param {IVoiceAgentConsentMute} consentMute - The saved state.
 * @param {boolean} restoreMute - Whether to restore the mute state from before the request.
 * @returns {void}
 */
function _releaseConsentMute(dispatch: IStore['dispatch'], consentMute: IVoiceAgentConsentMute, restoreMute: boolean) {
    consentMute.tookBlock && dispatch(setAudioUnmutePermissions(false, true));
    restoreMute && dispatch(setAudioMuted(consentMute.audioWasMuted, false));
    dispatch(_setConsentMute());
}

/**
 * Asks the local participant whether a newly active voice agent may hear them. Mirrors recording consent:
 * the participant is muted, with unmuting blocked, until they decide. The block is released on the decision
 * only if this request took it.
 *
 * @param {string} agentId - The agent asking for consent.
 * @returns {Function}
 */
export function requestVoiceAgentConsent(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { muted, unmuteBlocked } = state['features/base/media'].audio;

        // Asked again after another dialog replaced this one: the state saved before the first mute is still the
        // participant's own.
        const saved = state['features/voice-agents'].consentMute;

        batch(() => {
            if (!unmuteBlocked) {
                dispatch(setAudioUnmutePermissions(true, true));
            }
            dispatch(setAudioMuted(true));
            dispatch(_setConsentMute({
                agentId,
                audioWasMuted: saved ? saved.audioWasMuted : muted,
                tookBlock: Boolean(saved?.tookBlock) || !unmuteBlocked
            }));
            dispatch(openDialog(DIALOG_NAME, VoiceAgentConsentDialog, {
                agentId,
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
 * from before the consent request. A decision about another agent (e.g. from the external API while a forced
 * request is up) leaves that request's mute alone.
 *
 * @param {string} agentId - The agent that was allowed.
 * @returns {Function}
 */
export function allowVoiceAgent(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { consentMute } = getState()['features/voice-agents'];

        batch(() => {
            dispatch(setVoiceAgentConsent(agentId, true));
            consentMute?.agentId === agentId && _releaseConsentMute(dispatch, consentMute, true);
            dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * Declines for now: the participant stays muted but may unmute for the other participants; the agent
 * neither hears them nor is shown to them until they allow it later.
 *
 * @param {string} agentId - The agent that was declined.
 * @returns {Function}
 */
export function declineVoiceAgent(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { consentMute } = getState()['features/voice-agents'];

        batch(() => {
            dispatch(setVoiceAgentConsent(agentId, false));
            consentMute?.agentId === agentId && _releaseConsentMute(dispatch, consentMute, false);
            dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * The agent left before the participant decided: restores the mute state from before its request, whether or not
 * its dialog is still up (another dialog may have replaced it), and closes the dialog if it is asking about it.
 *
 * @param {string} agentId - The agent that left.
 * @returns {Function}
 */
export function dismissVoiceAgentConsentDialog(agentId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { consentMute } = state['features/voice-agents'];
        const props = state['features/base/dialog'].componentProps as IConsentDialogProps | undefined;
        const open = isDialogOpen(state, VoiceAgentConsentDialog) && props?.agentId === agentId;

        batch(() => {
            consentMute?.agentId === agentId && _releaseConsentMute(dispatch, consentMute, true);
            open && dispatch(hideDialog(DIALOG_NAME, VoiceAgentConsentDialog));
        });
    };
}

/**
 * Releases the unmute block of a consent request still undecided when the room changes: its dialog is gone, and the
 * block would keep the participant from unmuting in the next room.
 *
 * @returns {Function}
 */
export function releaseVoiceAgentConsentMute() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { consentMute } = getState()['features/voice-agents'];

        consentMute && _releaseConsentMute(dispatch, consentMute, false);
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

