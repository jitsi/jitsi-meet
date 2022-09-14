import { createTheme, adaptV4Theme } from '@mui/material/styles';

import { Palette as Palette1, Typography } from '../ui/types';

import { createColorTokens } from './utils';

declare module '@mui/material/styles' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Palette extends Palette1 {}

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface TypographyVariants extends Typography {}
}

interface ThemeProps {
    breakpoints: Object;
    colorMap: Object;
    colors: Object;
    font: Object;
    shape: Object;
    spacing: Array<number>;
    typography: Object;
}

/**
 * Creates a MUI theme based on local UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createWebTheme({ font, colors, colorMap, shape, spacing, typography, breakpoints }: ThemeProps) {
    return createTheme(adaptV4Theme({
        spacing,
        palette: createColorTokens(colorMap, colors),
        shape,

        // @ts-ignore
        typography: {
            // @ts-ignore
            font,
            ...typography
        },
        breakpoints
    }));
}

