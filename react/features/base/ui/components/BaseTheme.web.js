// @flow

import { createMuiTheme } from '@material-ui/core/styles';

import { font, colors, colorMap, spacing, shape, typography, breakpoints } from '../Tokens';
import { createWebTheme, overwriteRecurrsive } from '../functions';
import { createColorTokens } from '../utils';

/**
 * Cached branded theme, in order to avoid re-computation of branded theme on re-renders.
 */
let brandedTheme;

/**
 * Applies branding to theme, if any.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {Object} - The processed theme.
 */
export function applyBrandingTheme(stateful: Function | Object) {
    const { customTheme } = stateful['features/dynamic-branding'];

    if (!customTheme) {
        return;
    }

    if (brandedTheme) {
        return brandedTheme;
    }

    const {
        palette: customPalette,
        shape: customShape,
        typography: customTypography,
        breakpoints: customBreakpoints,
        spacing: customSpacing
    } = customTheme;

    const newPalette = createColorTokens(colorMap, colors);

    if (customPalette) {
        overwriteRecurrsive(newPalette, customPalette);
    }

    const newShape = { ...shape };

    if (customShape) {
        overwriteRecurrsive(newShape, customShape);
    }

    const newTypography = {
        font: { ...font },
        ...typography
    };

    if (customTypography) {
        overwriteRecurrsive(newTypography, customTypography);
    }

    const newBreakpoints = { ...breakpoints };

    if (customBreakpoints) {
        overwriteRecurrsive(newBreakpoints, customBreakpoints);
    }

    let newSpacing = [ ...spacing ];

    if (customSpacing && customSpacing.length) {
        newSpacing = customSpacing;
    }

    brandedTheme = createMuiTheme({
        props: {
            // disable ripple effect on buttons globally
            MuiButtonBase: {
                disableRipple: true
            }
        },

        // use token spacing array
        spacing: newSpacing
    }, {
        palette: newPalette,
        shape: newShape,
        typography: newTypography,
        breakpoints: newBreakpoints
    });

    return brandedTheme;
}

export default createWebTheme({
    font,
    colors,
    colorMap,
    spacing,
    shape,
    typography,
    breakpoints
});
