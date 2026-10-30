import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    _addLocalTracksToConference,
    _handleParticipantError,
    _removeLocalTracksFromConference,
    commonUserJoinedHandling,
    commonUserLeftHandling,
    forEachConference,
    getAnalyticsRoomName,
    getConferenceName,
    getConferenceNameForTitle,
    getConferenceOptions,
    getConferenceState,
    getConferenceTimestamp,
    getCurrentConference,
    getOrCreateObfuscatedRoomName,
    getRoomName,
    getVisitorOptions,
    isP2pActive,
    isRoomValid,
    processDestroyConferenceEvent,
    restoreConferenceOptions,
    sendLocalParticipant,
    updateTrackMuteState
} from '../../react/features/base/conference/functions';
import { JITSI_CONFERENCE_URL_KEY } from '../../react/features/base/conference/constants';

function createMockState(overrides: any = {}) {
    return {
        'features/base/conference': {
            conference: undefined,
            joining: undefined,
            leaving: undefined,
            membersOnly: undefined,
            passwordRequired: undefined,
            room: 'testroom',
            ...overrides.conference
        },
        'features/base/config': {
            ...overrides.config
        },
        'features/base/jwt': {
            ...overrides.jwt
        },
        'features/base/connection': {
            ...overrides.connection
        },
        'features/dynamic-branding': {
            ...overrides.dynamicBranding
        },
        'features/base/participants': {
            local: {
                id: 'local-user',
                name: 'Local User',
                email: 'local@example.com',
                ...overrides.localParticipant
            }
        },
        'features/base/media': {
            audio: { muted: false, ...overrides.audioMedia },
            video: { muted: false, ...overrides.videoMedia }
        }
    };
}

describe('Base Conference Functions', () => {
    describe('Room Validation & Room Name Selectors', () => {
        it('isRoomValid checks string validity', () => {
            assert.equal(isRoomValid('testroom'), true);
            assert.equal(isRoomValid('room-123'), true);
            assert.equal(isRoomValid(''), false);
            assert.equal(isRoomValid(undefined), false);
            assert.equal(isRoomValid(null as any), false);
            assert.equal(isRoomValid(123 as any), false);
            assert.equal(isRoomValid({} as any), false);
        });

        it('getRoomName retrieves stored room name', () => {
            const state = createMockState({ conference: { room: 'weekly-sync' } });
            assert.equal(getRoomName(state as any), 'weekly-sync');
        });

        it('getConferenceTimestamp retrieves conference timestamp', () => {
            const state = createMockState({ conference: { conferenceTimestamp: 1600000000 } });
            assert.equal(getConferenceTimestamp(state as any), 1600000000);
        });

        it('getConferenceState returns the conference sub-state', () => {
            const state = createMockState({ conference: { room: 'myroom' } });
            assert.equal(getConferenceState(state as any).room, 'myroom');
        });
    });

    describe('Current Conference & P2P Resolution', () => {
        it('getCurrentConference returns active conference when joined', () => {
            const mockConf = { myUserId: () => 'u1' };
            const state = createMockState({ conference: { conference: mockConf } });
            assert.equal(getCurrentConference(state as any), mockConf);
        });

        it('getCurrentConference returns undefined when conference is currently leaving', () => {
            const mockConf = { myUserId: () => 'u1' };
            const state = createMockState({ conference: { conference: mockConf, leaving: mockConf } });
            assert.equal(getCurrentConference(state as any), undefined);
        });

        it('getCurrentConference falls back to joining, passwordRequired, or membersOnly', () => {
            const mockJoining = { myUserId: () => 'joining' };
            const stateJoining = createMockState({ conference: { joining: mockJoining } });
            assert.equal(getCurrentConference(stateJoining as any), mockJoining);

            const mockPassword = { myUserId: () => 'pw' };
            const statePassword = createMockState({ conference: { passwordRequired: mockPassword } });
            assert.equal(getCurrentConference(statePassword as any), mockPassword);

            const mockMembersOnly = { myUserId: () => 'members' };
            const stateMembersOnly = createMockState({ conference: { membersOnly: mockMembersOnly } });
            assert.equal(getCurrentConference(stateMembersOnly as any), mockMembersOnly);
        });

        it('isP2pActive returns null if no conference, otherwise calls isP2PActive', () => {
            const stateNoConf = createMockState();
            assert.equal(isP2pActive(stateNoConf as any), null);

            const mockConfP2P = { isP2PActive: () => true };
            const stateP2P = createMockState({ conference: { conference: mockConfP2P } });
            assert.equal(isP2pActive(stateP2P as any), true);

            const mockConfJVB = { isP2PActive: () => false };
            const stateJVB = createMockState({ conference: { conference: mockConfJVB } });
            assert.equal(isP2pActive(stateJVB as any), false);
        });
    });

    describe('Conference Name Formatting', () => {
        it('getConferenceName prioritizes localSubject > pendingSubjectChange > subject > callDisplayName > callee > room', () => {
            // Local subject priority
            let state = createMockState({
                conference: { localSubject: 'Local Title', subject: 'Remote Title', room: 'room1' }
            });
            assert.equal(getConferenceName(state as any), 'Local Title');

            // Pending subject change priority
            state = createMockState({
                conference: { pendingSubjectChange: 'Pending Title', subject: 'Remote Title', room: 'room1' }
            });
            assert.equal(getConferenceName(state as any), 'Pending Title');

            // Remote subject priority
            state = createMockState({
                conference: { subject: 'Subject Title', room: 'room1' }
            });
            assert.equal(getConferenceName(state as any), 'Subject Title');

            // Call display name priority
            state = createMockState({
                config: { callDisplayName: 'Call Display Title' },
                conference: { room: 'room1' }
            });
            assert.equal(getConferenceName(state as any), 'Call Display Title');

            // Callee priority
            state = createMockState({
                jwt: { callee: { name: 'Callee Person' } },
                conference: { room: 'room1' }
            });
            assert.equal(getConferenceName(state as any), 'Callee Person');

            // Room fallback with start case
            state = createMockState({
                conference: { room: 'daily-standup-meeting' }
            });
            assert.equal(getConferenceName(state as any), 'Daily Standup Meeting');

            // Empty state fallback
            state = createMockState({
                conference: { room: '' }
            });
            assert.equal(getConferenceName(state as any), '');
        });

        it('getConferenceNameForTitle formats room with startCase and safe decoding', () => {
            const state = createMockState({ conference: { room: 'sprint%20planning%20room' } });
            assert.equal(getConferenceNameForTitle(state as any), 'Sprint Planning Room');
        });
    });

    describe('Conference Options Aggregation & Restoration', () => {
        it('getConferenceOptions populates siteID, stats, confID, and transcriptionLanguage', () => {
            const state = createMockState({
                config: {
                    enableDisplayNameInStats: true,
                    enableEmailInStats: true,
                    analytics: { scriptURLs: [ 'https://analytics.com' ], amplitudeAPPKey: '123' }
                },
                jwt: { tenant: 'my-tenant' },
                connection: { locationURL: new URL('https://meet.jit.si/my-tenant/meeting') },
                localParticipant: { name: 'Alice', email: 'alice@example.com' }
            });

            const options = getConferenceOptions(state as any);
            assert.equal(options.siteID, 'my-tenant');
            assert.equal(options.statisticsDisplayName, 'Alice');
            assert.equal(options.statisticsId, 'alice@example.com');
            assert.equal(options.confID, 'meet.jit.si/my-tenant/meeting');
            assert.equal(options.applicationName, 'Jitsi Meet');
        });

        it('getConferenceOptions removes analytics when disableThirdPartyRequests is set', () => {
            const state = createMockState({
                config: {
                    disableThirdPartyRequests: true,
                    analytics: { scriptURLs: [ 'https://analytics.com' ], amplitudeAPPKey: 'key' }
                }
            });

            getConferenceOptions(state as any);
            assert.equal(state['features/base/config'].analytics.scriptURLs, undefined);
            assert.equal(state['features/base/config'].analytics.amplitudeAPPKey, undefined);
        });

        it('restoreConferenceOptions restores previous config if available', () => {
            const stateNoOld = createMockState({ config: {} });
            assert.equal(restoreConferenceOptions(stateNoOld as any), undefined);

            const stateWithOld = createMockState({
                config: {
                    oldConfig: {
                        hosts: { domain: 'jitsi.org', muc: 'muc.jitsi.org' },
                        focusUserJid: 'focus@jitsi.org',
                        bosh: 'https://bosh.jitsi.org',
                        websocket: 'wss://ws.jitsi.org'
                    }
                }
            });

            const restored = restoreConferenceOptions(stateWithOld as any);
            assert.equal(restored?.hosts.domain, 'jitsi.org');
            assert.equal(restored?.focusUserJid, 'focus@jitsi.org');
            assert.equal(restored?.disableFocus, false);
        });
    });

    describe('Visitor Configuration Options', () => {
        it('getVisitorOptions returns undefined when config.hosts is missing', () => {
            const state = createMockState({ config: {} });
            assert.equal(getVisitorOptions(state as any, 'vnode1', 'focus@jitsi.net', 'user1'), undefined);
        });

        it('getVisitorOptions configures visitor vnode meeting options', () => {
            const state = createMockState({
                config: {
                    hosts: { domain: 'meet.jitsi', muc: 'muc.meet.jitsi' },
                    focusUserJid: 'focus@meet.jitsi',
                    bosh: 'https://meet.jitsi/http-bind',
                    websocket: 'wss://meet.jitsi/xmpp-websocket',
                    p2p: { enabled: true }
                }
            });

            const options = getVisitorOptions(state as any, 'vnode-1', 'focus@meet.jitsi', 'visitor-user');
            assert.equal(options?.hosts.domain, 'vnode-1.meet.jitsi');
            assert.equal(options?.disableFocus, true);
            assert.equal(options?.disableLocalStatsBroadcast, true);
            assert.equal(options?.p2p.enabled, false);
            assert.ok(options?.bosh.includes('vnode=vnode-1'));
            assert.ok(options?.websocket.includes('vnode=vnode-1'));
        });

        it('getVisitorOptions restores original config when redirecting back to main room', () => {
            const state = createMockState({
                config: {
                    hosts: { domain: 'vnode-1.meet.jitsi', muc: 'muc.vnode-1.meet.jitsi' },
                    oldConfig: {
                        hosts: { domain: 'main.meet.jitsi', muc: 'muc.main.meet.jitsi' },
                        bosh: 'https://meet.jitsi/http-bind',
                        websocket: 'wss://meet.jitsi/xmpp-websocket',
                        p2p: { enabled: true }
                    }
                }
            });

            const options = getVisitorOptions(state as any, undefined as any, 'focus@meet.jitsi', 'promoted-user');
            assert.equal(options?.hosts.domain, 'main.meet.jitsi');
            assert.ok(options?.bosh.includes('customusername=promoted-user'));
            assert.ok(options?.websocket.includes('customusername=promoted-user'));
        });
    });

    describe('Room Obfuscation & Analytics Room Name', () => {
        it('getOrCreateObfuscatedRoomName hashes room name and dispatches action', () => {
            const state = createMockState({ conference: { room: 'SecretRoom' } });
            const dispatched: any[] = [];
            const dispatch = (action: any) => dispatched.push(action);

            const hash = getOrCreateObfuscatedRoomName(state as any, dispatch as any);
            assert.ok(hash && hash.length === 64);
            assert.equal(dispatched.length, 1);
            assert.equal(dispatched[0].type, 'SET_OBFUSCATED_ROOM');
            assert.equal(dispatched[0].obfuscatedRoomSource, 'SecretRoom');
        });

        it('getOrCreateObfuscatedRoomName reuses existing hash when room source matches', () => {
            const state = createMockState({
                conference: {
                    room: 'SecretRoom',
                    obfuscatedRoom: 'pre-calculated-hash',
                    obfuscatedRoomSource: 'SecretRoom'
                }
            });
            const dispatched: any[] = [];
            const dispatch = (action: any) => dispatched.push(action);

            const hash = getOrCreateObfuscatedRoomName(state as any, dispatch as any);
            assert.equal(hash, 'pre-calculated-hash');
            assert.equal(dispatched.length, 0);
        });

        it('getAnalyticsRoomName returns hashed or plain room name based on config', () => {
            const statePlain = createMockState({
                config: { analysis: { obfuscateRoomName: false } },
                conference: { room: 'PublicRoom' }
            });
            assert.equal(getAnalyticsRoomName(statePlain as any, (() => {}) as any), 'PublicRoom');

            const stateObfuscated = createMockState({
                config: { analysis: { obfuscateRoomName: true } },
                conference: { room: 'PublicRoom' }
            });
            const hash = getAnalyticsRoomName(stateObfuscated as any, (() => {}) as any);
            assert.ok(hash && hash.length === 64);
        });
    });

    describe('Conference Traversal & Error Handling', () => {
        it('forEachConference executes predicate on all conferences and allows early exit', () => {
            const conf1: any = { myUserId: () => 'u1' };
            const conf2: any = { [JITSI_CONFERENCE_URL_KEY]: new URL('https://meet.jit.si/r2') };
            const state = createMockState({
                conference: {
                    c1: conf1,
                    c2: conf2,
                    otherProp: 'not-a-conf'
                }
            });

            const visited: any[] = [];
            const completedAll = forEachConference(state as any, (c) => {
                visited.push(c);
                return true;
            });
            assert.equal(completedAll, true);
            assert.equal(visited.length, 2);

            // Test early exit when predicate returns false
            const partialVisited: any[] = [];
            const stoppedEarly = forEachConference(state as any, (c) => {
                partialVisited.push(c);
                return false;
            });
            assert.equal(stoppedEarly, false);
            assert.equal(partialVisited.length, 1);
        });

        it('_handleParticipantError swallows Data channels support is disabled error', () => {
            assert.doesNotThrow(() => {
                _handleParticipantError(new Error('Data channels support is disabled!'));
            });

            assert.throws(() => {
                _handleParticipantError(new Error('Fatal participant error'));
            }, /Fatal participant error/);
        });
    });

    describe('Local Tracks Addition & Removal', () => {
        it('_addLocalTracksToConference adds tracks not yet present in conference', async () => {
            const t1 = { id: 1 };
            const t2 = { id: 2 };
            const added: any[] = [];

            const mockConference: any = {
                getLocalTracks: () => [ t1 ],
                addTrack: async (track: any) => added.push(track)
            };

            await _addLocalTracksToConference(mockConference, [ t1, t2 ]);
            assert.equal(added.length, 1);
            assert.equal(added[0], t2);
        });

        it('_removeLocalTracksFromConference removes tracks and catches disposed track errors', async () => {
            const t1 = { id: 1 };
            const removed: any[] = [];

            const mockConference: any = {
                removeTrack: async (track: any) => {
                    const err = new Error('Disposed');
                    err.name = 'track.track_is_disposed';
                    throw err;
                }
            };

            // Disposed error must be swallowed without throwing
            await assert.doesNotReject(async () => {
                await _removeLocalTracksFromConference(mockConference, [ t1 ]);
            });
        });
    });

    describe('User Joined and Left Handling', () => {
        it('commonUserJoinedHandling dispatches participantJoined for non-hidden user', () => {
            const dispatched: any[] = [];
            const mockUser = {
                getId: () => 'user-123',
                getDisplayName: () => 'Bob',
                isHidden: () => false,
                isReplacing: () => false,
                getBotType: () => undefined,
                getStatus: () => 'available',
                getRole: () => 'participant',
                getSources: () => [],
                getIdentity: () => ({ user: { avatar: 'https://avatar.png' } })
            };

            const mockConf = {
                getMetadataHandler: () => ({
                    getMetadata: () => ({})
                })
            };

            commonUserJoinedHandling({ dispatch: ((a: any) => dispatched.push(a)) as any }, mockConf as any, mockUser);
            assert.equal(dispatched.length, 1);
            assert.equal(dispatched[0].type, 'PARTICIPANT_JOINED');
            assert.equal(dispatched[0].participant.id, 'user-123');
            assert.equal(dispatched[0].participant.name, 'Bob');
        });

        it('commonUserJoinedHandling ignores hidden users', () => {
            const dispatched: any[] = [];
            const mockHiddenUser = {
                getId: () => 'hidden-recorder',
                getDisplayName: () => 'Recorder',
                isHidden: () => true
            };

            commonUserJoinedHandling({ dispatch: ((a: any) => dispatched.push(a)) as any }, {} as any, mockHiddenUser);
            assert.equal(dispatched.length, 0);
        });

        it('commonUserLeftHandling dispatches participantLeft for non-hidden user', () => {
            const dispatched: any[] = [];
            const mockUser = {
                getId: () => 'user-123',
                isHidden: () => false,
                isReplaced: () => false
            };

            commonUserLeftHandling({ dispatch: ((a: any) => dispatched.push(a)) as any }, {} as any, mockUser);
            assert.equal(dispatched.length, 1);
            assert.equal(dispatched[0].type, 'PARTICIPANT_LEFT');
            assert.equal(dispatched[0].id, 'user-123');
        });
    });

    describe('Local Participant Broadcast & Track Mute State', () => {
        it('sendLocalParticipant sends commands and sets properties on conference', () => {
            const commands: any[] = [];
            const props: any[] = [];
            let displayName = '';

            const mockConference: any = {
                sendCommand: (cmd: string, val: any) => commands.push({ cmd, val }),
                setLocalParticipantProperty: (key: string, val: any) => props.push({ key, val }),
                setDisplayName: (name: string) => { displayName = name; }
            };

            const state = createMockState({
                localParticipant: {
                    name: 'Charlie',
                    email: 'charlie@example.com',
                    avatarURL: 'https://charlie.png',
                    features: { 'screen-sharing': 'true' }
                },
                config: {
                    transcription: { diarize: true }
                }
            });

            sendLocalParticipant(state as any, mockConference);

            assert.equal(displayName, 'Charlie');
            assert.ok(commands.some(c => c.cmd === 'avatar-url' && c.val.value === 'https://charlie.png'));
            assert.ok(commands.some(c => c.cmd === 'email' && c.val.value === 'charlie@example.com'));
            assert.ok(props.some(p => p.key === 'features_screen-sharing' && p.val === true));
            assert.ok(props.some(p => p.key === 'diarize' && p.val === true));
        });

        it('updateTrackMuteState dispatches mute action and notification when policy requires start muted', () => {
            const dispatched: any[] = [];
            const dispatch = (action: any) => dispatched.push(action);

            const state = createMockState({
                conference: { startAudioMutedPolicy: true },
                audioMedia: { muted: false }
            });

            updateTrackMuteState(state as any, dispatch as any, true);
            assert.equal(dispatched.length, 2);
            assert.equal(dispatched[0].type, 'SET_AUDIO_MUTED');
            assert.equal(dispatched[1].type, 'SHOW_NOTIFICATION');
        });
    });

    describe('Conference Destruction & Silent Reconnect', () => {
        it('processDestroyConferenceEvent reconnects if jid matches current conference', () => {
            const dispatched: any[] = [];
            const dispatch = (action: any) => {
                dispatched.push(action);
                return Promise.resolve(action);
            };

            const mockConference: any = {
                room: { roomjid: 'room1@muc.jitsi.net' }
            };

            const state = createMockState({
                conference: { conference: mockConference }
            });

            const result = processDestroyConferenceEvent(state as any, dispatch as any, [ 'room1@muc.jitsi.net' ]);
            assert.equal(result, true);
            assert.ok(dispatched.length >= 1);
        });

        it('processDestroyConferenceEvent returns false if jid does not match', () => {
            const mockConference: any = {
                room: { roomjid: 'room1@muc.jitsi.net' }
            };

            const state = createMockState({
                conference: { conference: mockConference }
            });

            const result = processDestroyConferenceEvent(state as any, (() => {}) as any, [ 'other@muc.jitsi.net' ]);
            assert.equal(result, false);
        });
    });
});
