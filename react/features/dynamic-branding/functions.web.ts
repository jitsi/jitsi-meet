import { Theme } from '@mui/material';
import { adaptV4Theme, createTheme } from '@mui/material/styles';

import { breakpoints, colorMap, colors, font, shape, spacing, typography } from '../base/ui/Tokens';
import { createColorTokens } from '../base/ui/utils';

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
