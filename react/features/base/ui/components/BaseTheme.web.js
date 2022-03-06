// @flow

import { font, colors, colorMap, spacing, shape, typography, breakpoints } from '../Tokens';
import { createWebTheme } from '../functions';

export const mixins = {
    navigateSectionlistText: {
        width: '100%',
        fontSize: '14px',
        lineHeight: '20px',
        color: 'var(--welcome-page-title-color)',
        textAlign: 'left',
        fontFamily: 'open_sanslight, Helvetica, sans-serif'
    }
};

export default createWebTheme({
    font,
    colors,
    colorMap,
    mixins,
    spacing,
    shape,
    typography,
    breakpoints
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
    breakpoints
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
    breakpoints
});
