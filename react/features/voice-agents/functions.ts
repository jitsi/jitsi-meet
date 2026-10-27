import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { isAnyDialogOpen } from '../base/dialog/functions';
import { isE2EEOnInMeeting } from '../e2ee/functions';
import { iAmVisitor } from '../visitors/functions';

import { IVoiceAgent, IVoiceAgents } from './types';

/**
 * Keys that must never be used as object keys, since assigning them can pollute the prototype chain.
 * Agent ids come from room metadata (server-controlled, but treated as untrusted at this boundary).
 */
const UNSAFE_KEYS = new Set([ '__proto__', 'constructor', 'prototype' ]);

/** Reserved id namespace for agents; requiring it stops a metadata id shadowing a real participant. */
const AGENT_ID_PREFIX = 'agent-';

/**
 * Whether an agent id is safe to mirror: it must be in the reserved `agent-` namespace and not a
 * prototype-pollution key.
 *
 * @param {string} agentId - The agent id.
 * @returns {boolean}
 */
export function isSafeAgentId(agentId: string): boolean {
    return agentId.startsWith(AGENT_ID_PREFIX) && !UNSAFE_KEYS.has(agentId);
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
 * Whether a voice agent is present in the room: its media leg is up (state `active`). While it is being
 * provisioned it is not shown, so an agent whose allocation fails never joins the roster or fires the join and
 * leave notifications. A missing state (older deployments) counts as present.
 *
 * @param {IVoiceAgent} agent - The agent.
 * @returns {boolean}
 */
export function isVoiceAgentPresent(agent: IVoiceAgent): boolean {
    return agent.state === undefined || agent.state === 'active';
}

/**
 * Keeps only the agents that are present in the room (see {@link isVoiceAgentPresent}).
 *
 * @param {IVoiceAgents} agents - The agents map from metadata.
 * @returns {IVoiceAgents}
 */
export function pickPresentAgents(agents: IVoiceAgents): IVoiceAgents {
    const present: IVoiceAgents = {};

    for (const [ agentId, agent ] of Object.entries(agents)) {
        if (isVoiceAgentPresent(agent)) {
            present[agentId] = agent;
        }
    }

    return present;
}

/**
 * Whether receiving a voice agent's media requires an explicit user consent. Defaults to false, so every
 * participant is subscribed automatically; a deployment can ask first with `config.voiceAgents.requireConsent: true`.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isVoiceAgentConsentRequired(state: IReduxState): boolean {
    return state['features/base/config'].voiceAgents?.requireConsent === true;
}

/**
 * Whether anyone in the meeting has end-to-end encryption on. Agents cannot take part then: the bridge would hand
 * them ciphertext, and the audio they inject is not encrypted with the meeting's keys.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isVoiceAgentBlockedByE2EE(state: IReduxState): boolean {
    return isE2EEOnInMeeting(state);
}

/**
 * Whether the local participant must be asked before an agent may hear them. Recorders and visitors are
 * never exported and simply receive the agent, so they are not asked.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function shouldAskForVoiceAgentConsent(state: IReduxState): boolean {
    return isVoiceAgentConsentRequired(state)
        && !state['features/base/config'].iAmRecorder
        && !iAmVisitor(state);
}

/**
 * The ids of the present agents the local participant has allowed to hear them.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Array<string>}
 */
export function getAllowedAgentIds(state: IReduxState): string[] {
    const { agents, consent } = state['features/voice-agents'];

    return Object.keys(agents).filter(agentId => consent[agentId] === true);
}

/**
 * A present agent the local participant has not allowed yet, if any (the one the meeting label offers to
 * decide about).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string|undefined}
 */
export function getVoiceAgentAwaitingConsent(state: IReduxState): string | undefined {
    if (isVoiceAgentBlockedByE2EE(state)) {
        return undefined;
    }
    const { agents, consent } = state['features/voice-agents'];

    return Object.keys(agents).find(agentId => consent[agentId] !== true);
}

/**
 * The agent to ask for consent now, if any: one agent at a time, and only while no other dialog is open, because
 * opening over one (e.g. recording consent) would replace it and this decision would then release its mute.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string|undefined}
 */
export function getNextVoiceAgentConsentRequest(state: IReduxState): string | undefined {
    if (!getCurrentConference(state)
            || !shouldAskForVoiceAgentConsent(state)
            || isVoiceAgentBlockedByE2EE(state)
            || isAnyDialogOpen(state)) {
        return undefined;
    }
    const { agents, consent } = state['features/voice-agents'];

    return Object.keys(agents).find(agentId => consent[agentId] === undefined);
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
