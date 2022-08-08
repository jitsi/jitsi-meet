/**
 * The identifier of the sound to be played when e2ee is disabled.
 *
 * @type {string}
 */
export const E2EE_OFF_SOUND_ID = 'E2EE_OFF_SOUND';

/**
 * The identifier of the sound to be played when e2ee is enabled.
 *
 * @type {string}
 */
export const E2EE_ON_SOUND_ID = 'E2EE_ON_SOUND';

/**
 * The number of participants after which e2ee maxMode is set to MAX_MODE.ENABLED.
 *
 * @type {integer}
 */
export const MAX_MODE_LIMIT = 20;

/**
 * If the number of participants is greater then MAX_MODE_LIMIT + MAX_MODE_THRESHOLD
 * e2ee maxMode is set to MAX_MODE.THRESHOLD_EXCEEDED.
 *
 * @type {integer}
 */
export const MAX_MODE_THRESHOLD = 5;

export const MAX_MODE = {
    /**
     * Mode for which the e2ee can be enabled or disabled.
     * If e2ee is enabled, e2ee section is enabled with a warning text.
     * If e2ee is disabled, e2ee section is disabled with a warning text.
     *
     * @type {string}
     */
    ENABLED: 'max-mode-enabled',

    /**
     * Mode for which the e2ee and the e2ee section are automatically disabled.
     *
     * @type {string}
     */
    THRESHOLD_EXCEEDED: 'max-mode-threshold-exceeded',

    /**
     * The default e2ee maxMode, e2ee can be enabled/disabled, e2ee section is enabled.
     *
     * @type {string}
     */
    DISABLED: 'max-mode-disabled'
};
