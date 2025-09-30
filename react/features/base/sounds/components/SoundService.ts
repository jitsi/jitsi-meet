import { Howl, Howler } from 'howler';
import i18next from 'i18next';

import { IReduxState } from '../../../app/types';
import { getConferenceState } from '../../conference/functions';
import { Sounds } from '../../config/configType';
import { AudioSupportedLanguage } from '../../media/constants';
import { registerSound, unregisterSound } from '../actions';
import { getDisabledSounds } from '../functions.any';
import logger from '../logger';

export interface ISoundRegistration {
    filePath: string;
    options: SoundOptions;
}

export interface ILocalizedSoundResult {
    localizedFilePath?: string;
    localizedSoundId?: string;
}

export type SoundOptions = {
    [key: string]: any;
    loop?: boolean;
    volume?: number;
};

class SoundService {
    /**
     * A map of sound IDs to their initialized Howl instances.
     *
     * @private
     */
    private howlSounds: Map<string, Howl> = new Map();

    /**
     * A map that stores the registration details for every sound.
     * Necessary for re-creating sounds when audio output device changes.
     *
     * @private
     */
    private registrations: Map<string, ISoundRegistration> = new Map();

    /**
     * Initializes the sound service. Should be called once on app startup.
     *
     * @returns {void}
     */
    public init(): void {
        Howler.autoUnlock = true;
        logger.info('SoundService initialized.');
    }

    /**
     * Registers a new sound with the service.
     *
     * @param {string} soundId - A unique identifier for the sound.
     * @param {string} filePath - The root-relative path to the sound file.
     * @param {SoundOptions} [options] - Optional Howler.js options.
     * @param {boolean} [optional=false] - Whether this sound is optional.
     * @param {boolean} [languages=false] - If true, loads sound for correct language.
     * @returns {void}
     */
    public register(
            soundId: string,
            filePath: string,
            options: SoundOptions = {},
            optional: boolean = false,
            languages: boolean = false
    ): void {
        if (this.registrations.has(soundId)) {
            logger.warn(`Sound '${soundId}' is already registered.`);

            return;
        }

        languages
            ? this.registerLocalizedSounds(soundId, filePath, options, optional, languages)
            : this.registerSingleSound(soundId, filePath, options, optional);
    }

    /**
     * Unregisters a sound from the service.
     *
     * @param {string} soundId - The identifier of the sound to unregister.
     * @returns {void}
     */
    public unregister(soundId: string): void {
        const soundToUnregister = this.howlSounds.get(soundId);

        if (soundToUnregister) {
            soundToUnregister.stop();
            soundToUnregister.unload();
            this.howlSounds.delete(soundId);
            APP.store.dispatch(unregisterSound(soundId));
            logger.info(`Sound '${soundId}' has been unregistered.`);
        } else {
            logger.warn(`SoundService.unregister: No sound found for id: ${soundId}`);
        }
    }

    /**
     * Plays a registered sound.
     *
     * @param {string} soundId - The identifier of the sound to play.
     * @param {IReduxState} state - The Redux state.
     * @param {boolean} [languages=false] - If true, loads sound for correct language.
     * @returns {void}
     */
    public play(soundId: string, state: IReduxState, languages: boolean = false): void {
        if (!this.shouldPlaySound(soundId, state)) {
            return;
        }

        const soundToPlay = this.getSoundInstance(soundId, languages);

        if (soundToPlay) {
            soundToPlay.play();
        } else {
            logger.warn(`SoundService.play: No sound found for id: ${soundId}`);
        }
    }

    /**
     * Stops a registered sound.
     *
     * @param {string} soundId - The identifier of the sound to stop.
     * @returns {void}
     */
    public stop(soundId: string): void {
        this.howlSounds.get(soundId)?.stop() ?? logger.warn(`SoundService.stop: No sound found for id: ${soundId}`);
    }

    /**
     * Mutes or unmutes a specific sound.
     *
     * @param {string} soundId - The identifier of the sound to mute/unmute.
     * @param {boolean} muted - Whether to mute (true) or unmute (false) the sound.
     * @returns {void}
     */
    public muteSound(soundId: string, muted: boolean): void {
        const soundToMute = this.howlSounds.get(soundId);

        if (soundToMute) {
            soundToMute.mute(muted);
            logger.info(`Sound '${soundId}' has been ${muted ? 'muted' : 'unmuted'}.`);
        } else {
            logger.warn(`SoundService.muteSound: No sound found for id: ${soundId}`);
        }
    }

    /**
     * Globally mutes or unmutes all sounds managed by the service.
     *
     * @param {boolean} muted - Whether to mute or unmute the sounds.
     * @returns {void}
     */
    public mute(muted: boolean): void {
        Howler.mute(muted);
    }

    /**
     * Sets the audio output device for all sounds.
     *
     * @returns {void}
     */
    public setAudioOutputDevice(): void {
        Howler.unload();
        this.howlSounds.clear();

        logger.info('Re-registering all sounds on the new audio output device...');
        this.registrations.forEach((registration, soundId) => {
            this._createHowl(soundId, registration.filePath, registration.options);
        });
    }

    /**
     * Internal helper to create a Howl instance.
     *
     * @param {string} soundId - The unique identifier for the sound.
     * @param {string} filePath - The path to the audio file.
     * @param {SoundOptions} options - Howler.js options.
     * @private
     * @returns {void}
     */
    private _createHowl(soundId: string, filePath: string, options: SoundOptions): void {
        const newHowl = this.createHowl(soundId, filePath, options);

        this.howlSounds.set(soundId, newHowl);
    }

    /**
     * Creates a Howl instance with proper logging.
     *
     * @param {string} soundId - The unique identifier for the sound.
     * @param {string} filePath - The path to the audio file.
     * @param {SoundOptions} options - Howler.js options.
     * @private
     * @returns {Howl} The created Howl instance.
     */
    private createHowl(soundId: string, filePath: string, options: SoundOptions): Howl {
        const correctedSrc = `sounds/${filePath}`;

        return new Howl({
            src: correctedSrc,
            loop: options.loop || false,
            onloaderror: (howlId: number, error: any) => {
                logger.error(`Error loading sound '${soundId}' from '${filePath}':`, error);
            },
            onplayerror: (howlId: number, error: any) => {
                logger.error(`Error playing sound '${soundId}' from '${filePath}':`, error);
            },
        });
    }

    /**
     * Determines if a sound should be played based on state.
     *
     * @param {string} soundId - The identifier of the sound.
     * @param {IReduxState} state - The Redux state.
     * @private
     * @returns {boolean} True if the sound should be played, false otherwise.
     */
    private shouldPlaySound(soundId: string, state: IReduxState): boolean {
        const disabledSounds = getDisabledSounds(state);
        const { leaving } = getConferenceState(state);

        return (
            !leaving
            && !disabledSounds.includes(soundId as Sounds)
            && !disabledSounds.find(id => soundId.startsWith(id))
        );
    }

    /**
     * Gets the appropriate sound instance based on language settings.
     *
     * @param {string} soundId - The identifier of the sound.
     * @param {boolean} languages - Whether to use language-specific sound.
     * @private
     * @returns {Howl | undefined} The Howl instance or undefined if not found.
     */
    private getSoundInstance(soundId: string, languages: boolean): Howl | undefined {
        if (languages) {
            const language = i18next.language;
            const { localizedSoundId } = this.getLocalizedSound(language, soundId);

            return this.howlSounds.get(localizedSoundId ?? '');
        }

        return this.howlSounds.get(soundId);
    }

    /**
     * Registers localized versions of a sound for all supported languages.
     *
     * @param {string} soundId - The base identifier for the sound.
     * @param {string} filePath - The base path to the sound file.
     * @param {SoundOptions} options - Howler.js options.
     * @param {boolean} optional - Whether this sound is optional.
     * @param {boolean} languages - Whether this sound has multiple language versions.
     * @private
     * @returns {void}
     */
    private registerLocalizedSounds(soundId: string, filePath: string, options: SoundOptions, optional: boolean, languages: boolean): void {
        Object.values(AudioSupportedLanguage).forEach(language => {
            const { localizedSoundId, localizedFilePath } = this.getLocalizedSound(language, soundId, filePath);

            if (localizedSoundId && localizedFilePath) {
                APP.store.dispatch(registerSound(localizedSoundId, localizedSoundId, options, optional, languages));
                this.registrations.set(localizedSoundId, {
                    filePath: localizedFilePath,
                    options,
                });
                this._createHowl(localizedSoundId, localizedFilePath, options);
            }
        });
    }

    /**
     * Registers a single sound without localization.
     *
     * @param {string} soundId - The identifier for the sound.
     * @param {string} filePath - The path to the sound file.
     * @param {SoundOptions} options - Howler.js options.
     * @param {boolean} optional - Whether this sound is optional.
     * @private
     * @returns {void}
     */
    private registerSingleSound(soundId: string, filePath: string, options: SoundOptions, optional: boolean): void {
        APP.store.dispatch(registerSound(soundId, soundId, options, optional));
        this.registrations.set(soundId, { filePath, options });
        this._createHowl(soundId, filePath, options);
    }

    /**
     * Computes the localized sound for a given language.
     *
     * @param {string} language - The language code.
     * @param {string} [id] - The base sound identifier.
     * @param {string} [file] - The base sound file path.
     * @private
     * @returns {ILocalizedSoundResult} The localized sound result with id and file path.
     */
    private getLocalizedSound = (language: string, id?: string, file?: string): ILocalizedSoundResult => {
        if (!id && !file) {
            throw new Error('getLocalizedSound requires at least an id or a file.');
        }

        const isDefaultLang
            = !AudioSupportedLanguage[language as keyof typeof AudioSupportedLanguage]
            || language === AudioSupportedLanguage.en;

        if (isDefaultLang) {
            return {
                localizedSoundId: id,
                localizedFilePath: file,
            };
        }

        const localizedSoundId = `${id}_${language}`;

        if (!file) return { localizedSoundId };

        let localizedFilePath = file;
        const fileTokens = file.split('.');

        if (fileTokens.length > 1) {
            localizedFilePath = `${fileTokens[0]}_${language}.${fileTokens[1]}`;
        } else {
            localizedFilePath = `${file}_${language}`;
        }

        return { localizedSoundId, localizedFilePath };
    };
}

// Create and export a single, global instance of the service.
export default new SoundService();
