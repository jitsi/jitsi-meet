/**
 * Action used to set custom user properties.
 */
export const SET_DYNAMIC_BRANDING_DATA = 'SET_DYNAMIC_BRANDING_DATA';

/**
 * Action used to signal the customization failed.
 */
export const SET_DYNAMIC_BRANDING_FAILED = 'SET_DYNAMIC_BRANDING_FAILED';

/**
 * Action used to set the branded icons once their SVG contents have been loaded.
 * They are delivered separately from {@code SET_DYNAMIC_BRANDING_DATA} so the rest of
 * the branding (theme, logo, backgrounds) is applied without waiting for the icons.
 */
export const SET_DYNAMIC_BRANDING_ICONS = 'SET_DYNAMIC_BRANDING_ICONS';

/**
 * Action used to signal the branding elements are ready to be displayed
 */
export const SET_DYNAMIC_BRANDING_READY = 'SET_DYNAMIC_BRANDING_READY';

/**
 * Action used to unset branding elements
 */
export const UNSET_DYNAMIC_BRANDING = 'UNSET_DYNAMIC_BRANDING';
