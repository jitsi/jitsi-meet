
// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background. If this changes, make sure to adapt the native side as well:
    //  - JitsiMeetView.m
    //  - JitsiMeetView.java
    uiBackground: 'surface01',

    // Container backgrounds
    ui01: 'ui01',
    ui02: 'ui02',
    ui03: 'ui03',
    ui04: 'ui04',
    ui05: 'ui05',
    ui06: 'ui06',
    ui07: 'ui07',
    ui08: 'ui08',
    ui09: 'ui09',
    ui10: 'ui10',

    // ----- Actions -----

    // Primary
    action01: 'action01',
    action01Hover: 'action01Hover',
    action01Active: 'action01Active',

    // Secondary
    action02: 'action02',
    action02Hover: 'action02Hover',
    action02Active: 'action02Active',

    // Destructive
    actionDanger: 'error01',
    actionDangerHover: 'error06',
    actionDangerActive: 'error04',

    // Tertiary
    action03: 'transparent',
    action03Hover: 'transparent',
    action03Active: 'transparent',

    // Disabled
    disabled01: 'transparent',

    // Focus
    focus01: 'transparent',

    // ----- Links -----

    link01: 'primary07',
    link01Hover: 'primary08',
    link01Active: 'primary06',

    // ----- Text -----

    // Primary
    text01: 'textColor01',

    // Secondary
    text02: 'textColor02',

    // Tertiary
    text03: 'surface07',

    // High-contrast
    text04: 'textColor04',

    // Error
    textError: 'error08',

    // ----- Icons -----

    // Primary
    icon01: 'icon01',

    // Secondary
    icon02: 'icon02',

    // Tertiary
    icon03: 'icon03',

    // High-contrast
    icon04: 'icon04',

    // Error
    iconError: 'error06',

    // ----- Forms -----

    field01: 'surface04',

    // ----- Feedback -----

    // Success
    success01: 'success01',
    success02: 'success04',

    // Warning
    warning01: 'warning01',
    warning02: 'warning02',

    // ----- Support -----

    support01: 'support01',
    support02: 'support02',
    support03: 'support03',
    support04: 'support04',
    support05: 'support05',
    support06: 'support06',
    support07: 'support07',
    support08: 'support08',
    support09: 'support09'
};


export const font = {
    weightRegular: '400',
    weightSemiBold: '600'
};

export const shape = {
    borderRadius: 6,
    circleRadius: 50,
    boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)'
};

export const spacing
    = [ 0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128 ];

export const typography = {
    labelRegular: 'label01',

    labelBold: 'labelBold01',

    bodyShortRegularSmall: {
        fontSize: 10,
        lineHeight: 16,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortRegular: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBold: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyShortRegularLarge: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBoldLarge: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongRegular: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongRegularLarge: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongBold: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongBoldLarge: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading1: 'heading01',

    heading2: 'heading02',

    heading3: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading4: {
        fontSize: 28,
        lineHeight: 36,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading5: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading6: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    }
};

export const breakpoints = {
    values: {
        '0': 0,
        '320': 320,
        '400': 400,
        '480': 480
    }
};
