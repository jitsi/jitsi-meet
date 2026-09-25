import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_VOICE_AGENTS, SET_VOICE_AGENT_CONSENT, SET_VOICE_AGENT_SPEAKING } from './actionTypes';
import { isSafeAgentId, sanitizeAgents } from './functions';
import { IVoiceAgents } from './types';

type AgentFlags = { [agentId: string]: boolean; };

export interface IVoiceAgentsState {

    /**
     * The known voice agents, mirrored from room metadata.
     */
    agents: IVoiceAgents;

    /**
     * The local participant's consent decisions, by agent id. Absent = not yet decided (a pending
     * consent notification, or consent not required). Entries for agents that left are pruned so a
     * re-provisioned agent with the same id asks again.
     */
    consent: AgentFlags;

    /** Whether each agent is speaking (synthetic source sending); drives the ring, pruned on leave. */
    speaking: AgentFlags;
}

const DEFAULT_STATE: IVoiceAgentsState = {
    agents: {},
    consent: {},
    speaking: {}
};

/**
 * Drops entries for agents no longer present (stale consent/speaking once an agent leaves).
 *
 * @param {AgentFlags} map - The per-agent flags to prune.
 * @param {IVoiceAgents} agents - The currently known agents.
 * @returns {AgentFlags}
 */
function pruneToAgents(map: AgentFlags, agents: IVoiceAgents): AgentFlags {
    const pruned: AgentFlags = {};

    for (const [ agentId, value ] of Object.entries(map)) {
        if (agentId in agents) {
            pruned[agentId] = value;
        }
    }

    return pruned;
}

/**
 * Whether a per-agent flag may be recorded for this id: it must be safe (`in` reports __proto__ as present)
 * and currently known.
 *
 * @param {IVoiceAgentsState} state - The feature state.
 * @param {string} agentId - The agent id.
 * @returns {boolean}
 */
function isKnownAgent(state: IVoiceAgentsState, agentId: string): boolean {
    return isSafeAgentId(agentId) && agentId in state.agents;
}

ReducerRegistry.register<IVoiceAgentsState>(
    'features/voice-agents',
    (state = DEFAULT_STATE, action): IVoiceAgentsState => {
        switch (action.type) {
        case SET_VOICE_AGENTS: {
            const agents = sanitizeAgents(action.agents ?? {});

            return {
                ...state,
                agents,
                consent: pruneToAgents(state.consent, agents),
                speaking: pruneToAgents(state.speaking, agents)
            };
        }
        case SET_VOICE_AGENT_CONSENT:
            return isKnownAgent(state, action.agentId)
                ? { ...state, consent: { ...state.consent, [action.agentId]: action.allowed } }
                : state;
        case SET_VOICE_AGENT_SPEAKING:
            return isKnownAgent(state, action.agentId)
                ? { ...state, speaking: { ...state.speaking, [action.agentId]: action.speaking } }
                : state;
        }

        return state;
    });
