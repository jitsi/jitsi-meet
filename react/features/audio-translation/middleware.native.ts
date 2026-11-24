import { IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { DEFAULT_ORIGINAL_VOLUME } from './constants';
import { getDuckedVolumeForParticipant, shouldDuckOriginalAudio } from './functions';
import logger from './logger';

import './middleware.any';

// Playout gain last applied per track id; untouched tracks are left to the volume slider.
const appliedVolumes = new Map<string, number>();

/**
 * Ducks original remote audio via _setVolume (native has no per-track audio elements), restoring the
 * user/full volume afterwards.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} reassertDucked - Re-apply the duck after a slider move overwrote the gain.
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

// A slider move writes the gain directly, so re-assert the duck over it.
StateListenerRegistry.register(
    state => state['features/filmstrip'].participantsVolume,
    (_, store) => _applyDucking(store, true));
