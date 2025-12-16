import { breakpoints, colorMap, font, semanticTokens, shape, spacing, typography } from '../Tokens';
import { createWebTheme } from '../functions.web';

export default createWebTheme({
    font,
    colorMap,
    semanticTokens,
    spacing,
    shape,
    typography,
    breakpoints
});
