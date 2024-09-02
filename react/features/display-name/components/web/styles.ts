import { Theme } from '@mui/material';

/**
 * The vertical padding for the display name.
 */
export const DISPLAY_NAME_VERTICAL_PADDING = 4;

/**
 * Returns the typography for stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @returns {ITypographyType}
 */
export function getStageParticipantTypography(theme: Theme) {
    return theme.typography.bodyShortRegularLarge;
}

/**
 * Returns the height + padding for stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @returns {number}
 */
export function getStageParticipantNameLabelHeight(theme: Theme) {
    return getStageParticipantTypography(theme).lineHeight ?? 0 + DISPLAY_NAME_VERTICAL_PADDING;
}
