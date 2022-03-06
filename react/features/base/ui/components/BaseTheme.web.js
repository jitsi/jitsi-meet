// @flow

import { font, colors, colorMap, spacing, shape, typography, breakpoints } from '../Tokens';
import { createWebTheme } from '../functions';

const mixins = {
    navigateSectionlistText: {
        width: '100%',
        fontSize: '14px',
        lineHeight: '20px',
        color: 'var(--welcome-page-title-color)',
        textAlign: 'left',
        fontFamily: 'open_sanslight, Helvetica, sans-serif'
    }
};

const zIndex = {
    sideToolbarContainer: 300
};

export default createWebTheme({
    font,
    colors,
    colorMap,
    mixins,
    spacing,
    shape,
    typography,
    breakpoints,
    zIndex
});

export const rltTheme = createWebTheme({
    font,
    colors,
    colorMap,
    direction: 'rtl',
    mixins,
    spacing,
    shape,
    typography,
    breakpoints,
    zIndex
});

export const ltrTheme = createWebTheme({
    font,
    colors,
    colorMap,
    direction: 'ltr',
    mixins,
    spacing,
    shape,
    typography,
    breakpoints,
    zIndex
});
