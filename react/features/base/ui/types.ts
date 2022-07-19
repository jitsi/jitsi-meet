interface TypographyType {
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
    letterSpacing: number;
}

export interface Theme {
    palette: {
        uiBackground: string;
        ui01: string;
        ui02: string;
        ui03: string;
        ui04: string;
        ui05: string;
        action01: string;
        action01Hover: string;
        action01Active: string;
        action02: string;
        action02Hover: string;
        action02Active: string;
        actionDanger: string;
        actionDangerHover: string;
        actionDangerActive: string;
        action03: string;
        action03Hover: string;
        action03Active: string;
        disabled01: string;
        focus01: string;
        link01: string;
        link01Hover: string;
        link01Active: string;
        text01: string;
        text02: string;
        text03: string;
        text04: string;
        textError: string;
        icon01: string;
        icon02: string;
        icon03: string;
        icon04: string;
        iconError: string;
        field01: string;
        success01: string;
        success02: string;
        warning01: string;
        warning02: string;
        support01: string;
        support02: string;
        support03: string;
        support04: string;
        support05: string;
        support06: string;
        support07: string;
        support08: string;
        support09: string;
    };
    shape: {
        borderRadius: number;
    };
    spacing: (index: number) => number;
    typography: {
        labelRegular: TypographyType;
        labelBold: TypographyType;
        bodyShortRegular: TypographyType;
        bodyShortBold: TypographyType;
        bodyShortRegularLarge: TypographyType;
        bodyShortBoldLarge: TypographyType;
        bodyLongRegular: TypographyType;
        bodyLongRegularLarge: TypographyType;
        bodyLongBold: TypographyType;
        bodyLongBoldLarge: TypographyType;
        heading1: TypographyType;
        heading2: TypographyType;
        heading3: TypographyType;
        heading4: TypographyType;
        heading5: TypographyType;
        heading6: TypographyType;
    };
    breakpoints: {
        down: (value: number) => string;
        up: (value: number) => string;
    }
}
