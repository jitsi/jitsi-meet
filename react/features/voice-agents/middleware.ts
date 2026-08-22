import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { participantJoined, participantLeft } from '../base/participants/actions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { SET_VOICE_AGENT_CONSENT } from './actionTypes';
import { setVoiceAgentConsent, setVoiceAgents } from './actions';
import { getConsentedAgentSourceNames, isVoiceAgentConsentRequired, sanitizeAgents } from './functions';
import logger from './logger';
import { IVoiceAgents } from './types';

/**
 * The uid of the consent notification for an agent, so it can be hidden on consent or when the agent
 * leaves.
 *
 * @param {string} agentId - The agent id.
 * @returns {string}
 */
function consentNotificationUid(agentId: string) {
    return `voice-agent-consent-${agentId}`;
}

/**
 * Middleware that mirrors the `agents` room metadata into the conference: a fake participant per agent
 * (the roster entry), a consent notification for receiving each agent's media (unless disabled via
 * config.voiceAgents.requireConsent), and — on consent — the subscription to the agent's synthetic audio
 * source, which is what makes the agent audible. The subscription is managed through the voice-agents
 * synthetic-audio service in lib-jitsi-meet, so it co-exists with audio translation.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case UPDATE_CONFERENCE_METADATA: {
        // Metadata is server-written but treated as untrusted here: drop prototype-pollution-prone ids
        // before they are used as object keys / participant ids.
        const agents: IVoiceAgents = sanitizeAgents(action.metadata?.agents ?? {});

        _agentsChanged(store, agents);
        break;
    }
    case SET_VOICE_AGENT_CONSENT:
        _updateSubscription(store);
        break;
    }

    return result;
});

/**
 * Diffs the advertised agents against the known set: joins/leaves the fake participants, drives the
 * consent flow for new agents and prunes state (and the subscription) for removed ones.
 *
 * @param {IStore} store - The redux store.
 * @param {IVoiceAgents} agents - The agents from the updated room metadata.
 * @returns {void}
 */
function _agentsChanged({ dispatch, getState }: IStore, agents: IVoiceAgents) {
    const state = getState();
    const previous = state['features/voice-agents']?.agents ?? {};
    const conference = getCurrentConference(state);
    const added = Object.keys(agents).filter(id => !(id in previous));
    const removed = Object.keys(previous).filter(id => !(id in agents));

    if (added.length === 0 && removed.length === 0) {
        return;
    }

    // Room metadata is delivered on the conference, so it is normally set here; it is cleared (null
    // metadata) when the conference is left, at which point base/participants purges the fake
    // participants on its own. Just keep the feature state in sync in that case.
    if (!conference) {
        dispatch(setVoiceAgents(agents));
        removed.forEach(agentId => dispatch(hideNotification(consentNotificationUid(agentId))));

        return;
    }

    dispatch(setVoiceAgents(agents));

    for (const agentId of removed) {
        logger.info(`Voice agent left: ${agentId}`);
        batch(() => {
            dispatch(hideNotification(consentNotificationUid(agentId)));
            dispatch(participantLeft(agentId, conference, { fakeParticipant: FakeParticipant.Agent }));
        });
    }

    for (const agentId of added) {
        const displayName = agents[agentId].displayName;

        logger.info(`Voice agent joined: ${agentId} (${displayName})`);
        dispatch(participantJoined({
            conference,
            fakeParticipant: FakeParticipant.Agent,
            id: agentId,
            name: displayName
        }));

        if (isVoiceAgentConsentRequired(state)) {
            const uid = consentNotificationUid(agentId);

            dispatch(showNotification({
                customActionHandler: [ () => batch(() => {
                    dispatch(setVoiceAgentConsent(agentId, true));
                    dispatch(hideNotification(uid));
                }) ],
                customActionNameKey: [ 'voiceAgents.allow' ],
                descriptionKey: 'voiceAgents.consentDescription',
                titleArguments: { name: displayName ?? agentId },
                titleKey: 'voiceAgents.joinedTitle',
                uid
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        } else {
            dispatch(setVoiceAgentConsent(agentId, true));
        }
    }

    // Removals must also drop their source from the subscription (consent entries were pruned by
    // setVoiceAgents). Additions with consent disabled are handled by the SET_VOICE_AGENT_CONSENT case.
    if (removed.length > 0) {
        _updateSubscription({ dispatch, getState } as IStore);
    }
}

/**
 * Sends the current consented agent source names to the bridge through the conference's voice-agents
 * synthetic-audio subscription.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _updateSubscription({ getState }: IStore) {
    const state = getState();
    const conference: IJitsiConference | undefined = getCurrentConference(state);

    if (!conference || typeof conference.setAgentAudioSubscription !== 'function') {
        return;
    }

    conference.setAgentAudioSubscription(getConsentedAgentSourceNames(state));
}
