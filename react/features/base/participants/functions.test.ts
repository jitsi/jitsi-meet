// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

vi.mock('../i18n/i18next', () => ({
    default: {
        t: (k: string) => k
    }
}));

vi.mock('../../filmstrip/functions', () => ({
    isStageFilmstripAvailable: () => false
}));

vi.mock('../tracks/functions.any', () => ({
    getScreenShareTrack: () => undefined,
    isLocalTrackMuted: () => false
}));

vi.mock('../conference/functions', () => ({
    getCurrentConference: (stateful: any) => {
        const state = typeof stateful === 'function' ? stateful() : stateful;

        return state?.['features/base/conference']?.conference;
    }
}));

vi.mock('../../chat/functions', () => ({
    isSendPrivateChatDisabled: () => false,
    isVisitorChatParticipant: () => false
}));

vi.mock('../../invite/functions', () => ({
    isAddPeopleEnabled: () => false,
    isDialOutEnabled: () => false
}));

vi.mock('../../visitors/functions', () => ({
    iAmVisitor: () => false
}));

vi.mock('../lib-jitsi-meet/_', () => {
    const dummyFn = () => false;
    const mock = {
        analytics: {},
        constants: {
            iceRestartReason: {},
            recording: { status: {} }
        },
        errors: {
            audioTranslation: {},
            conference: {},
            connection: {},
            track: {}
        },
        events: {
            conference: {},
            connection: {},
            track: {}
        },
        util: {
            browser: {
                isChrome: dummyFn,
                isChromiumBased: dummyFn,
                isElectron: dummyFn,
                isFirefox: dummyFn,
                isSafari: dummyFn,
                isVersionLessThan: dummyFn,
                isWebKitBased: dummyFn
            }
        }
    };

    (globalThis as any).JitsiMeetJS = mock;
    (globalThis as any).interfaceConfig = {};

    return { default: mock };
});

import { LOCAL_PARTICIPANT_DEFAULT_ID, PARTICIPANT_ROLE } from './constants';
import {
    getLocalParticipant,
    getLocalScreenShareParticipant,
    getNormalizedDisplayName,
    getParticipantById,
    getParticipantByIdOrUndefined,
    getParticipantCount,
    getParticipantDisplayName,
    getRemoteParticipants,
    getVirtualScreenshareParticipantOwnerId,
    isLocalScreenshareParticipant,
    isParticipantModerator,
    isRemoteScreenshareParticipant,
    isScreenShareParticipant,
    isScreenShareParticipantById,
    isSharedVideoParticipant,
    isVoiceAgentParticipant,
    isWhiteboardParticipant
} from './functions';
import { FakeParticipant, IParticipant } from './types';

describe('Participants Functions Unit Tests', () => {
    describe('Participant identity and role checkers', () => {
        it('isLocalScreenshareParticipant identifies local screenshare fake participant', () => {
            const localScreenShare: IParticipant = {
                fakeParticipant: FakeParticipant.LocalScreenShare,
                id: 'local-screenshare',
                local: true
            };
            const regularLocal: IParticipant = {
                id: 'local-user',
                local: true
            };

            expect(isLocalScreenshareParticipant(localScreenShare)).toBe(true);
            expect(isLocalScreenshareParticipant(regularLocal)).toBe(false);
            expect(isLocalScreenshareParticipant(undefined)).toBe(false);
        });

        it('isRemoteScreenshareParticipant identifies remote screenshare fake participant', () => {
            const remoteScreenShare: IParticipant = {
                fakeParticipant: FakeParticipant.RemoteScreenShare,
                id: 'user-1-screenshare',
                local: false
            };
            const regularRemote: IParticipant = {
                id: 'remote-user',
                local: false
            };

            expect(isRemoteScreenshareParticipant(remoteScreenShare)).toBe(true);
            expect(isRemoteScreenshareParticipant(regularRemote)).toBe(false);
            expect(isRemoteScreenshareParticipant(undefined)).toBe(false);
        });

        it('isScreenShareParticipant returns true for either local or remote screenshare', () => {
            const localScreen: IParticipant = {
                fakeParticipant: FakeParticipant.LocalScreenShare,
                id: 'local-screenshare',
                local: true
            };
            const remoteScreen: IParticipant = {
                fakeParticipant: FakeParticipant.RemoteScreenShare,
                id: 'remote-screenshare',
                local: false
            };
            const regularUser: IParticipant = {
                id: 'regular-user',
                local: false
            };

            expect(isScreenShareParticipant(localScreen)).toBe(true);
            expect(isScreenShareParticipant(remoteScreen)).toBe(true);
            expect(isScreenShareParticipant(regularUser)).toBe(false);
        });

        it('identifies shared video, whiteboard, and voice agent fake participants', () => {
            const sharedVideo: IParticipant = {
                fakeParticipant: FakeParticipant.SharedVideo,
                id: 'video-1'
            };
            const whiteboard: IParticipant = {
                fakeParticipant: FakeParticipant.Whiteboard,
                id: 'whiteboard-1'
            };
            const voiceAgent: IParticipant = {
                fakeParticipant: FakeParticipant.Agent,
                id: 'agent-1'
            };

            expect(isSharedVideoParticipant(sharedVideo)).toBe(true);
            expect(isSharedVideoParticipant(whiteboard)).toBe(false);

            expect(isWhiteboardParticipant(whiteboard)).toBe(true);
            expect(isWhiteboardParticipant(sharedVideo)).toBe(false);

            expect(isVoiceAgentParticipant(voiceAgent)).toBe(true);
            expect(isVoiceAgentParticipant(whiteboard)).toBe(false);
        });

        it('isParticipantModerator checks moderator role', () => {
            const moderator: IParticipant = {
                id: 'mod-1',
                role: PARTICIPANT_ROLE.MODERATOR
            };
            const regular: IParticipant = {
                id: 'user-1',
                role: PARTICIPANT_ROLE.PARTICIPANT
            };

            expect(isParticipantModerator(moderator)).toBe(true);
            expect(isParticipantModerator(regular)).toBe(false);
            expect(isParticipantModerator(undefined)).toBe(false);
        });

        it('getVirtualScreenshareParticipantOwnerId strips -screenshare suffix', () => {
            expect(getVirtualScreenshareParticipantOwnerId('user123-screenshare')).toBe('user123');
            expect(getVirtualScreenshareParticipantOwnerId('user123')).toBe('user123');
        });
    });

    describe('State-based participant lookups', () => {
        const localUser: IParticipant = {
            id: 'local-id',
            local: true,
            name: 'Local User'
        };
        const remoteUser1: IParticipant = {
            id: 'remote-1',
            local: false,
            name: 'Alice'
        };
        const remoteUser2: IParticipant = {
            id: 'remote-2',
            local: false,
            name: 'Bob'
        };
        const remoteScreenshare: IParticipant = {
            fakeParticipant: FakeParticipant.RemoteScreenShare,
            id: 'remote-1-screenshare',
            local: false,
            name: 'Alice\'s Screen'
        };

        const state: any = {
            'features/base/participants': {
                fakeParticipants: new Map([
                    [ 'remote-1-screenshare', remoteScreenshare ]
                ]),
                local: localUser,
                localScreenShare: undefined,
                overwrittenNameList: {},
                remote: new Map([
                    [ 'remote-1', remoteUser1 ],
                    [ 'remote-2', remoteUser2 ],
                    [ 'remote-1-screenshare', remoteScreenshare ]
                ]),
                sortedRemoteVirtualScreenshareParticipants: new Map()
            }
        };

        it('getLocalParticipant retrieves local participant from state', () => {
            expect(getLocalParticipant(state)).toBe(localUser);
        });

        it('getLocalScreenShareParticipant retrieves localScreenShare from state', () => {
            expect(getLocalScreenShareParticipant(state)).toBeUndefined();

            const stateWithLocalScreen: any = {
                'features/base/participants': {
                    localScreenShare: { id: 'local-screen-id' }
                }
            };

            expect(getLocalScreenShareParticipant(stateWithLocalScreen)).toEqual({ id: 'local-screen-id' });
        });

        it('getParticipantById resolves participant by id for local and remote', () => {
            expect(getParticipantById(state, 'local-id')).toBe(localUser);
            expect(getParticipantById(state, 'remote-1')).toBe(remoteUser1);
            expect(getParticipantById(state, 'remote-2')).toBe(remoteUser2);
            expect(getParticipantById(state, 'unknown-id')).toBeUndefined();
        });

        it('getParticipantByIdOrUndefined safely returns local participant for undefined participant id', () => {
            expect(getParticipantByIdOrUndefined(state, undefined)).toBe(localUser);
            expect(getParticipantByIdOrUndefined(state, 'remote-1')).toBe(remoteUser1);
        });

        it('getParticipantCount counts real participants excluding fake participants', () => {
            // localUser + remoteUser1 + remoteUser2 = 3 (remoteScreenshare is fake, excluded)
            expect(getParticipantCount(state)).toBe(3);
        });

        it('getRemoteParticipants returns remote map', () => {
            const remotes = getRemoteParticipants(state);

            expect(remotes.size).toBe(3);
            expect(remotes.get('remote-1')).toBe(remoteUser1);
        });

        it('isScreenShareParticipantById checks screenshare participant by ID in state', () => {
            expect(isScreenShareParticipantById(state, 'remote-1-screenshare')).toBe(true);
            expect(isScreenShareParticipantById(state, 'remote-1')).toBe(false);
            expect(isScreenShareParticipantById(state, undefined)).toBe(false);
        });
    });

    describe('Display name resolution', () => {
        it('getNormalizedDisplayName normalizes and trims names', () => {
            expect(getNormalizedDisplayName('  Alice Smith  ')).toBe('Alice Smith');
            expect(getNormalizedDisplayName('')).toBeUndefined();
        });

        it('getParticipantDisplayName retrieves user name or fallback string', () => {
            const state: any = {
                'features/base/config': {
                    defaultLocalDisplayName: 'Fellow Jitster',
                    defaultRemoteDisplayName: 'Fellow Jitster'
                },
                'features/base/participants': {
                    local: { id: LOCAL_PARTICIPANT_DEFAULT_ID, name: 'John Doe' },
                    remote: new Map([
                        [ 'remote-1', { id: 'remote-1', name: 'Alice' } ],
                        [ 'remote-no-name', { id: 'remote-no-name', name: '' } ]
                    ])
                }
            };

            expect(getParticipantDisplayName(state, LOCAL_PARTICIPANT_DEFAULT_ID)).toBe('John Doe');
            expect(getParticipantDisplayName(state, 'remote-1')).toBe('Alice');
            expect(getParticipantDisplayName(state, 'remote-no-name')).toBe('Fellow Jitster');
        });
    });
});
