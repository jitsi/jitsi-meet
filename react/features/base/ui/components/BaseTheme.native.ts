import { colorMap, font, shape, spacing, typography } from '../Tokens';
import { createNativeTheme } from '../functions.native';

import updateTheme from './updateTheme.native';

export default createNativeTheme(updateTheme({
    font,
    colorMap,
    spacing,
    shape,
    typography
}));
