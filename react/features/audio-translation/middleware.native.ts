import { IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { DEFAULT_ORIGINAL_VOLUME } from './constants';
import { getDuckedVolumeForParticipant, shouldDuckOriginalAudio } from './functions';
import logger from './logger';

import './middleware.any';

/**
 * The playout gain last applied per WebRTC track id, so a track is only touched when our target for it
 * changes. Tracks that were never ducked are left entirely to the user's volume slider.
 */
const appliedVolumes = new Map<string, number>();

/**
 * Ducks original remote audio natively: while a speaker's translated counterpart is present the original
 * plays at the ducked volume and is restored to the user-selected (or full) volume afterwards. Native has
 * no per-track audio elements, so playout gain is set through react-native-webrtc's _setVolume.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} reassertDucked - Also re-apply the ducked volume to already-ducked tracks. Used when the
 * user's per-participant volume changes, since the native volume slider writes the track gain directly and
 * would otherwise override the duck until the next state change.
 * @returns {void}
 */
function _applyDucking({ getState }: IStore, reassertDucked = false): void {
    const state = getState();
    const { participantsVolume } = state['features/filmstrip'];
    const currentIds = new Set<string>();

    for (const track of state['features/base/tracks']) {
        if (track.local || track.mediaType !== MEDIA_TYPE.AUDIO) {
            continue;
        }

        const webrtcTrack = track.jitsiTrack?.getTrack?.();
        const trackId: string | undefined = webrtcTrack?.id;

        if (!webrtcTrack || typeof webrtcTrack._setVolume !== 'function' || !trackId) {
            continue;
        }
        currentIds.add(trackId);

        const sourceName: string | undefined = track.jitsiTrack?.getSourceName?.();
        const ducked = shouldDuckOriginalAudio(state, sourceName, track.participantId);
        const userVolume = track.participantId ? participantsVolume[track.participantId] : undefined;
        const target = ducked
            ? getDuckedVolumeForParticipant(state, track.participantId)
            : typeof userVolume === 'number' ? userVolume : DEFAULT_ORIGINAL_VOLUME;
        const applied = appliedVolumes.get(trackId);

        if ((!ducked && applied === undefined)
                || (applied === target && !(ducked && reassertDucked))) {
            continue;
        }

        try {
            webrtcTrack._setVolume(target);
            appliedVolumes.set(trackId, target);
        } catch (error) {
            logger.warn(`Failed to set playout volume for track ${trackId}`, error);
        }
    }

    for (const id of Array.from(appliedVolumes.keys())) {
        if (!currentIds.has(id)) {
            appliedVolumes.delete(id);
        }
    }
}

StateListenerRegistry.register(
    state => state['features/base/tracks'],
    (_, store) => _applyDucking(store));

StateListenerRegistry.register(
    state => state['features/audio-translation'].language,
    (_, store) => _applyDucking(store));

StateListenerRegistry.register(
    state => state['features/audio-translation'].participantLanguages,
    (_, store) => _applyDucking(store));

// The native volume slider writes the track gain directly (throttled), so a slider move while ducked must
// be overridden again; its own trailing write may still win momentarily, until the next state change.
StateListenerRegistry.register(
    state => state['features/filmstrip'].participantsVolume,
    (_, store) => _applyDucking(store, true));
