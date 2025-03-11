
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
    ui03: 'surface04',
    ui04: 'surface05',
    ui05: 'surface06',
    ui06: 'surface07',
    ui07: 'surface08',
    ui08: 'surface09',
    ui09: 'surface10',
    ui10: 'surface11',

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
    action03Hover: 'surface04',
    action03Active: 'surface03',

    // Disabled
    disabled01: 'disabled01',

    // Focus
    focus01: 'focus01',

    // ----- Links -----

    link01: 'primary07',
    link01Hover: 'primary08',
    link01Active: 'primary06',

    // ----- Text -----

    // Primary
    text01: 'surface11',

    // Secondary
    text02: 'surface09',

    // Tertiary
    text03: 'surface07',

    // High-contrast
    text04: 'surface01',

    // Error
    textError: 'error08',

    // ----- Icons -----

    // Primary
    icon01: 'surface11',

    // Secondary
    icon02: 'surface09',

    // Tertiary
    icon03: 'surface07',

    // High-contrast
    icon04: 'surface01',

    // Error
    iconError: 'error06',

    // Normal
    iconNormal: 'primary06',

    // Success
    iconSuccess: 'success05',

    // Warning
    iconWarning: 'warning05',

    // ----- Forms -----

    field01: 'surface04',

    // ----- Feedback -----

    // Success
    success01: 'success05',
    success02: 'success04',

    // Warning
    warning01: 'warning05',
    warning02: 'warning06',

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
