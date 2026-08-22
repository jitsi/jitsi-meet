/**
 * The type of action which updates the known set of voice agents (mirrored from room metadata).
 *
 * {
 *     type: SET_VOICE_AGENTS,
 *     agents: { [agentId: string]: IVoiceAgent }
 * }
 */
export const SET_VOICE_AGENTS = 'SET_VOICE_AGENTS';

/**
 * The type of action which records the local participant's consent decision for receiving a voice
 * agent's media.
 *
 * {
 *     type: SET_VOICE_AGENT_CONSENT,
 *     agentId: string,
 *     allowed: boolean
 * }
 */
export const SET_VOICE_AGENT_CONSENT = 'SET_VOICE_AGENT_CONSENT';
