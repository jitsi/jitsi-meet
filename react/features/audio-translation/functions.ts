import { IReduxState } from '../app/types';
import { AUDIO_TRANSLATION_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { ITrack } from '../base/tracks/types';

import { DEFAULT_TRANSLATION_LANGUAGES, DUCKED_ORIGINAL_VOLUME } from './constants';
import logger from './logger';

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
 * Codes already reported as dropped by {@link orderAudioTranslationLanguages}, so a misconfiguration is logged once
 * rather than on every render.
 */
const warnedDroppedCodes = new Set<string>();

/**
 * Whether a configured code can produce a translated track with the current lib-jitsi-meet: the translated source
 * is named {@code <source>.<code>}, and lib-jitsi-meet's {@code getMediaTypeFromSourceName} reads the media type
 * from the last '-' of a source name, so a code with a region or script subtag ('pt-BR') makes the track fail to
 * be created while the picker shows the language as active. Until that parser handles the suffix, such codes are
 * dropped here.
 *
 * @param {string} code - The language code.
 * @returns {boolean}
 */
function isUsableAudioTranslationCode(code: string): boolean {
    return !code.includes('-');
}

/**
 * The target languages offered in the audio-translation picker, in order:
 * {@code config.audioTranslation.translationLanguages} (else the built-in default list every provider supports),
 * with the codes named in {@code translationLanguagesHead} moved to the top. The head only reorders: a head code
 * that is not in the offered list is ignored, so it cannot add a language the deployment's provider may not accept.
 * The currently selected language, if any, is kept in the list even when the configuration no longer offers it,
 * so the picker can still show what is active. Codes are kept as spelled (they go to the bridge and on to the
 * translation provider as-is) but compared case-insensitively, so 'en' and 'EN' are one entry and a head entry
 * matches whatever case the list uses; blanks and duplicates are dropped, codes lib-jitsi-meet cannot name a track
 * for are dropped with a warning (see {@link isUsableAudioTranslationCode}), and a configured list that leaves
 * nothing behind falls back to the default list.
 *
 * @param {Object | undefined} config - The {@code audioTranslation} config block.
 * @param {string | null | undefined} selectedLanguage - The language currently active for the picker's target.
 * @returns {Array<string>} The language codes, in picker order.
 */
export function orderAudioTranslationLanguages(
        config: { translationLanguages?: Array<string>; translationLanguagesHead?: Array<string>; } | undefined,
        selectedLanguage?: string | null): Array<string> {
    const key = (code: string) => code.toLowerCase();
    const clean = (codes: unknown): Array<string> => {
        const seen = new Set<string>();
        const out: Array<string> = [];

        for (const code of Array.isArray(codes) ? codes : []) {
            const trimmed = typeof code === 'string' ? code.trim() : '';

            if (!trimmed || seen.has(key(trimmed))) {
                continue;
            }
            if (!isUsableAudioTranslationCode(trimmed)) {
                if (!warnedDroppedCodes.has(trimmed)) {
                    warnedDroppedCodes.add(trimmed);
                    logger.warn(`Dropping audio-translation language "${trimmed}": codes with a region or script `
                        + 'subtag cannot be named as a translated track by lib-jitsi-meet yet');
                }
                continue;
            }
            seen.add(key(trimmed));
            out.push(trimmed);
        }

        return out;
    };
    const defaults = DEFAULT_TRANSLATION_LANGUAGES.map(({ code }) => code);
    const configured = config?.translationLanguages;
    const offered = Array.isArray(configured) && configured.length > 0 ? clean(configured) : defaults;
    const list = offered.length > 0 ? offered : defaults;
    const listKeys = new Set(list.map(key));
    const inList = (code: string) => listKeys.has(key(code));
    const head = clean(config?.translationLanguagesHead).filter(inList);
    const headKeys = new Set(head.map(key));
    const selected = selectedLanguage && !inList(selectedLanguage) ? [ selectedLanguage ] : [];

    return [ ...head, ...selected, ...list.filter(code => !headKeys.has(key(code))) ];
}

/**
 * The picker label for an audio-translation language code: the native-script label of the default list when the
 * code is on it, else the name from the {@code translation-languages} i18n namespace
 * (lang/translation-languages.json), else the code itself.
 *
 * @param {string} code - The language code.
 * @param {Function} t - The i18n translate function.
 * @returns {string}
 */
export function getAudioTranslationLanguageLabel(code: string, t: (key: string) => string): string {
    const builtIn = DEFAULT_TRANSLATION_LANGUAGES.find(entry => entry.code === code);

    if (builtIn) {
        return builtIn.label;
    }

    // Try the code as configured first, then in BCP-47 canonical case, which is how translation-languages.json
    // keys its entries: primary subtag lower (zh), script title case (Hans), region upper (CN).
    const [ primary, ...rest ] = code.split('-');
    const canonical = [
        primary.toLowerCase(),
        ...rest.map(s => (s.length === 4 ? `${s[0].toUpperCase()}${s.slice(1).toLowerCase()}` : s.toUpperCase()))
    ].join('-');

    for (const candidate of canonical === code ? [ code ] : [ code, canonical ]) {
        const translated = t(`translation-languages:${candidate}`);

        // i18next returns the key without its namespace when there is no translation.
        if (translated && translated !== candidate) {
            return translated;
        }
    }

    return code;
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

