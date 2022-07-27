interface TypographyType {
    fontSize: number;
    fontWeight: string;
    letterSpacing: number;
    lineHeight: number;
}

export interface Theme {
    breakpoints: {
        down: (value: number|string) => string;
        up: (value: number|string) => string;
    },
    palette: {
        action01: string;
        action01Active: string;
        action01Hover: string;
        action02: string;
        action02Active: string;
        action02Hover: string;
        action03: string;
        action03Active: string;
        action03Hover: string;
        actionDanger: string;
        actionDangerActive: string;
        actionDangerHover: string;
        disabled01: string;
        field01: string;
        focus01: string;
        icon01: string;
        icon02: string;
        icon03: string;
        icon04: string;
        iconError: string;
        link01: string;
        link01Active: string;
        link01Hover: string;
        success01: string;
        success02: string;
        support01: string;
        support02: string;
        support03: string;
        support04: string;
        support05: string;
        support06: string;
        support07: string;
        support08: string;
        support09: string;
        text01: string;
        text02: string;
        text03: string;
        text04: string;
        textError: string;
        ui01: string;
        ui02: string;
        ui03: string;
        ui04: string;
        ui05: string;
        ui06: string;
        ui07: string;
        ui08: string;
        ui09: string;
        ui10: string;
        uiBackground: string;
        warning01: string;
        warning02: string;
    };
    shape: {
        borderRadius: number;
    };
    spacing: (index: number) => number;
    typography: {
        bodyLongBold: TypographyType;
        bodyLongBoldLarge: TypographyType;
        bodyLongRegular: TypographyType;
        bodyLongRegularLarge: TypographyType;
        bodyShortBold: TypographyType;
        bodyShortBoldLarge: TypographyType;
        bodyShortRegular: TypographyType;
        bodyShortRegularLarge: TypographyType;
        heading1: TypographyType;
        heading2: TypographyType;
        heading3: TypographyType;
        heading4: TypographyType;
        heading5: TypographyType;
        heading6: TypographyType;
        labelBold: TypographyType;
        labelRegular: TypographyType;
    };
}
