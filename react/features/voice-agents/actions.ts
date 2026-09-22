import { SET_VOICE_AGENTS, SET_VOICE_AGENT_CONSENT, SET_VOICE_AGENT_SPEAKING } from './actionTypes';
import { IVoiceAgents } from './types';

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
