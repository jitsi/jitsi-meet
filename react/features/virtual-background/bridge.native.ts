import { NativeModules } from 'react-native';

/** Describes a virtual background that can be selected. */
export interface IBackgroundPreset {
    /** Stable identifier used to select the preset. */
    id: string;
    /** User-facing name of the preset. */
    title: string;
    /** URI of the preset image. */
    uri: string;
}

/** State reported by the native background-effects module. */
export interface IBackgroundState {
    /** Identifier of the selected background choice. */
    choice: string;
    /** Presets currently available for selection. */
    presets: IBackgroundPreset[];
    /** Identifier of the active native background session. */
    sessionId: number;
    /** Current status of native background processing. */
    status: 'inactive' | 'processing' | 'unavailable';
}

/** Methods exposed by the native background-effects module. */
export interface IBackgroundEffectsModule {
    /**
     * Starts a background session for an owner revision.
     *
     * @param {string} ownerId - Identifier of the background-session owner.
     * @param {number} revision - Revision of the owner's background configuration.
     * @returns {Promise<IBackgroundState>} The state of the started session.
     */
    beginSession: (ownerId: string, revision: number) => Promise<IBackgroundState>;
    /**
     * Ends a background session.
     *
     * @param {string} ownerId - Identifier of the background-session owner.
     * @param {number} revision - Revision of the owner's background configuration.
     * @param {number} sessionId - Identifier of the session to end.
     * @returns {Promise<void>} Resolves when the session has ended.
     */
    endSession: (ownerId: string, revision: number, sessionId: number) => Promise<void>;
    /**
     * Freezes background processing for an owner revision.
     *
     * @param {string} ownerId - Identifier of the background-session owner.
     * @param {number} revision - Revision of the owner's background configuration.
     * @returns {Promise<void>} Resolves when processing has been frozen.
     */
    freeze: (ownerId: string, revision: number) => Promise<void>;
    /**
     * Reads the background state for an owner revision.
     *
     * @param {string} ownerId - Identifier of the background-session owner.
     * @param {number} revision - Revision of the owner's background configuration.
     * @returns {Promise<IBackgroundState>} The current background state.
     */
    getState: (ownerId: string, revision: number) => Promise<IBackgroundState>;
    /**
     * Selects a background choice for a session.
     *
     * @param {string} ownerId - Identifier of the background-session owner.
     * @param {number} revision - Revision of the owner's background configuration.
     * @param {Object} selection - Choice and session to update.
     * @returns {Promise<IBackgroundState>} The updated background state.
     */
    select: (
        ownerId: string, revision: number, selection: { choice: string; sessionId: number; }
    ) => Promise<IBackgroundState>;
}

/**
 * Gets the native background-effects bridge when its required methods are available.
 *
 * @returns {IBackgroundEffectsModule | undefined} The bridge, or undefined when the required methods are unavailable.
 */
export function getBackgroundEffects(): IBackgroundEffectsModule | undefined {
    const module = NativeModules.JitsiBackgroundEffects;

    return typeof module?.getState === 'function' && typeof module?.select === 'function'
        ? module as IBackgroundEffectsModule : undefined;
}

/**
 * Checks whether the required native background-effects methods are available.
 *
 * @returns {boolean} Whether the required state and selection methods are available.
 */
export function isBackgroundEffectsAvailable(): boolean {
    return Boolean(getBackgroundEffects());
}
