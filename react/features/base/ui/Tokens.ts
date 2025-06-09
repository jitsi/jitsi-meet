// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background. If this changes, make sure to adapt the native side as well:
    //  - JitsiMeetView.m
    //  - JitsiMeetView.java
    uiBackground: 'surface01',

    // Container backgrounds
    ui01: 'surface02',
    ui02: 'surface03',
    ui03: 'ui02',
    ui04: 'surface05',
    ui05: 'ui01',
    ui06: 'ui03',
    ui07: 'surface08',
    ui08: 'ui21',
    ui09: 'ui08',
    ui10: 'ui04',

    // ----- Actions -----

    // Primary
    action01: 'action01',
    action01Hover: 'hover01',
    action01Active: 'active01',

    // Secondary
    action02: 'action02',
    action02Hover: 'hover02',
    action02Active: 'active02',

    // Destructive
    actionDanger: 'action03',
    actionDangerHover: 'hover03',
    actionDangerActive: 'active03',

    // Tertiary
    action03: 'transparent',
    action03Hover: 'hover05',
    action03Active: 'surface03',

    // Disabled
    disabled01: 'disabled01',

    // Focus
    focus01: 'focus01',

    // ----- Links -----

    link01: 'action01',
    link01Hover: 'hover07',
    link01Active: 'action04',

    // ----- Text -----

    // Primary
    text01: 'textColor01',

    // Secondary
    text02: 'textColor02',

    // Tertiary
    text03: 'ui03',

    // High-contrast
    text04: 'surface01',

    // Error
    textError: 'alertRed',

    // ----- Icons -----

    // Primary
    icon01: 'icon01',

    // Secondary
    icon02: 'ui21',

    // Tertiary
    icon03: 'icon07',

    // High-contrast
    icon04: 'surface01',

    // Error
    iconError: 'action03',

    // Normal
    iconNormal: 'action04',

    // Success
    iconSuccess: 'alertGreen',

    // Warning
    iconWarning: 'warning01',

    // ----- Forms -----

    field01: 'ui02',

    // ----- Feedback -----

    // Success
    success01: 'success05',
    success02: 'success01',

    // Warning
    warning01: 'warning01',
    warning02: 'warning06',

    // ----- Support -----

    support05: 'support05',
    support06: 'support06'
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

export const spacing = [ 0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128 ];

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
