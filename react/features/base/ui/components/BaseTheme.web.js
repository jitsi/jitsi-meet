// @flow

import { font, colors, colorMap, spacing, shape, typography, breakpoints } from '../Tokens';
import { createWebTheme } from '../functions';

export default createWebTheme({
    font,
    colors,
    colorMap,
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
    spacing,
    shape,
    typography,
    breakpoints
});
