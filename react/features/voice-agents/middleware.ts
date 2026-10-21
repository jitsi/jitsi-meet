import { IStore } from '../app/types';
import { CONFERENCE_JOINED, SET_ROOM, UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { participantJoined, participantLeft, participantUpdated } from '../base/participants/actions';
import { PARTICIPANT_JOINED_SOUND_ID, PARTICIPANT_LEFT_SOUND_ID } from '../base/participants/constants';
import { getParticipantById } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import {
    showNotification,
    showParticipantJoinedNotification,
    showParticipantLeftNotification
} from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { joinLeaveNotificationsDisabled } from '../notifications/functions';

import { SET_VOICE_AGENT_CONSENT } from './actionTypes';
import {
    dismissVoiceAgentConsentDialog,
    releaseVoiceAgentConsentMute,
    requestVoiceAgentConsent,
    setVoiceAgentConsent,
    setVoiceAgents
} from './actions';
import {
    getAllowedAgentIds,
    getConsentedAgentSourceNames,
    getNextVoiceAgentConsentRequest,
    isVoiceAgentBlockedByE2EE,
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

/** Conferences already warned about for lacking the agent audio subscription API. */
const warnedNoSubscriptionApi = new WeakSet<object>();

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
        // Cleared (null) on every conference change, a reconnect included: that removes no agent. The agents and
        // this participant's decisions are kept, so a rejoin neither asks again nor re-announces anyone; the tiles
        // go with the conference and CONFERENCE_JOINED puts them back.
        if (action.metadata === null) {
            break;
        }

        // Metadata is server-written but treated as untrusted here: drop prototype-pollution-prone ids
        // before they are used as object keys / participant ids. Only active agents count as present.
        const agents: IVoiceAgents = pickPresentAgents(sanitizeAgents(action.metadata?.agents ?? {}));

        _agentsChanged(store, agents);
        break;
    }
    case SET_ROOM:
        // Another room: nothing known or decided about the previous one's agents carries over.
        store.dispatch(releaseVoiceAgentConsentMute());
        store.dispatch(setVoiceAgents({}));
        break;
    case SET_VOICE_AGENT_CONSENT:
        _consentChanged(store, action.agentId, action.allowed);
        break;
    case CONFERENCE_JOINED:
        _syncParticipants(store);

        // A decision taken before the join completed may predate the presence; advertise it again.
        _syncConsent(store);
        break;
    }

    return result;
});

/**
 * Encryption came on or went off in the meeting: the local toggle, or a participant this client doesn't follow.
 */
StateListenerRegistry.register(
    state => isVoiceAgentBlockedByE2EE(state),
    (blocked, store) => _e2eeChanged(store, blocked));

/**
 * Asks about agents awaiting consent, one at a time, whenever no other dialog is open.
 */
StateListenerRegistry.register(
    state => getNextVoiceAgentConsentRequest(state),
    (agentId, { dispatch }) => {
        agentId && dispatch(requestVoiceAgentConsent(agentId));
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
    const changed = Object.keys(agents).filter(id => id in previous
        && (previous[id].displayName !== agents[id].displayName || previous[id].sourceName !== agents[id].sourceName));

    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        return;
    }

    dispatch(setVoiceAgents(agents));

    for (const agentId of changed) {
        if (conference && previous[agentId].displayName !== agents[agentId].displayName
                && getParticipantById(state, agentId)) {
            dispatch(participantUpdated({ conference, id: agentId, name: agents[agentId].displayName }));
        }
    }

    for (const agentId of removed) {
        logger.info(`Voice agent left: ${agentId}`);
        _announcePresence(store, previous[agentId]?.displayName ?? agentId, false);
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

        // Under E2EE the participant is told the agent is unavailable instead.
        if (!isVoiceAgentBlockedByE2EE(state)) {
            _announcePresence(store, agents[agentId].displayName ?? agentId, true);
        }
        _admitAgent(store, agentId);
    }

    // Consent entries of removed agents were pruned by setVoiceAgents, and a renamed source needs a new
    // subscription; re-advertise what is left.
    if (removed.length > 0 || changed.some(id => previous[id].sourceName !== agents[id].sourceName)) {
        _syncConsent(store);
    }
}

/**
 * Puts the agents' roster entries back after a (re)join: the tiles go with the conference, the agents and the
 * decisions about them do not. Agents not decided about yet are let in as when they first appeared.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _syncParticipants(store: IStore) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }
    const { agents, consent } = state['features/voice-agents'];
    const blocked = isVoiceAgentBlockedByE2EE(state);

    for (const [ agentId, agent ] of Object.entries(agents)) {
        if (consent[agentId] === undefined) {
            _admitAgent(store, agentId);
        } else if (consent[agentId] === true && !blocked) {
            _addAgentParticipant(store, conference, agentId, agent.displayName);
        }
    }
}

/**
 * Puts an agent on the roster, unless it is already there.
 *
 * @param {IStore} store - The redux store.
 * @param {IJitsiConference} conference - The conference the agent is in.
 * @param {string} agentId - The agent.
 * @param {string} [name] - The agent's display name.
 * @returns {void}
 */
function _addAgentParticipant({ dispatch, getState }: IStore, conference: IJitsiConference, agentId: string,
        name?: string) {
    if (!getParticipantById(getState(), agentId)) {
        dispatch(participantJoined({ conference, fakeParticipant: FakeParticipant.Agent, id: agentId, name }));
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

    // A decision taken in a dialog opened before encryption came on must not bring the agent back.
    if (allowed && isVoiceAgentBlockedByE2EE(state)) {
        _syncConsent(store);

        return;
    }

    if (allowed) {
        _addAgentParticipant(store, conference, agentId, agent.displayName);
    } else if (participant) {
        dispatch(participantLeft(agentId, conference, { fakeParticipant: FakeParticipant.Agent }));
    }

    _syncConsent(store);
}

/**
 * Lets a newly present agent in: allows it unless the deployment requires consent, which the consent listener
 * then asks for. In an end-to-end encrypted meeting the agent cannot take part, so the participant is told instead.
 *
 * @param {IStore} store - The redux store.
 * @param {string} agentId - The agent.
 * @returns {void}
 */
function _admitAgent({ dispatch, getState }: IStore, agentId: string) {
    const state = getState();

    if (isVoiceAgentBlockedByE2EE(state)) {
        _notifyE2EEUnsupported(dispatch, state['features/voice-agents'].agents[agentId]?.displayName, agentId);
    } else if (!shouldAskForVoiceAgentConsent(state)) {
        dispatch(setVoiceAgentConsent(agentId, true));
    }
}

/**
 * Announces an agent joining or leaving the meeting like a participant, with the same notification and sound. Its
 * tile can't drive this, since it also comes and goes with this participant's consent and E2EE.
 *
 * @param {IStore} store - The redux store.
 * @param {string} name - The agent's display name.
 * @param {boolean} joined - Whether the agent joined (or left).
 * @returns {void}
 */
function _announcePresence({ dispatch, getState }: IStore, name: string, joined: boolean) {
    const state = getState();
    const { soundsParticipantJoined, soundsParticipantLeft } = state['features/base/settings'];

    // Like participants', not for those already in the meeting when it is joined, nor on leaving it.
    if (!state['features/base/conference'].conference) {
        return;
    }
    if (!joinLeaveNotificationsDisabled()) {
        dispatch(joined ? showParticipantJoinedNotification(name) : showParticipantLeftNotification(name));
    }
    if (joined ? soundsParticipantJoined : soundsParticipantLeft) {
        dispatch(playSound(joined ? PARTICIPANT_JOINED_SOUND_ID : PARTICIPANT_LEFT_SOUND_ID));
    }
}

/**
 * End-to-end encryption was turned on or off. On: agents stop hearing and being heard by this participant and
 * their tiles go. Off: present agents are let in again as if they had just joined, or shown again if allowed.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} enabled - Whether encryption is now on.
 * @returns {void}
 */
function _e2eeChanged(store: IStore, enabled: boolean) {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const { agents, consent } = state['features/voice-agents'];

    if (!conference) {
        return;
    }

    for (const [ agentId, agent ] of Object.entries(agents)) {
        if (enabled) {
            dispatch(dismissVoiceAgentConsentDialog(agentId));
            if (getParticipantById(state, agentId)) {
                dispatch(participantLeft(agentId, conference, { fakeParticipant: FakeParticipant.Agent }));
            }
            _notifyE2EEUnsupported(dispatch, agent.displayName, agentId);
        } else if (consent[agentId] === true) {
            _addAgentParticipant(store, conference, agentId, agent.displayName);
        } else if (consent[agentId] === undefined) {
            _admitAgent(store, agentId);
        }
    }

    _syncConsent(store);
}

/**
 * Tells the participant an agent cannot take part while the meeting is end-to-end encrypted.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @param {string|undefined} name - The agent's display name.
 * @param {string} agentId - The agent, which keys the notification so it is shown once.
 * @returns {void}
 */
function _notifyE2EEUnsupported(dispatch: IStore['dispatch'], name: string | undefined, agentId: string) {
    dispatch(showNotification({
        descriptionKey: 'voiceAgents.e2eeUnsupportedDescription',
        titleArguments: { name: name ?? '' },
        titleKey: 'voiceAgents.e2eeUnsupportedTitle',
        uid: `voice-agent-e2ee-${agentId}`
    }, NOTIFICATION_TIMEOUT_TYPE.LONG));
}

/**
 * Advertises the allowed agents in presence (for jicofo to build the agents' export lists) and subscribes
 * to their audio sources through the conference's voice-agents synthetic-audio subscription. Nothing is
 * advertised or subscribed while the meeting is end-to-end encrypted.
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
    const blocked = isVoiceAgentBlockedByE2EE(state);

    conference.setLocalParticipantProperty(CONSENT_PRESENCE_PROPERTY,
        JSON.stringify(blocked ? [] : getAllowedAgentIds(state)));

    if (typeof conference.setAgentAudioSubscription === 'function') {
        conference.setAgentAudioSubscription(blocked ? [] : getConsentedAgentSourceNames(state));
    } else if (!warnedNoSubscriptionApi.has(conference)) {
        warnedNoSubscriptionApi.add(conference);
        logger.warn('This lib-jitsi-meet has no setAgentAudioSubscription: voice agents will not be audible.');
    }
}
