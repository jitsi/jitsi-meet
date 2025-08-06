import { Theme } from '@mui/material';

/**
 * The vertical padding for the display name.
 */
export const DISPLAY_NAME_VERTICAL_PADDING = 0.25;

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
 * Returns the range of possible values for the font size for the stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @returns {ILimits}
 */
export function getStageParticipantFontSizeRange(theme: Theme) {
    return {
        max: theme.typography.bodyShortRegularLarge.fontSize,
        min: theme.typography.bodyShortRegularSmall.fontSize
    };
}

/**
 * Returns the range of possible values for the line height for the stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @returns {ILimits}
 */
export function getStageParticipantLineHeightRange(theme: Theme) {
    return {
        max: theme.typography.bodyShortRegularLarge.lineHeight,
        min: theme.typography.bodyShortRegularSmall.lineHeight
    };
}

/**
 * Returns the height + padding for stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @param {number} clientHeight - The height of the visible area.
 * @returns {string}
 */
export function getStageParticipantNameLabelHeight(theme: Theme, clientHeight?: number): string {
    const lineHeight = getStageParticipantNameLabelLineHeight(theme, clientHeight);

    return `${lineHeight + DISPLAY_NAME_VERTICAL_PADDING}rem`;
}

/**
 * Returns the height + padding for stage participant display name badge.
 *
 * @param {Theme} theme - The current theme.
 * @param {number} clientHeight - The height of the visible area.
 * @returns {number} - Value in rem units.
 */
export function getStageParticipantNameLabelLineHeight(theme: Theme, clientHeight?: number): number {
    return scaleFontProperty(clientHeight, getStageParticipantLineHeightRange(theme));
}

interface ILimits {
    max: string;
    min: string;
}

interface INumberLimits {
    max: number;
    min: number;
}

/**
 * The default clint height limits used by scaleFontProperty.
 */
const DEFAULT_CLIENT_HEIGHT_LIMITS = {
    min: 300,
    max: 960
};

/**
 * Scales a css font property depending on the passed screen size.
 * Note: The result will be in the range of the specified propValueLimits. Also if the current screen height is
 * more/less than the values in screenLimits parameter the result will be the max/min of the propValuesLimits.
 *
 * @param {number|undefined} screenHeight - The current screen height.
 * @param {ILimits} propValuesLimits - The max and min value for the font property that we are scaling.
 * @param {INumberLimits} screenHeightLimits - The max and min value for screen height.
 * @returns {number} - The scaled prop value in rem units.
 */
export function scaleFontProperty(
        screenHeight: number | undefined,
        propValuesLimits: ILimits,
        screenHeightLimits: INumberLimits = DEFAULT_CLIENT_HEIGHT_LIMITS): number {
    const { max: maxPropSize, min: minPropSize } = propValuesLimits;
    const { max: maxHeight, min: minHeight } = screenHeightLimits;
    const numericalMinRem = parseFloat(minPropSize);
    const numericalMaxRem = parseFloat(maxPropSize);

    if (typeof screenHeight !== 'number') {
        return numericalMaxRem;
    }

    // Calculate how much the 'rem' value changes per pixel of screen height.
    // (max 'rem' - min 'rem') / (max screen height in px - min screen height in px)
    const propSizeRemPerPxHeight = (numericalMaxRem - numericalMinRem) / (maxHeight - minHeight);

    // Clamp the screenHeight to be within the defined minHeight and maxHeight.
    const clampedScreenHeightPx = Math.max(Math.min(screenHeight, maxHeight), minHeight);

    // Calculate the scaled 'rem' value:
    // Start with the base min 'rem' value.
    // Add the scaled portion: (how far the current screen height is from the min height) * (rem change per pixel).
    // (clampedScreenHeightPx - minHeigh) gives the effective height within the range.
    const calculatedRemValue = (clampedScreenHeightPx - minHeight) * propSizeRemPerPxHeight + numericalMinRem;

    return parseFloat(calculatedRemValue.toFixed(3));
}
