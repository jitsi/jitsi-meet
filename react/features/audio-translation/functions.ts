import { IReduxState } from '../app/types';
import { IConfig } from '../base/config/configType';
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
 * Configuration problems already logged by {@link orderAudioTranslationLanguages}, so each is reported once rather
 * than on every render.
 */
const reportedConfigProblems = new Set<string>();

/**
 * Whether a configured code can be requested as a translation language today. Prosody's audio-translation
 * component ({@code mod_audio_translation_component.lua}, {@code is_valid_language}) accepts only ASCII letters,
 * at most 20 of them, and rejects the whole request with {@code bad-request} on the first invalid entry, so one bad
 * code configured for a meeting-wide language fails translation for every speaker. Since v2236 the lib-jitsi-meet
 * source-name parser accepts a region or script subtag ('pt-BR'), so the prosody check is what has to change
 * before such codes can be offered.
 *
 * @param {string} code - The language code.
 * @returns {boolean}
 */
function isUsableAudioTranslationCode(code: string): boolean {
    return /^[a-z]{1,20}$/i.test(code);
}

/**
 * The target languages offered in the audio-translation picker, in order:
 * {@code config.audioTranslation.translationLanguages} (else the built-in default list every provider supports),
 * with the codes named in {@code translationLanguagesHead} moved to the top. The head only reorders: a head entry
 * is matched to the offered list case-insensitively and takes the list's spelling, and one that is not in the list
 * is ignored, so it can neither add a language the deployment's provider may not accept nor change the exact code
 * sent. The currently selected language, if any, is kept in the list even when the configuration no longer offers
 * it, so the picker can still show what is active (the rows match it by exact string). Codes are kept as spelled
 * (they go to the bridge and on to the translation provider as-is) and deduplicated case-insensitively; blanks are
 * dropped, and codes prosody would refuse are dropped with a warning (see {@link isUsableAudioTranslationCode}).
 * The defaults apply only when {@code translationLanguages} is unset ({@code undefined}, or {@code null}, which is
 * how a {@code configOverwrite} resets a key): a list that is set but unusable (not an array, empty, or every
 * entry dropped) is a misconfiguration, logged once, and offers nothing rather than 13 languages the deployer did
 * not choose and the provider may not accept.
 *
 * @param {Object | undefined} config - The {@code audioTranslation} config block ({@code IConfig['audioTranslation']}).
 * @param {string | null | undefined} selectedLanguage - The language currently active for the picker's target.
 * @returns {Array<string>} The language codes, in picker order.
 */
export function orderAudioTranslationLanguages(
        config: IConfig['audioTranslation'],
        selectedLanguage?: string | null): Array<string> {
    const key = (code: string) => code.toLowerCase();
    const reportOnce = (what: string, message: string) => {
        if (!reportedConfigProblems.has(what)) {
            reportedConfigProblems.add(what);
            logger.warn(message);
        }
    };
    const clean = (codes: unknown): Array<string> => {
        const seen = new Set<string>();
        const out: Array<string> = [];

        for (const code of Array.isArray(codes) ? codes : []) {
            const trimmed = typeof code === 'string' ? code.trim() : '';

            if (!trimmed || seen.has(key(trimmed))) {
                continue;
            }
            if (!isUsableAudioTranslationCode(trimmed)) {
                reportOnce(`code:${trimmed}`, `Dropping audio-translation language "${trimmed}": prosody accepts `
                    + 'only codes of 1-20 ASCII letters');
                continue;
            }
            seen.add(key(trimmed));
            out.push(trimmed);
        }

        return out;
    };
    const configured = config?.translationLanguages;
    let list: Array<string>;

    if (configured === undefined || configured === null) {
        list = DEFAULT_TRANSLATION_LANGUAGES.map(({ code }) => code);
    } else {
        list = clean(configured);
        if (list.length === 0) {
            reportOnce('list', 'config.audioTranslation.translationLanguages is set but offers no usable language '
                + `(${JSON.stringify(configured)}); the picker offers none`);
        }
    }

    // Head entries take the list's spelling, so the head cannot change the code that is sent.
    const byKey = new Map(list.map(code => [ key(code), code ]));
    const head = clean(config?.translationLanguagesHead)
        .map(code => byKey.get(key(code)))
        .filter((code): code is string => Boolean(code));
    const headKeys = new Set(head.map(key));
    const selected = selectedLanguage && !list.includes(selectedLanguage) ? [ selectedLanguage ] : [];

    return [ ...head, ...selected, ...list.filter(code => !headKeys.has(key(code))) ];
}

/**
 * Own-locale language names already resolved through {@code Intl.DisplayNames}, by code. The lookups are cheap but
 * run per row per render, and the answer for a code never changes within a session.
 */
const displayNameCache = new Map<string, string | undefined>();

/**
 * The name of a language in that language, from the platform's CLDR data via {@code Intl.DisplayNames}, or
 * undefined when the API is missing (Hermes implements no {@code Intl.DisplayNames}, so this is always undefined
 * on mobile), the code is not a valid tag, or CLDR has no name for it ({@code fallback: 'none'}). CLDR gives
 * Latin-script names in lower case ('español'), so the first letter is upper-cased in the language's own locale.
 *
 * @param {string} code - The language code.
 * @returns {string | undefined}
 */
function getOwnLocaleLanguageName(code: string): string | undefined {
    if (displayNameCache.has(code)) {
        return displayNameCache.get(code);
    }

    let name: string | undefined;

    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
        try {
            const raw = new Intl.DisplayNames([ code ], { fallback: 'none', type: 'language' }).of(code);

            if (raw) {
                name = raw.charAt(0).toLocaleUpperCase(code) + raw.slice(1);
            }
        } catch (_) {
            // An invalid language tag throws RangeError; fall through to the i18n lookup.
        }
    }
    displayNameCache.set(code, name);

    return name;
}

/**
 * The picker label for an audio-translation language code: the hand-written native-script label of the default
 * list when the code is on it (the same on every platform); else the language's own name from
 * {@code Intl.DisplayNames} where the platform has it (browsers; not Hermes, see {@link getOwnLocaleLanguageName});
 * else the English name from the {@code translation-languages} i18n namespace (lang/translation-languages.json);
 * else the code itself.
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

    const ownName = getOwnLocaleLanguageName(code);

    if (ownName) {
        return ownName;
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

