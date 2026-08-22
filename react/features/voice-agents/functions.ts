import { IReduxState } from '../app/types';

import { IVoiceAgents } from './types';

/**
 * Keys that must never be used as object keys, since assigning them can pollute the prototype chain.
 * Agent ids come from room metadata (server-controlled, but treated as untrusted at this boundary).
 */
const UNSAFE_KEYS = new Set([ '__proto__', 'constructor', 'prototype' ]);

/**
 * Whether an agent id is safe to use as a plain-object key.
 *
 * @param {string} agentId - The agent id.
 * @returns {boolean}
 */
export function isSafeAgentId(agentId: string): boolean {
    return !UNSAFE_KEYS.has(agentId);
}

/**
 * Drops any prototype-pollution-prone keys from an agents map before it is stored or acted on.
 *
 * @param {IVoiceAgents} agents - The agents map from metadata.
 * @returns {IVoiceAgents}
 */
export function sanitizeAgents(agents: IVoiceAgents): IVoiceAgents {
    const safe: IVoiceAgents = {};

    for (const [ agentId, agent ] of Object.entries(agents)) {
        if (isSafeAgentId(agentId)) {
            safe[agentId] = agent;
        }
    }

    return safe;
}

/**
 * Returns the known voice agents (mirrored from room metadata).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {IVoiceAgents}
 */
export function getVoiceAgents(state: IReduxState): IVoiceAgents {
    return state['features/voice-agents'].agents;
}

/**
 * Whether receiving a voice agent's media requires an explicit user consent. Defaults to true; a
 * deployment can auto-subscribe every participant with `config.voiceAgents.requireConsent: false`.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isVoiceAgentConsentRequired(state: IReduxState): boolean {
    return state['features/base/config'].voiceAgents?.requireConsent !== false;
}

/**
 * The source names of the voice agents the local participant currently receives: agents still present
 * in the room whose consent decision is 'allowed'.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Array<string>}
 */
export function getConsentedAgentSourceNames(state: IReduxState): string[] {
    const { agents, consent } = state['features/voice-agents'];
    const sourceNames: string[] = [];

    for (const [ agentId, agent ] of Object.entries(agents)) {
        if (consent[agentId] && agent.sourceName) {
            sourceNames.push(agent.sourceName);
        }
    }

    return sourceNames;
}
