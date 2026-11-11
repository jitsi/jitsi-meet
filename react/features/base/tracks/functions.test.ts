// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib-jitsi-meet', () => ({
    browser: {
        isChromiumBased: () => true
    },
    JitsiTrackErrors: {
        TRACK_IS_DISPOSED: 'track.track_is_disposed'
    }
}));

vi.mock('../media/actions', () => ({
    gumPending: (mediaTypes: any, status: any) => ({
        mediaTypes,
        status,
        type: 'GUM_PENDING'
    })
}));

vi.mock('../participants/functions', () => ({
    getMutedStateByParticipantAndMediaType: (state: any, participant: any, mediaType: any) => {
        const tracks = state?.['features/base/tracks'] || [];

        if (participant?.local) {
            const t = tracks.find((x: any) => x.local && x.mediaType === mediaType);

            return !t || Boolean(t.muted);
        }
        const t = tracks.find((x: any) => x.participantId === participant?.id && x.mediaType === mediaType);

        return !t || Boolean(t.muted);
    },
    getVirtualScreenshareParticipantOwnerId: (id: string) => (id ? id.replace(/-screenshare$/, '') : id),
    isScreenShareParticipant: (participant: any) =>
        Boolean(participant?.isVirtualScreenshareParticipant || participant?.id?.includes('-screenshare')),
    isVoiceAgentParticipant: () => false
}));

import { CAMERA_FACING_MODE, MEDIA_TYPE, VIDEO_TYPE } from '../media/constants';

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
    getTrackState,
    getTracksByMediaType,
    getVirtualScreenshareParticipantTrack,
    isLocalTrackMuted,
    isLocalVideoTrackDesktop,
    isParticipantAudioMuted,
    isParticipantMediaMuted,
    isParticipantScreenShareMuted,
    isParticipantVideoMuted,
    isRemoteTrackMuted,
    setTrackMuted
} from './functions.any';

describe('Tracks Functions Unit Tests', () => {
    describe('getTrackState', () => {
        it('returns tracks state from global redux state', () => {
            const mockTracks = [ { jitsiTrack: {}, local: true } ];
            const state: any = {
                'features/base/tracks': mockTracks
            };

            expect(getTrackState(state)).toBe(mockTracks);
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

            expect(readyLocalTracks.length).toBe(3);
            expect(readyLocalTracks.includes(pendingLocalTrack as any)).toBe(false);
            expect(readyLocalTracks.includes(remoteTrack as any)).toBe(false);

            const localTracksWithPending = getLocalTracks(allTracks as any, true);

            expect(localTracksWithPending.length).toBe(4);
            expect(localTracksWithPending.includes(pendingLocalTrack as any)).toBe(true);
        });

        it('getLocalTrack retrieves track by media type', () => {
            const audio = getLocalTrack(allTracks as any, MEDIA_TYPE.AUDIO);

            expect(audio).toBe(localAudioTrack);

            const video = getLocalTrack(allTracks as any, MEDIA_TYPE.VIDEO);

            expect(video).toBe(localVideoTrack);

            const desktop = getLocalTrack(allTracks as any, MEDIA_TYPE.SCREENSHARE);

            expect(desktop).toBe(localDesktopTrack);
        });

        it('getLocalAudioTrack, getLocalVideoTrack, and getLocalDesktopTrack return correct tracks', () => {
            expect(getLocalAudioTrack(allTracks as any)).toBe(localAudioTrack);
            expect(getLocalVideoTrack(allTracks as any)).toBe(localVideoTrack);
            expect(getLocalDesktopTrack(allTracks as any)).toBe(localDesktopTrack);
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

            expect(getLocalJitsiAudioTrack(state)).toBe(jitsiAudio);
            expect(getLocalJitsiVideoTrack(state)).toBe(jitsiVideo);
            expect(getLocalJitsiDesktopTrack(state)).toBe(jitsiDesktop);
        });

        it('returns undefined when track is missing from state', () => {
            const emptyState: any = { 'features/base/tracks': [] };

            expect(getLocalJitsiAudioTrack(emptyState)).toBeUndefined();
            expect(getLocalJitsiVideoTrack(emptyState)).toBeUndefined();
            expect(getLocalJitsiDesktopTrack(emptyState)).toBeUndefined();
        });
    });

    describe('Participant track queries', () => {
        const participantId1 = 'user-1';
        const participantId2 = 'user-2';

        const track1 = {
            jitsiTrack: { id: 't1' },
            mediaType: MEDIA_TYPE.AUDIO,
            participantId: participantId1
        };
        const track2 = {
            jitsiTrack: { id: 't2' },
            mediaType: MEDIA_TYPE.VIDEO,
            participantId: participantId1
        };
        const track3 = {
            jitsiTrack: { id: 't3' },
            mediaType: MEDIA_TYPE.VIDEO,
            participantId: participantId2
        };
        const screenshareTrack = {
            jitsiTrack: { id: 't4' },
            mediaType: MEDIA_TYPE.SCREENSHARE,
            participantId: participantId2,
            videoType: VIDEO_TYPE.DESKTOP
        };

        const tracks = [ track1, track2, track3, screenshareTrack ];

        it('getTrackByMediaTypeAndParticipant finds participant track by type', () => {
            const res = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, participantId1);

            expect(res).toBe(track1);

            const notFound = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, participantId2);

            expect(notFound).toBeUndefined();

            const undefinedParticipant = getTrackByMediaTypeAndParticipant(tracks as any, MEDIA_TYPE.AUDIO, undefined);

            expect(undefinedParticipant).toBeUndefined();
        });

        it('getTrackByParticipantId returns all tracks for a participant', () => {
            const user1Tracks = getTrackByParticipantId(tracks as any, participantId1);

            expect(user1Tracks.length).toBe(2);
            expect(user1Tracks).toEqual([ track1, track2 ]);
        });

        it('getScreenShareTrack and getVirtualScreenshareParticipantTrack find screenshare', () => {
            const screen = getScreenShareTrack(tracks as any, participantId2);

            expect(screen).toBe(screenshareTrack);

            const virtualScreen = getVirtualScreenshareParticipantTrack(tracks as any, `${participantId2}-screenshare`);

            expect(virtualScreen).toBe(screenshareTrack);
        });

        it('getTrackByJitsiTrack matches track by underlying instance', () => {
            expect(getTrackByJitsiTrack(tracks as any, track2.jitsiTrack)).toBe(track2);
            expect(getTrackByJitsiTrack(tracks as any, {})).toBeUndefined();
        });

        it('getTracksByMediaType filters all tracks by media type', () => {
            const videoTracks = getTracksByMediaType(tracks as any, MEDIA_TYPE.VIDEO);

            expect(videoTracks.length).toBe(2);
            expect(videoTracks).toEqual([ track2, track3 ]);
        });
    });

    describe('Mute state checks', () => {
        it('isLocalTrackMuted returns true for muted or missing local track', () => {
            const unmutedAudio = [ { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.AUDIO, muted: false } ];

            expect(isLocalTrackMuted(unmutedAudio as any, MEDIA_TYPE.AUDIO)).toBe(false);

            const mutedAudio = [ { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.AUDIO, muted: true } ];

            expect(isLocalTrackMuted(mutedAudio as any, MEDIA_TYPE.AUDIO)).toBe(true);

            const emptyTracks: any[] = [];

            expect(isLocalTrackMuted(emptyTracks, MEDIA_TYPE.AUDIO)).toBe(true);
        });

        it('isRemoteTrackMuted returns true for muted or missing remote track', () => {
            const remoteTracks = [
                { jitsiTrack: {}, mediaType: MEDIA_TYPE.AUDIO, muted: false, participantId: 'remote-1' },
                { jitsiTrack: {}, mediaType: MEDIA_TYPE.AUDIO, muted: true, participantId: 'remote-2' }
            ];

            expect(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'remote-1')).toBe(false);
            expect(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'remote-2')).toBe(true);
            expect(isRemoteTrackMuted(remoteTracks as any, MEDIA_TYPE.AUDIO, 'unknown-user')).toBe(true);
        });

        it('isLocalVideoTrackDesktop returns true when unmuted desktop track exists', () => {
            const stateWithActiveDesktop: any = {
                'features/base/tracks': [
                    { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.SCREENSHARE, muted: false }
                ]
            };

            expect(isLocalVideoTrackDesktop(stateWithActiveDesktop)).toBe(true);

            const stateWithMutedDesktop: any = {
                'features/base/tracks': [
                    { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.SCREENSHARE, muted: true }
                ]
            };

            expect(isLocalVideoTrackDesktop(stateWithMutedDesktop)).toBe(false);

            const stateWithoutDesktop: any = {
                'features/base/tracks': []
            };

            expect(isLocalVideoTrackDesktop(stateWithoutDesktop)).toBe(false);
        });

        it('isParticipantMediaMuted evaluates local and remote participants', () => {
            const state: any = {
                'features/base/config': {},
                'features/base/tracks': [
                    { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.AUDIO, muted: false },
                    { jitsiTrack: {}, mediaType: MEDIA_TYPE.AUDIO, muted: true, participantId: 'remote-1' }
                ]
            };

            const localParticipant: any = { id: 'local-id', local: true };
            const remoteParticipant: any = { id: 'remote-1', local: false };

            expect(isParticipantMediaMuted(localParticipant, MEDIA_TYPE.AUDIO, state)).toBe(false);
            expect(isParticipantMediaMuted(remoteParticipant, MEDIA_TYPE.AUDIO, state)).toBe(true);
            expect(isParticipantMediaMuted(undefined, MEDIA_TYPE.AUDIO, state)).toBe(false);
        });

        it('isParticipantAudioMuted, isParticipantVideoMuted, isParticipantScreenShareMuted verify media types', () => {
            const state: any = {
                'features/base/config': {},
                'features/base/tracks': [
                    { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.AUDIO, muted: true },
                    { jitsiTrack: {}, local: true, mediaType: MEDIA_TYPE.VIDEO, muted: false }
                ]
            };
            const localParticipant: any = { id: 'local-id', local: true };

            expect(isParticipantAudioMuted(localParticipant, state)).toBe(true);
            expect(isParticipantVideoMuted(localParticipant, state)).toBe(false);
            expect(isParticipantScreenShareMuted(localParticipant, state)).toBe(true);
        });
    });

    describe('getCameraFacingMode', () => {
        it('returns camera facing mode from config if specified', () => {
            const state: any = {
                'features/base/config': {
                    cameraFacingMode: CAMERA_FACING_MODE.ENVIRONMENT
                }
            };

            expect(getCameraFacingMode(state)).toBe(CAMERA_FACING_MODE.ENVIRONMENT);
        });

        it('defaults to USER when not specified in config', () => {
            const state: any = {
                'features/base/config': {}
            };

            expect(getCameraFacingMode(state)).toBe(CAMERA_FACING_MODE.USER);
        });
    });

    describe('setTrackMuted', () => {
        it('resolves immediately when track is already in requested mute state', async () => {
            let muteCalled = false;
            const mockTrack: any = {
                getVideoType: () => VIDEO_TYPE.CAMERA,
                isMuted: () => true,
                mute: () => {
                    muteCalled = true;

                    return Promise.resolve();
                }
            };

            await setTrackMuted(mockTrack, true, {} as any);
            expect(muteCalled).toBe(false);
        });

        it('calls track.mute() when muting an unmuted track', async () => {
            let muteCalled = false;
            const mockTrack: any = {
                getType: () => MEDIA_TYPE.AUDIO,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                isMuted: () => false,
                mute: () => {
                    muteCalled = true;

                    return Promise.resolve('muted-ok');
                }
            };

            const result = await setTrackMuted(mockTrack, true, {} as any);

            expect(muteCalled).toBe(true);
            expect(result).toBe('muted-ok');
        });

        it('calls track.unmute() when unmuting a muted track', async () => {
            let unmuteCalled = false;
            const mockTrack: any = {
                getType: () => MEDIA_TYPE.VIDEO,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                isMuted: () => true,
                unmute: () => {
                    unmuteCalled = true;

                    return Promise.resolve('unmuted-ok');
                }
            };

            const result = await setTrackMuted(mockTrack, false, {} as any);

            expect(unmuteCalled).toBe(true);
            expect(result).toBe('unmuted-ok');
        });

        it('handles TRACK_IS_DISPOSED error gracefully without rejecting', async () => {
            const disposedError = new Error('Track disposed');

            disposedError.name = 'track.track_is_disposed';

            const mockTrack: any = {
                getType: () => MEDIA_TYPE.AUDIO,
                getVideoType: () => VIDEO_TYPE.CAMERA,
                isMuted: () => false,
                mute: () => Promise.reject(disposedError)
            };

            const result = await setTrackMuted(mockTrack, true, {} as any);

            expect(result).toBeUndefined();
        });
    });
});
