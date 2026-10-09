import { IStore } from '../app/types';
import { CONFERENCE_JOINED, UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { participantJoined, participantLeft } from '../base/participants/actions';
import { getParticipantById } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_VOICE_AGENT_CONSENT } from './actionTypes';
import {
    dismissVoiceAgentConsentDialog,
    requestVoiceAgentConsent,
    setVoiceAgentConsent,
    setVoiceAgents
} from './actions';
import {
    getAllowedAgentIds,
    getConsentedAgentSourceNames,
    pickPresentAgents,
    sanitizeAgents,
    shouldAskForVoiceAgentConsent
} from './functions';
import logger from './logger';
import { IVoiceAgents } from './types';

/**
 * The local-participant presence property carrying the ids of the agents allowed to hear this participant.
 * Jicofo derives each agent's export list from it, so nothing is exported to an agent without it.
 */
export const CONSENT_PRESENCE_PROPERTY = 'voiceAgentConsent';

/**
 * Middleware that mirrors the `agents` room metadata into the conference. An active agent first asks the
 * local participant for consent; once allowed it is shown as a fake participant (the roster entry), the
 * agent is told it may hear the participant (presence property read by jicofo), and the participant
 * subscribes to the agent's synthetic audio source (voice-agents synthetic-audio service in lib-jitsi-meet,
 * which co-exists with audio translation). An agent that is still provisioning, whose provisioning failed,
 * or that the participant has not allowed is not shown.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case UPDATE_CONFERENCE_METADATA: {
        // Metadata is server-written but treated as untrusted here: drop prototype-pollution-prone ids
        // before they are used as object keys / participant ids. Only active agents count as present.
        const agents: IVoiceAgents = pickPresentAgents(sanitizeAgents(action.metadata?.agents ?? {}));

        _agentsChanged(store, agents);
        break;
    }
    case SET_VOICE_AGENT_CONSENT:
        _consentChanged(store, action.agentId, action.allowed);
        break;
    case CONFERENCE_JOINED:
        // A decision taken before the join completed may predate the presence; advertise it again.
        _syncConsent(store);
        break;
    }

    return result;
});

/**
 * Diffs the advertised agents against the known set: asks for consent for new agents, and removes the
 * roster entry, any pending consent dialog and the subscription of agents that left.
 *
 * @param {IStore} store - The redux store.
 * @param {IVoiceAgents} agents - The active agents from the updated room metadata.
 * @returns {void}
 */
function _agentsChanged(store: IStore, agents: IVoiceAgents) {
    const { dispatch, getState } = store;
    const state = getState();
    const previous = state['features/voice-agents']?.agents ?? {};
    const conference = getCurrentConference(state);
    const added = Object.keys(agents).filter(id => !(id in previous));
    const removed = Object.keys(previous).filter(id => !(id in agents));

    if (added.length === 0 && removed.length === 0) {
        return;
    }

    dispatch(setVoiceAgents(agents));

    for (const agentId of removed) {
        logger.info(`Voice agent left: ${agentId}`);
        dispatch(dismissVoiceAgentConsentDialog(agentId));

        // Metadata is cleared (null) when the conference is left, at which point base/participants purges
        // the fake participants on its own.
        if (conference && getParticipantById(state, agentId)) {
            dispatch(participantLeft(agentId, conference, { fakeParticipant: FakeParticipant.Agent }));
        }
    }

    if (!conference) {
        return;
    }

    for (const agentId of added) {
        logger.info(`Voice agent active: ${agentId} (${agents[agentId].displayName})`);

        if (shouldAskForVoiceAgentConsent(state)) {
            dispatch(requestVoiceAgentConsent(agentId));
        } else {
            dispatch(setVoiceAgentConsent(agentId, true));
        }
    }

    // Consent entries of removed agents were pruned by setVoiceAgents; re-advertise what is left.
    if (removed.length > 0) {
        _syncConsent(store);
    }
}

/**
 * Applies a consent decision: an allowed agent joins the roster for this participant, a declined one is
 * hidden, and both directions of audio follow the decision.
 *
 * @param {IStore} store - The redux store.
 * @param {string} agentId - The agent the decision applies to.
 * @param {boolean} allowed - Whether the agent may hear the participant.
 * @returns {void}
 */
function _consentChanged(store: IStore, agentId: string, allowed: boolean) {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const agent = state['features/voice-agents'].agents[agentId];

    if (!conference || !agent) {
        return;
    }

    const participant = getParticipantById(state, agentId);

    if (allowed && !participant) {
        dispatch(participantJoined({
            conference,
            fakeParticipant: FakeParticipant.Agent,
            id: agentId,
            name: agent.displayName
        }));
    } else if (!allowed && participant) {
        dispatch(participantLeft(agentId, conference, { fakeParticipant: FakeParticipant.Agent }));
    }

    _syncConsent(store);
}

/**
 * Advertises the allowed agents in presence (for jicofo to build the agents' export lists) and subscribes
 * to their audio sources through the conference's voice-agents synthetic-audio subscription.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _syncConsent({ getState }: IStore) {
    const state = getState();
    const conference: IJitsiConference | undefined = getCurrentConference(state);

    if (!conference) {
        return;
    }

    conference.setLocalParticipantProperty(CONSENT_PRESENCE_PROPERTY, JSON.stringify(getAllowedAgentIds(state)));

    if (typeof conference.setAgentAudioSubscription === 'function') {
        conference.setAgentAudioSubscription(getConsentedAgentSourceNames(state));
    }
}
