// @flow

import { font, colors, colorMap, spacing, shape, typography } from '../Tokens';
import { createNativeTheme } from '../functions.native';

import updateTheme from './updateTheme';

export default createNativeTheme(updateTheme({
    font,
    colors,
    colorMap,
    spacing,
    shape,
    typography
}));
