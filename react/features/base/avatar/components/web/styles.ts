import { Theme } from '@mui/material/styles';

// Default avatar background color
export const AVATAR_DEFAULT_BACKGROUND_COLOR = '#AAA';

/**
 * Returns the avatar font style from the theme.
 *
 * @param {Theme} theme - The MUI theme.
 * @returns {Object} The font style object containing fontFamily, fontWeight, etc.
 */
export const getAvatarFont = (theme: Theme) => theme.typography?.heading1 ?? {};

/**
 * Default text color for avatar initials.
 */
export const AVATAR_DEFAULT_INITIALS_COLOR = '#FFFFFF';

/**
 * Returns the text color for avatar initials from the theme.
 *
 * @param {Theme} theme - The MUI theme.
 * @returns {string} The text color.
 */
export const getAvatarInitialsColor = (theme: Theme): string =>
    theme.palette?.text01 || AVATAR_DEFAULT_INITIALS_COLOR;
