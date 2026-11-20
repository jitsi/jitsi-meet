import { AnyAction, createStore } from 'redux';
import { describe, expect, it, vi } from 'vitest';

import { PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import './middleware';

vi.mock('../base/conference/functions', () => ({ getConferenceState: () => ({}) }));
vi.mock('../base/lib-jitsi-meet', () => ({ JitsiConferenceEvents: {} }));
vi.mock('../base/media/functions', () => ({}));
vi.mock('../base/participants/actions', () => ({}));
vi.mock('../base/sounds/actions', () => ({}));
vi.mock('../notifications/actions', () => ({}));
vi.mock('../notifications/constants', () => ({}));
vi.mock('../video-menu/actions.any', () => ({}));
vi.mock('./sounds', () => ({ ASKED_TO_UNMUTE_FILE: '' }));

vi.mock('../base/participants/functions', () => {
    return {
        getLocalParticipant: () => ({ id: 'local' }),
        hasRaisedHand: (participant: { raisedHandTimestamp?: number; }) => Boolean(participant?.raisedHandTimestamp),
        isLocalParticipantModerator: () => true
    };
});

vi.mock('./actions', () => {
    return {
        dismissPendingAudioParticipant: (participant: object) => ({
            participant,
            type: 'DISMISS_PENDING_AUDIO_PARTICIPANT'
        }),
        participantPendingAudio: (participant: object) => ({
            participant,
            type: 'PARTICIPANT_PENDING_AUDIO'
        })
    };
});

vi.mock('./functions', () => {
    return {
        isEnabledFromState: () => true,
        isParticipantApproved: () => () => false,
        isParticipantPending: () => () => true
    };
});

const dispatchUpdate = (participant: object) => {
    const actions: AnyAction[] = [];
    const store = createStore((state = {}, action) => {
        actions.push(action);

        return state;
    }, MiddlewareRegistry.applyMiddleware());

    store.dispatch({
        participant,
        type: PARTICIPANT_UPDATED
    });

    return actions.map(action => action.type);
};

describe('av moderation middleware', () => {
    describe('PARTICIPANT_UPDATED for a participant asking to unmute', () => {
        it('keeps the request when the update does not change the raised hand', () => {
            expect(dispatchUpdate({
                id: 'p1',
                name: 'New name'
            })).not.toContain('DISMISS_PENDING_AUDIO_PARTICIPANT');
        });

        it('dismisses the request when the hand is lowered', () => {
            expect(dispatchUpdate({
                id: 'p1',
                raisedHandTimestamp: 0
            })).toContain('DISMISS_PENDING_AUDIO_PARTICIPANT');
        });

        it('adds the request when the hand is raised', () => {
            expect(dispatchUpdate({
                id: 'p1',
                raisedHandTimestamp: 1234
            })).toContain('PARTICIPANT_PENDING_AUDIO');
        });
    });
});
