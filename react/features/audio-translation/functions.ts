import { IReduxState } from '../app/types';
import { AUDIO_TRANSLATION_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { ITrack } from '../base/tracks/types';

import { DUCKED_ORIGINAL_VOLUME } from './constants';

/**
 * Whether audio translation is enabled for the room. Driven by the {@code audioTranslation} RoomMetadata flag,
 * which a moderator can toggle; absent or any value other than an explicit {@code false} means enabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isAudioTranslationRoomEnabled(state: IReduxState): boolean {
    return state['features/base/conference'].metadata?.audioTranslation?.enabled !== false;
}

/**
 * Whether audio translation is in progress in the meeting, for the conference label. Only control-plane
 * signals count: languages participants declare, the listener counts speakers publish in room metadata, and
 * the component's listeners push.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isAudioTranslationActiveInMeeting(state: IReduxState): boolean {
    const { language, participantLanguages, translationListeners } = state['features/audio-translation'];
    const listenerCounts = state['features/base/conference'].metadata?.audioTranslationListenerCounts ?? {};

    return translationListeners.length > 0
        || Boolean(language)
        || Object.values(participantLanguages).some(lang => lang !== null)
        || Object.values(listenerCounts).some(counts => Object.values(counts).some(count => count > 0));
}

/**
 * Whether any speaker's translated audio is currently playing out in the meeting. The bridge floods sending
 * changes to every endpoint, so this is conference-wide rather than specific to what we subscribed to.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTranslationPlayingOut(state: IReduxState): boolean {
    return state['features/audio-translation'].receivingSources.length > 0;
}

/**
 * Whether the local user may manage audio translation for the room (i.e. toggle the room-wide flag). Mirrors the
 * prosody {@code live-translation} permission: the token's explicit value wins, otherwise moderators have it.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function canManageAudioTranslation(state: IReduxState): boolean {
    return isJwtFeatureEnabled(state, MEET_FEATURES.LIVE_TRANSLATION, isLocalParticipantModerator(state));
}

/**
 * Whether the audio-translation UI should be available to the local user: the feature must be enabled in config
 * and supported by the deployment, and either the user can manage it or it is enabled for the room.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isAudioTranslationAvailable(state: IReduxState): boolean {
    // SDK embedder kill switch; defaults true, so web (no flags state) is unaffected.
    if (!getFeatureFlag(state, AUDIO_TRANSLATION_ENABLED, true)) {
        return false;
    }

    if (!state['features/base/config'].audioTranslation?.enabled) {
        return false;
    }

    // The component is advertised over service discovery, so an enabled config does not mean it is deployed.
    // Only an explicit false hides it, so an older lib-jitsi-meet without the check stays unaffected.
    if (state['features/base/conference'].conference?.isAudioTranslationSupported?.() === false) {
        return false;
    }

    // Per-room availability via RoomMetadata; only an explicit false hides it.
    if (state['features/base/conference'].metadata?.audioTranslationAvailable === false) {
        return false;
    }

    return canManageAudioTranslation(state) || isAudioTranslationRoomEnabled(state);
}

/**
 * Memoization for {@link getTranslatedSourceNames}: the tracks array is replaced on every tracks update, so
 * the set is rebuilt only when that reference changes and is shared by all callers in between.
 */
let _lastTracks: ITrack[] | undefined;
let _lastTranslatedSourceNames = new Set<string>();

/**
 * Returns the set of translated audio source names currently present in the conference. Translated sources
 * follow the {@code <sourceName>.<language>} convention, so any source name containing a dot is one. Memoized
 * on the tracks array reference, letting callers do an O(1) lookup instead of scanning every track.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Set<string>} The translated source names present in the conference.
 */
export function getTranslatedSourceNames(state: IReduxState): Set<string> {
    const tracks = state['features/base/tracks'];

    if (tracks === _lastTracks) {
        return _lastTranslatedSourceNames;
    }

    const translated = new Set<string>();

    for (const track of tracks) {
        const sourceName = track.jitsiTrack?.getSourceName?.();

        if (typeof sourceName === 'string' && sourceName.includes('.')) {
            translated.add(sourceName);
        }
    }

    _lastTracks = tracks;
    _lastTranslatedSourceNames = translated;

    return translated;
}

/**
 * The per-participant override language if set, else the conference-wide default.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} [participantId] - The speaker's participant id.
 * @returns {string | null} The target language, or null.
 */
export function getEffectiveTranslationLanguage(state: IReduxState, participantId?: string): string | null {
    const { language, participantLanguages } = state['features/audio-translation'];

    return participantId && participantId in participantLanguages
        ? participantLanguages[participantId]
        : language;
}

/**
 * Whether to duck a speaker's original: a language is set and its translated counterpart is present.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} [sourceName] - The original audio source name.
 * @param {string} [participantId] - The speaker's participant id.
 * @returns {boolean}
 */
export function shouldDuckOriginalAudio(state: IReduxState, sourceName?: string, participantId?: string): boolean {
    const language = getEffectiveTranslationLanguage(state, participantId);

    if (!language || typeof sourceName !== 'string' || sourceName.endsWith(`.${language}`)) {
        return false;
    }

    return getTranslatedSourceNames(state).has(`${sourceName}.${language}`);
}

/**
 * The ducked volume (0..1) from config.audioTranslation.duckedVolume; invalid values fall back to default.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number}
 */
export function getDuckedVolume(state: IReduxState): number {
    const configured = state['features/base/config'].audioTranslation?.duckedVolume;

    return typeof configured === 'number' && configured >= 0 && configured <= 1
        ? configured
        : DUCKED_ORIGINAL_VOLUME;
}

/**
 * The ducked volume, capped at the user's chosen volume so ducking never makes a quieted speaker louder.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} [participantId] - The speaker's participant id.
 * @returns {number}
 */
export function getDuckedVolumeForParticipant(state: IReduxState, participantId?: string): number {
    const duckedVolume = getDuckedVolume(state);
    const userVolume = participantId ? state['features/filmstrip'].participantsVolume[participantId] : undefined;

    return typeof userVolume === 'number' ? Math.min(userVolume, duckedVolume) : duckedVolume;
}

