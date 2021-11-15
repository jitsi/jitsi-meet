// @flow
import { createMuiTheme } from '@material-ui/core/styles';

import { loadConfig } from '../base/lib-jitsi-meet';
import { font, colors, colorMap, spacing, shape, typography, breakpoints } from '../base/ui/Tokens';
import { createColorTokens } from '../base/ui/utils';

/**
 * Extracts the fqn part from a path, where fqn represents
 * tenant/roomName.
 *
 * @param {string} path - The URL path.
 * @returns {string}
 */
export function extractFqnFromPath() {
    const parts = window.location.pathname.split('/');
    const len = parts.length;

    return parts.length > 2 ? `${parts[len - 2]}/${parts[len - 1]}` : '';
}

/**
 * Returns the url used for fetching dynamic branding.
 *
 * @returns {string}
 */
export async function getDynamicBrandingUrl() {
    const config = await loadConfig(window.location.href);
    const { dynamicBrandingUrl } = config;

    if (dynamicBrandingUrl) {
        return dynamicBrandingUrl;
    }

    const { brandingDataUrl: baseUrl } = config;
    const fqn = extractFqnFromPath();

    if (baseUrl && fqn) {
        return `${baseUrl}?conferenceFqn=${encodeURIComponent(fqn)}`;
    }
}

/**
 * Selector used for getting the load state of the dynamic branding data.
 *
 * @param {Object} state - Global state of the app.
 * @returns {boolean}
 */
export function isDynamicBrandingDataLoaded(state: Object) {
    return state['features/dynamic-branding'].customizationReady;
}

/**
 * Creates MUI branding theme based on the custom theme json.
 *
 * @param {Object} customTheme - The branded custom theme.
 * @returns {Object} - The MUI theme.
 */
export function createMuiBrandingTheme(customTheme: Object) {
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

    return createMuiTheme({
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
            if (typeof obj1[key] === 'object') {
                overwriteRecurrsive(obj1[key], obj2[key]);
            } else {
                obj1[key] = obj2[key];
            }
        }
    });
}
