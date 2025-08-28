import { Theme } from '@mui/material';
import { adaptV4Theme, createTheme } from '@mui/material/styles';
import DOMPurify from 'dompurify';

import { breakpoints, colorMap, font, shape, spacing, typography } from '../base/ui/Tokens';
import { createColorTokens } from '../base/ui/utils';

const DEFAULT_FONT_SIZE = 16;

/**
 * Sanitizes the given SVG by removing dangerous elements.
 *
 * @param {string} svg - The SVG string to clean.
 * @returns {string} The sanitized SVG string.
 */
export function cleanSvg(svg: string): string {
    return DOMPurify.sanitize(svg);
}

/**
 * Converts unitless fontSize and lineHeight values in a typography style object to rem units.
 * Backward compatibility: This conversion supports custom themes that may still override
 * typography values with numeric (pixel-based) values instead of rem strings.
 *
 * @param {Object} style - The typography style object to convert.
 * @returns {void}
 */
function convertTypographyToRem(style: any): void {
    if (style) {
        // Support for backward compatibility with numeric font size overrides
        if (typeof style.fontSize === 'number') {
            style.fontSize = `${style.fontSize / DEFAULT_FONT_SIZE}rem`;
        }
        // Support for backward compatibility with numeric line height overrides
        if (typeof style.lineHeight === 'number') {
            style.lineHeight = `${style.lineHeight / DEFAULT_FONT_SIZE}rem`;
        }
    }
}

/**
 * Creates MUI branding theme based on the custom theme json.
 *
 * @param {Object} customTheme - The branded custom theme.
 * @returns {Object} - The MUI theme.
 */
export function createMuiBrandingTheme(customTheme: Theme) {
    const {
        palette: customPalette,
        shape: customShape,
        typography: customTypography,
        breakpoints: customBreakpoints,
        spacing: customSpacing
    } = customTheme;

    const newPalette = createColorTokens(colorMap);

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

        // Convert typography values to rem units in case some of the overrides are using the legacy unitless format.
        // Note: We do the conversion onlt when we do have custom typography overrides. All other values are already in rem.
        for (const variant of Object.keys(newTypography)) {
            convertTypographyToRem((newTypography as Record<string, any>)[variant]);
        }
    }

    const newBreakpoints = { ...breakpoints };

    if (customBreakpoints) {
        overwriteRecurrsive(newBreakpoints, customBreakpoints);
    }

    let newSpacing: any = [ ...spacing ];

    if (customSpacing?.length) {
        newSpacing = customSpacing;
    }

    return createTheme(adaptV4Theme({
        spacing: newSpacing,
        palette: newPalette,
        shape: newShape,

        // @ts-ignore
        typography: newTypography,

        // @ts-ignore
        breakpoints: newBreakpoints
    }));
}

/**
* Overwrites recursively values from object 2 into object 1 based on common keys.
* (Merges object2 into object1).
*
* @param {Object} obj1 - The object holding the merged values.
* @param {Object} obj2 - The object to compare to and take values from.
* @returns {void}
*/
function overwriteRecurrsive(obj1: Object, obj2: Object) {
    Object.keys(obj2).forEach(key => {
        if (obj1.hasOwnProperty(key)) {
            if (typeof obj1[key as keyof typeof obj1] === 'object') {
                overwriteRecurrsive(obj1[key as keyof typeof obj1], obj2[key as keyof typeof obj2]);
            } else {
                // @ts-ignore
                obj1[key] = obj2[key];
            }
        }
    });
}
