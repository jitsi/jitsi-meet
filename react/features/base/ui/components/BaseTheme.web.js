// @flow

import { font, colors, colorMap, spacing, shape, typography } from '../Tokens';
import { createWebTheme } from '../functions';

export default createWebTheme({
    font,
    colors,
    colorMap,
    spacing,
    shape,
    typography,
    breakpoints: {
        values: {
            '0': 0,
            '480': 480
        }
    }
});
