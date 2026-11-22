import { describe, expect, it, vi } from 'vitest';

vi.mock('../base/participants/functions', () => ({
    getLocalParticipant: (state: any) => state['features/base/participants']?.local,
    isLocalParticipantModerator: (state: any) => state['features/base/participants']?.local?.role === 'moderator'
}));

import {
    canClosePoll,
    getPoll,
    getUnreadPollCount,
    hasIdenticalAnswers,
    isCreatePollDisabled,
    isSubmitAnswerDisabled,
    shouldShowResults
} from './functions';

describe('polls functions & selectors', () => {
    const createMockState = (overrides: any = {}): any => ({
        'features/polls': {
            polls: {
                'poll-open': {
                    id: 'poll-open',
                    senderId: 'user-1',
                    question: 'Favorite language?',
                    answers: [
                        { name: 'TypeScript', voters: [] },
                        { name: 'Rust', voters: [] }
                    ],
                    lastVote: null,
                    saved: false,
                    showResults: false,
                    closed: false
                },
                'poll-closed': {
                    id: 'poll-closed',
                    senderId: 'user-2',
                    question: 'Closed poll?',
                    answers: [],
                    lastVote: null,
                    saved: false,
                    showResults: false,
                    closed: true
                },
                'poll-results': {
                    id: 'poll-results',
                    senderId: 'user-2',
                    question: 'Results visible?',
                    answers: [],
                    lastVote: null,
                    saved: false,
                    showResults: true,
                    closed: false
                }
            },
            unreadPollsCount: 3,
            ...overrides['features/polls']
        },
        'features/base/config': {
            showEndPollButton: true,
            ...overrides['features/base/config']
        },
        'features/base/conference': {
            conference: {
                getPolls: () => ({
                    closePoll: vi.fn()
                })
            },
            metadata: {},
            ...overrides['features/base/conference']
        },
        'features/base/participants': {
            local: {
                id: 'user-1',
                role: 'participant'
            },
            remote: new Map(),
            ...overrides['features/base/participants']
        },
        'features/base/jwt': {
            features: {},
            ...overrides['features/base/jwt']
        },
        'features/dynamic-branding': {
            pollCreationRequiresPermission: false,
            ...overrides['features/dynamic-branding']
        },
        'features/visitors': {
            iAmVisitor: false,
            ...overrides['features/visitors']
        }
    });

    describe('shouldShowResults', () => {
        it('returns true if showResults is true or poll is closed', () => {
            const state = createMockState();

            expect(shouldShowResults('poll-open')(state)).toBe(false);
            expect(shouldShowResults('poll-closed')(state)).toBe(true);
            expect(shouldShowResults('poll-results')(state)).toBe(true);
            expect(shouldShowResults('unknown-id')(state)).toBe(false);
        });
    });

    describe('getPoll & getUnreadPollCount', () => {
        it('retrieves a poll by id and returns unread poll count', () => {
            const state = createMockState();

            expect(getPoll('poll-open')(state)?.question).toBe('Favorite language?');
            expect(getPoll('missing')(state)).toBeUndefined();
            expect(getUnreadPollCount(state)).toBe(3);
        });
    });

    describe('isSubmitAnswerDisabled', () => {
        it('disables submit only when no checkboxes are selected', () => {
            expect(isSubmitAnswerDisabled([ false, false, false ])).toBe(true);
            expect(isSubmitAnswerDisabled([])).toBe(true);
            expect(isSubmitAnswerDisabled([ false, true, false ])).toBe(false);
        });
    });

    describe('hasIdenticalAnswers', () => {
        it('detects duplicate non-empty answers while ignoring empty ones', () => {
            expect(hasIdenticalAnswers([
                { name: 'Yes', voters: [] },
                { name: 'No', voters: [] }
            ])).toBe(false);

            expect(hasIdenticalAnswers([
                { name: 'Yes', voters: [] },
                { name: 'Yes', voters: [] }
            ])).toBe(true);

            expect(hasIdenticalAnswers([
                { name: '', voters: [] },
                { name: '', voters: [] },
                { name: 'Maybe', voters: [] }
            ])).toBe(false);
        });
    });

    describe('isCreatePollDisabled', () => {
        it('disables poll creation for visitors', () => {
            const state = createMockState({
                'features/visitors': { iAmVisitor: true }
            });

            expect(isCreatePollDisabled(state)).toBe(true);
        });

        it('allows poll creation by default when no restrictions are set', () => {
            const state = createMockState();

            expect(isCreatePollDisabled(state)).toBe(false);
        });

        it('enforces JWT create-polls feature when restricted by branding or room metadata', () => {
            const restrictedByBranding = createMockState({
                'features/dynamic-branding': { pollCreationRequiresPermission: true }
            });

            expect(isCreatePollDisabled(restrictedByBranding)).toBe(true);

            const restrictedByMetadata = createMockState({
                'features/base/conference': {
                    metadata: { permissions: { pollCreationRestricted: true } }
                }
            });

            expect(isCreatePollDisabled(restrictedByMetadata)).toBe(true);

            const allowedWithJwt = createMockState({
                'features/dynamic-branding': { pollCreationRequiresPermission: true },
                'features/base/participants': {
                    local: {
                        id: 'user-1',
                        role: 'participant',
                        features: { 'create-polls': true }
                    },
                    remote: new Map()
                }
            });

            expect(isCreatePollDisabled(allowedWithJwt)).toBe(false);
        });
    });

    describe('canClosePoll', () => {
        it('allows the poll creator to close an open poll when enabled', () => {
            const state = createMockState();

            expect(canClosePoll(state, 'poll-open')).toBe(true);
        });

        it('denies closing if poll is already closed or showEndPollButton is disabled', () => {
            const state = createMockState();

            expect(canClosePoll(state, 'poll-closed')).toBe(false);

            const disabledConfigState = createMockState({
                'features/base/config': { showEndPollButton: false }
            });

            expect(canClosePoll(disabledConfigState, 'poll-open')).toBe(false);
        });

        it('allows a moderator to close another participant’s open poll', () => {
            const modState = createMockState({
                'features/base/participants': {
                    local: {
                        id: 'mod-user',
                        role: 'moderator'
                    },
                    remote: new Map()
                }
            });

            expect(canClosePoll(modState, 'poll-results')).toBe(true);
        });

        it('denies a non-moderator participant from closing someone else’s poll', () => {
            const nonModState = createMockState({
                'features/base/participants': {
                    local: {
                        id: 'other-user',
                        role: 'participant'
                    },
                    remote: new Map()
                }
            });

            expect(canClosePoll(nonModState, 'poll-results')).toBe(false);
        });
    });
});
