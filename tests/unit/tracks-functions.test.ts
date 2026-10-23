import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
    getCameraFacingMode,
    getLocalAudioTrack,
    getLocalDesktopTrack,
    getLocalJitsiAudioTrack,
    getLocalJitsiDesktopTrack,
    getLocalJitsiVideoTrack,
    getLocalTrack,
    getLocalTracks,
    getLocalVideoTrack,
    getScreenShareTrack,
    getTrackByJitsiTrack,
    getTrackByMediaTypeAndParticipant,
    getTrackByParticipantId,
    getTracksByMediaType,
    getTrackState,
    getVirtualScreenshareParticipantTrack,
    isLocalTrackMuted,
    isLocalVideoTrackDesktop,
    isParticipantAudioMuted,
    isParticipantMediaMuted,
    isParticipantScreenShareMuted,
    isParticipantVideoMuted,
    isRemoteTrackMuted,
    setTrackMuted
} from '../../react/features/base/tracks/functions.any';
import { CAMERA_FACING_MODE, MEDIA_TYPE, VIDEO_TYPE } from '../../react/features/base/media/constants';
import { JitsiTrackErrors } from '../../react/features/base/lib-jitsi-meet';

describe('Tracks Functions Unit Tests', () => {
    describe('getTrackState', () => {
        it('returns tracks state from global redux state', () => {
            const mockTracks = [ { jitsiTrack: {}, local: true } ];
            const state: any = {
                'features/base/tracks': mockTracks
            };

            assert.strictEqual(getTrackState(state), mockTracks);
        });
    });

    describe('Local track getters', () => {
        const localAudioTrack = {
            jitsiTrack: { id: 'audio-1' },
            local: true,
            mediaType: MEDIA_TYPE.AUDIO
        };
        const localVideoTrack = {
            jitsiTrack: { id: 'video-1' },
            local: true,
            mediaType: MEDIA_TYPE.VIDEO
        };
        const localDesktopTrack = {
            jitsiTrack: { id: 'desktop-1' },
            local: true,
            mediaType: MEDIA_TYPE.SCREENSHARE,
            videoType: VIDEO_TYPE.DESKTOP
        };
        const pendingLocalTrack = {
            jitsiTrack: undefined,
            local: true,
            mediaType: MEDIA_TYPE.AUDIO
        };
        const remoteTrack = {
            jitsiTrack: { id: 'remote-1' },
            local: false,
            mediaType: MEDIA_TYPE.VIDEO
        };

        const allTracks = [
            localAudioTrack,
            localVideoTrack,
            localDesktopTrack,
            pendingLocalTrack,
            remoteTrack
        ];

        it('getLocalTracks filters local tracks and handles pending tracks', () => {
            const readyLocalTracks = getLocalTracks(allTracks as any);
            assert.strictEqual(readyLocalTracks.length, 3);
            assert.ok(!readyLocalTracks.includes(pendingLocalTrack as any));
            assert.ok(!readyLocalTracks.includes(remoteTrack as any));

            const localTracksWithPending = getLocalTracks(allTracks as any, true);
            assert.strictEqual(localTracksWithPending.length, 4);
            assert.ok(localTracksWithPending.includes(pendingLocalTrack as any));
        });

        it('getLocalTrack retrieves track by media type', () => {
            const audio = getLocalTrack(allTracks as any, MEDIA_TYPE.AUDIO);
            assert.strictEqual(audio, localAudioTrack);

            const video = getLocalTrack(allTracks as any, MEDIA_TYPE.VIDEO);
            assert.strictEqual(video, localVideoTrack);

            const desktop = getLocalTrack(allTracks as any, MEDIA_TYPE.SCREENSHARE);
            assert.strictEqual(desktop, localDesktopTrack);
        });

        it('getLocalAudioTrack, getLocalVideoTrack, and getLocalDesktopTrack return correct tracks', () => {
            assert.strictEqual(getLocalAudioTrack(allTracks as any), localAudioTrack);
            assert.strictEqual(getLocalVideoTrack(allTracks as any), localVideoTrack);
            assert.strictEqual(getLocalDesktopTrack(allTracks as any), localDesktopTrack);
        });
    });

    describe('Redux JitsiTrack getters', () => {
        it('retrieves underlying jitsiTrack instances from state', () => {
            const jitsiAudio = { id: 'jitsi-audio' };
            const jitsiVideo = { id: 'jitsi-video' };
            const jitsiDesktop = { id: 'jitsi-desktop' };

            const state: any = {
                'features/base/tracks': [
                    { jitsiTrack: jitsiAudio, local: true, mediaType: MEDIA_TYPE.AUDIO },
                    { jitsiTrack: jitsiVideo, local: true, mediaType: MEDIA_TYPE.VIDEO },
                    { jitsiTrack: jitsiDesktop, local: true, mediaType: MEDIA_TYPE.SCREENSHARE }
                ]
            };

            assert.strictEqual(getLocalJitsiAudioTrack(state), jitsiAudio);
            assert.strictEqual(getLocalJitsiVideoTrack(state), jitsiVideo);
            assert.strictEqual(getLocalJitsiDesktopTrack(state), jitsiDesktop);
        });

        it('returns undefined when track is missing from state', () => {
            const emptyState: any = { 'features/base/tracks': [] };

            assert.strictEqual(getLocalJitsiAudioTrack(emptyState), undefined);
            assert.strictEqual(getLocalJitsiVideoTrack(emptyState), undefined);
            assert.strictEqual(getLocalJitsiDesktopTrack(emptyState), undefined);
        });
    });

    describe('Participant track queries', () => {
        const participantId1 = 'user-1';
        const participantId2 = 'user-2';

        const track1 = {
            jitsiTrack: { id: 't1' },
            participantId: participantId1,
            mediaType: MEDIA_TYPE.AUDIO
        };
        const track2 = {
            jitsiTrack: { id: 't2' },
            participantId: participantId1,
            mediaType: MEDIA_TYPE.VIDEO
        };
        const track3 = {
            jitsiTrack: { id: 't3' },
            participantId: participantId2,
            mediaType: MEDIA_TYPE.VIDEO
        };
        const screenshareTrack = {
            jitsiTrack: { id: 't4' },
            participantId: participantId2,
            mediaType: MEDIA_TYPE.SCREENSHARE,
            videoType: VIDEO_TYPE.DESKTOP
        };

        const tracks = [ track1, track2, track3, screenshareTrack ];

        it('getTrackByMediaTypeAndParticipant finds participant track by type', () => {
            const res = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, participantId1);
            assert.strictEqual(res, track1);

            const notFound = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, participantId2);
            assert.strictEqual(notFound, undefined);

            const undefinedParticipant = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, undefined);
            assert.strictEqual(undefinedParticipant, undefined);
        });

        it('getTrackByParticipantId returns all tracks for a participant', () => {
            const user1Tracks = getTrackByParticipantId(tracks as any, participantId1);
            assert.strictEqual(user1Tracks.length, 2);
            assert.deepStrictEqual(user1Tracks, [ track1, track2 ]);
        });

        it('getScreenShareTrack and getVirtualScreenshareParticipantTrack find screenshare', () => {
            const screen = getScreenShareTrack(tracks as any, participantId2);
            assert.strictEqual(screen, screenshareTrack);

            const virtualScreen = getVirtualScreenshareParticipantTrack(tracks as any, `${participantId2}-screenshare`);
            assert.strictEqual(virtualScreen, screenshareTrack);
        });

        it('getTrackByJitsiTrack matches track by underlying instance', () => {
            assert.strictEqual(getTrackByJitsiTrack(tracks as any, track2.jitsiTrack), track2);
            assert.strictEqual(getTrackByJitsiTrack(tracks as any, {}), undefined);
        });

        it('getTracksByMediaType filters all tracks by media type', () => {
            const videoTracks = getTracksByMediaType(tracks as any, MEDIA_TYPE.VIDEO);
            assert.strictEqual(videoTracks.length, 2);
            assert.deepStrictEqual(videoTracks, [ track2, track3 ]);
        });
    });

    describe('Mute state checks', () => {
        it('isLocalTrackMuted returns true for muted or missing local track', () => {
            const unmutedAudio = [ { local: true, mediaType: MEDIA_TYPE.AUDIO, muted: false, jitsiTrack: {} } ];
            assert.strictEqual(isLocalTrackMuted(unmutedAudio as any, MEDIA_TYPE.AUDIO), false);

            const mutedAudio = [ { local: true, mediaType: MEDIA_TYPE.AUDIO, muted: true, jitsiTrack: {} } ];
            assert.strictEqual(isLocalTrackMuted(mutedAudio as any, MEDIA_TYPE.AUDIO), true);

            const emptyTracks: any[] = [];
            assert.strictEqual(isLocalTrackMuted(emptyTracks, MEDIA_TYPE.AUDIO), true);
        });

        it('isRemoteTrackMuted returns true for muted or missing remote track', () => {
            const remoteTracks = [
                { participantId: 'remote-1', mediaType: MEDIA_TYPE.AUDIO, muted: false, jitsiTrack: {} },
                { participantId: 'remote-2', mediaType: MEDIA_TYPE.AUDIO, muted: true, jitsiTrack: {} }
            ];

            assert.strictEqual(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'remote-1'), false);
            assert.strictEqual(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'remote-2'), true);
            assert.strictEqual(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'unknown-user'), true);
        });

        it('isLocalVideoTrackDesktop returns true when unmuted desktop track exists', () => {
            const stateWithActiveDesktop: any = {
                'features/base/tracks': [
                    { local: true, mediaType: MEDIA_TYPE.SCREENSHARE, muted: false, jitsiTrack: {} }
                ]
            };
            assert.strictEqual(isLocalVideoTrackDesktop(stateWithActiveDesktop), true);

            const stateWithMutedDesktop: any = {
                'features/base/tracks': [
                    { local: true, mediaType: MEDIA_TYPE.SCREENSHARE, muted: true, jitsiTrack: {} }
                ]
            };
            assert.strictEqual(isLocalVideoTrackDesktop(stateWithMutedDesktop), false);

            const stateWithoutDesktop: any = {
                'features/base/tracks': []
            };
            assert.strictEqual(isLocalVideoTrackDesktop(stateWithoutDesktop), false);
        });

        it('isParticipantMediaMuted evaluates local and remote participants', () => {
            const state: any = {
                'features/base/tracks': [
                    { local: true, mediaType: MEDIA_TYPE.AUDIO, muted: false, jitsiTrack: {} },
                    { participantId: 'remote-1', mediaType: MEDIA_TYPE.AUDIO, muted: true, jitsiTrack: {} }
                ],
                'features/base/config': {}
            };

            const localParticipant: any = { local: true, id: 'local-id' };
            const remoteParticipant: any = { local: false, id: 'remote-1' };

            assert.strictEqual(isParticipantMediaMuted(localParticipant, MEDIA_TYPE.AUDIO, state), false);
            assert.strictEqual(isParticipantMediaMuted(remoteParticipant, MEDIA_TYPE.AUDIO, state), true);
            assert.strictEqual(isParticipantMediaMuted(undefined, MEDIA_TYPE.AUDIO, state), false);
        });

        it('isParticipantAudioMuted, isParticipantVideoMuted, isParticipantScreenShareMuted verify media types', () => {
            const state: any = {
                'features/base/tracks': [
                    { local: true, mediaType: MEDIA_TYPE.AUDIO, muted: true, jitsiTrack: {} },
                    { local: true, mediaType: MEDIA_TYPE.VIDEO, muted: false, jitsiTrack: {} }
                ],
                'features/base/config': {}
            };
            const localParticipant: any = { local: true, id: 'local-id' };

            assert.strictEqual(isParticipantAudioMuted(localParticipant, state), true);
            assert.strictEqual(isParticipantVideoMuted(localParticipant, state), false);
            assert.strictEqual(isParticipantScreenShareMuted(localParticipant, state), true);
        });
    });

    describe('getCameraFacingMode', () => {
        it('returns camera facing mode from config if specified', () => {
            const state: any = {
                'features/base/config': {
                    cameraFacingMode: CAMERA_FACING_MODE.ENVIRONMENT
                }
            };
            assert.strictEqual(getCameraFacingMode(state), CAMERA_FACING_MODE.ENVIRONMENT);
        });

        it('defaults to USER when not specified in config', () => {
            const state: any = {
                'features/base/config': {}
            };
            assert.strictEqual(getCameraFacingMode(state), CAMERA_FACING_MODE.USER);
        });
    });

    describe('setTrackMuted', () => {
        it('resolves immediately when track is already in requested mute state', async () => {
            let muteCalled = false;
            const mockTrack: any = {
                isMuted: () => true,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                mute: () => {
                    muteCalled = true;

                    return Promise.resolve();
                }
            };

            await setTrackMuted(mockTrack, true, {} as any);
            assert.strictEqual(muteCalled, false, 'Should not call mute() if track is already muted');
        });

        it('calls track.mute() when muting an unmuted track', async () => {
            let muteCalled = false;
            const mockTrack: any = {
                isMuted: () => false,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                getType: () => MEDIA_TYPE.AUDIO,
                mute: () => {
                    muteCalled = true;

                    return Promise.resolve('muted-ok');
                }
            };

            const result = await setTrackMuted(mockTrack, true, {} as any);
            assert.strictEqual(muteCalled, true);
            assert.strictEqual(result, 'muted-ok');
        });

        it('calls track.unmute() when unmuting a muted track', async () => {
            let unmuteCalled = false;
            const mockTrack: any = {
                isMuted: () => true,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                getType: () => MEDIA_TYPE.VIDEO,
                unmute: () => {
                    unmuteCalled = true;

                    return Promise.resolve('unmuted-ok');
                }
            };

            const result = await setTrackMuted(mockTrack, false, {} as any);
            assert.strictEqual(unmuteCalled, true);
            assert.strictEqual(result, 'unmuted-ok');
        });

        it('handles TRACK_IS_DISPOSED error gracefully without rejecting', async () => {
            const disposedError = new Error('Track disposed');
            disposedError.name = JitsiTrackErrors.TRACK_IS_DISPOSED;

            const mockTrack: any = {
                isMuted: () => false,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                getType: () => MEDIA_TYPE.AUDIO,
                mute: () => Promise.reject(disposedError)
            };

            const result = await setTrackMuted(mockTrack, true, {} as any);
            assert.strictEqual(result, undefined, 'Should resolve gracefully when track is disposed');
        });
    });
});
