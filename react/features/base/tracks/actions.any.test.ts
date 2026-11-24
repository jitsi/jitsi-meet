import { describe, expect, it, vi } from 'vitest';

import { TRACK_UPDATED } from './actionTypes';
import { trackAdded, trackRemoved } from './actions.any';

// Keep the import graph away from i18n, which needs a browser.
vi.mock('../../analytics/functions', () => ({}));
vi.mock('../../notifications/actions', () => ({}));
vi.mock('../conference/functions', () => ({}));
vi.mock('../environment/environment', () => ({}));
vi.mock('../media/actions', () => ({}));
vi.mock('../participants/functions', () => ({}));
vi.mock('./actions', () => ({}));
vi.mock('./functions', () => ({}));
vi.mock('./logger', () => ({ default: {} }));

vi.mock('../lib-jitsi-meet', () => {
    return {
        JitsiTrackErrors: {},
        JitsiTrackEvents: {
            LOCAL_TRACK_STOPPED: 'track.stopped',
            NO_DATA_FROM_SOURCE: 'track.no_data_from_source',
            TRACK_MUTE_CHANGED: 'track.trackMuteChanged',
            TRACK_VIDEOTYPE_CHANGED: 'track.videoTypeChanged'
        },
        JitsiTrackStreamingStatus: { ACTIVE: 'active' }
    };
});

const TRACK_MUTE_CHANGED = 'track.trackMuteChanged';

// A remote track whose listener API mirrors lib-jitsi-meet's Listenable.
const createRemoteTrack = () => {
    const listeners = new Map<string, Set<Function>>();
    const on = (event: string, listener: Function) => {
        listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
    };

    return {
        addCancellableListener: (event: string, listener: Function) => {
            on(event, listener);

            return () => listeners.get(event)?.delete(listener);
        },
        emit: (event: string) => listeners.get(event)?.forEach(listener => listener()),
        getParticipantId: () => 'abcd',
        getSourceName: () => 'abcd-a0',
        getType: () => 'audio',
        getVideoType: () => undefined,
        isLocal: () => false,
        isMuted: () => true,
        isP2P: true,
        on,
        removeAllListeners: (event: string) => listeners.delete(event)
    };
};

const add = (track: any, dispatch: any) => trackAdded(track)(dispatch, () => ({}) as any);

const updates = (dispatch: any) => dispatch.mock.calls.filter(([ action ]: any) => action?.type === TRACK_UPDATED);

describe('trackRemoved', () => {
    it('keeps the library\'s own listeners on the track', () => {
        const track = createRemoteTrack();
        const libraryListener = vi.fn();
        const dispatch = vi.fn();

        track.on(TRACK_MUTE_CHANGED, libraryListener);
        add(track, dispatch);
        trackRemoved(track);
        track.emit(TRACK_MUTE_CHANGED);

        expect(libraryListener).toHaveBeenCalledTimes(1);
        expect(updates(dispatch)).toHaveLength(0);
    });

    it('lets a track that is removed and added again on a remap update its mute state once', () => {
        const track = createRemoteTrack();
        const libraryListener = vi.fn();
        const dispatch = vi.fn();

        track.on(TRACK_MUTE_CHANGED, libraryListener);
        add(track, dispatch);
        trackRemoved(track);
        add(track, dispatch);
        track.emit(TRACK_MUTE_CHANGED);

        expect(libraryListener).toHaveBeenCalledTimes(1);
        expect(updates(dispatch)).toHaveLength(1);
    });
});
