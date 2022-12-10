import { colorMap, colors, font, shape, spacing, typography } from '../Tokens';
import { createNativeTheme } from '../functions.native';

import updateTheme from './updateTheme.native';

export default createNativeTheme(updateTheme({
    font,
    colors,
    colorMap,
    spacing,
    shape,
    typography
}));
