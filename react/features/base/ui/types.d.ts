import '@mui/material/styles';

import { IPalette, ITypography } from './types';

declare module '@mui/material/styles' {
    interface Palette extends IPalette {}
    interface PaletteOptions extends Partial<IPalette> {}

    interface Typography extends ITypography {}
    interface TypographyOptions extends Partial<ITypography> {}
}
