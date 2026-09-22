import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_VOICE_AGENTS, SET_VOICE_AGENT_CONSENT, SET_VOICE_AGENT_SPEAKING } from './actionTypes';
import { isSafeAgentId, sanitizeAgents } from './functions';
import { IVoiceAgents } from './types';

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
    consent: { [agentId: string]: boolean; };

    /** Whether each agent is speaking (synthetic source sending); drives the ring, pruned on leave. */
    speaking: { [agentId: string]: boolean; };
}

const DEFAULT_STATE: IVoiceAgentsState = {
    agents: {},
    consent: {},
    speaking: {}
};

ReducerRegistry.register<IVoiceAgentsState>(
    'features/voice-agents',
    (state = DEFAULT_STATE, action): IVoiceAgentsState => {
        switch (action.type) {
        case SET_VOICE_AGENTS: {
            const agents: IVoiceAgents = sanitizeAgents(action.agents ?? {});
            const consent: { [agentId: string]: boolean; } = {};
            const speaking: { [agentId: string]: boolean; } = {};

            for (const [ agentId, allowed ] of Object.entries(state.consent)) {
                if (agentId in agents) {
                    consent[agentId] = allowed;
                }
            }

            for (const [ agentId, isSpeaking ] of Object.entries(state.speaking)) {
                if (agentId in agents) {
                    speaking[agentId] = isSpeaking;
                }
            }

            return {
                ...state,
                agents,
                consent,
                speaking
            };
        }
        case SET_VOICE_AGENT_CONSENT: {
            if (!isSafeAgentId(action.agentId) || !(action.agentId in state.agents)) {
                return state;
            }

            return {
                ...state,
                consent: {
                    ...state.consent,
                    [action.agentId]: action.allowed
                }
            };
        }
        case SET_VOICE_AGENT_SPEAKING: {
            if (!isSafeAgentId(action.agentId) || !(action.agentId in state.agents)) {
                return state;
            }

            return {
                ...state,
                speaking: {
                    ...state.speaking,
                    [action.agentId]: action.speaking
                }
            };
        }
        }

        return state;
    });
