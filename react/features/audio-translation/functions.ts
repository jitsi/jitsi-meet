import { IReduxState } from '../app/types';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { ITrack } from '../base/tracks/types';

import { DUCKED_ORIGINAL_VOLUME, TranslationTreatment } from './constants';

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
 * Whether the given participant is currently translating the local participant's audio, per the directed
 * {@code translationListeners} list pushed by the audio-translation component.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The participant (endpoint) id to check.
 * @returns {boolean}
 */
export function isParticipantAudioTranslationActive(state: IReduxState, participantId: string): boolean {
    return state['features/audio-translation'].translationListeners.includes(participantId);
}

/**
 * The owner endpoint id encoded in a translated source name — the substring before the first {@code -}.
 * Translated sources follow the {@code <endpointId>-a<idx>.<lang>} convention (endpoint ids are dash/dot-free).
 * Returns an empty string for a source without a dash.
 *
 * @param {string} sourceName - The translated source name.
 * @returns {string}
 */
export function getSourceOwnerEndpointId(sourceName: string): string {
    const dashIndex = sourceName.indexOf('-');

    return dashIndex === -1 ? '' : sourceName.substring(0, dashIndex);
}

/**
 * Whether the bridge is currently forwarding any translated audio owned by the given participant to us (i.e. we
 * are hearing that participant translated), per the {@code receivingSources} set.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The participant (endpoint) id to check.
 * @returns {boolean}
 */
export function isReceivingTranslationFrom(state: IReduxState, participantId: string): boolean {
    return state['features/audio-translation'].receivingSources
        .some(sourceName => getSourceOwnerEndpointId(sourceName) === participantId);
}

/**
 * The audio-translation status treatment for a participant, combining whether translation is enabled for the
 * local user ({@link isParticipantAudioTranslationActive}) and whether translated audio is being received
 * ({@link isReceivingTranslationFrom}).
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The participant (endpoint) id to check.
 * @returns {TranslationTreatment}
 */
export function getTranslationTreatment(state: IReduxState, participantId: string): TranslationTreatment {
    const enabled = isParticipantAudioTranslationActive(state, participantId);
    const receiving = isReceivingTranslationFrom(state, participantId);

    if (enabled && receiving) {
        return TranslationTreatment.BOTH;
    }
    if (enabled) {
        return TranslationTreatment.ENABLED;
    }
    if (receiving) {
        return TranslationTreatment.RECEIVING;
    }

    return TranslationTreatment.NONE;
}

/**
 * Whether audio translation is currently active anywhere in the meeting: a remote participant is translating
 * the local user, translated audio is being received, or the local user has translation on.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isAudioTranslationActiveInMeeting(state: IReduxState): boolean {
    const { language, participantLanguages, receivingSources, translationListeners }
        = state['features/audio-translation'];

    return translationListeners.length > 0
        || receivingSources.length > 0
        || Boolean(language)
        || Object.values(participantLanguages).some(lang => lang !== null);
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
 * Whether the audio-translation UI should be available to the local user: the feature must be deployed
 * ({@code config.audioTranslation.enabled}) and either the user can manage it or it is enabled for the room.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isAudioTranslationAvailable(state: IReduxState): boolean {
    if (!state['features/base/config'].audioTranslation?.enabled) {
        return false;
    }

    // A deployment can hide the feature for a room via the audioTranslationAvailable RoomMetadata flag
    // (e.g. when the translation backend is not provisioned for it). Absent, or any value other than an
    // explicit false, means available. Applies even to those who could otherwise manage it.
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
 * The effective translation language for a speaker: the per-participant override when one is set (which may
 * be null to disable), otherwise the conference-wide default.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} [participantId] - The speaker's participant id.
 * @returns {string | null} The language the speaker's audio is translated into, or null.
 */
export function getEffectiveTranslationLanguage(state: IReduxState, participantId?: string): string | null {
    const { language, participantLanguages } = state['features/audio-translation'];

    return participantId && participantId in participantLanguages
        ? participantLanguages[participantId]
        : language;
}

/**
 * Whether a speaker's original audio should be ducked: translation is on for the speaker, the given source
 * is not itself a translated one, and its translated counterpart ({@code <sourceName>.<language>}) is
 * currently present in the conference.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} [sourceName] - The source name of the speaker's original audio track.
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
 * The volume (0..1) a speaker's original audio is ducked to while its translation plays. Overridable via
 * config.audioTranslation.duckedVolume; values outside 0..1 (or non-numbers from configOverwrite) fall back
 * to the default, since an invalid value would throw when assigned to HTMLMediaElement.volume.
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
