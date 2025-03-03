import * as neoTokens from './neoDark.json';

// Default color palette
export const colors = {
    error01: neoTokens.error01,
    error03: '#7A141F',
    error04: '#A21B29',
    error05: '#CB2233',
    error06: '#D83848',
    error08: '#F24D5F',

    primary01: '#00112D',
    primary02: '#00225A',
    primary03: '#003486',
    primary04: '#0045B3',
    primary05: '#0056E0',
    primary06: '#246FE5',
    primary07: '#4687ED',
    primary08: '#99BBF3',
    primary09: '#CCDDF9',

    surface01: '#040404',
    surface02: '#141414',
    surface03: '#292929',
    surface04: '#3D3D3D',
    surface05: '#525252',
    surface06: '#666',
    surface07: '#858585',
    surface08: '#A3A3A3',
    surface09: '#C2C2C2',
    surface10: '#E0E0E0',
    surface11: '#FFF',

    success04: '#189B55',
    success05: '#1EC26A',

    warning05: '#F8AE1A',
    warning06: '#FFD600',

    support01: '#FF9B42',
    support02: '#F96E57',
    support03: '#DF486F',
    support04: '#B23683',
    support05: '#73348C',
    support06: '#6A50D3',
    support07: '#4380E2',
    support08: '#00A8B3',
    support09: '#2AA076'
};

// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background. If this changes, make sure to adapt the native side as well:
    //  - JitsiMeetView.m
    //  - JitsiMeetView.java
    uiBackground: 'surface01',

    // Container backgrounds
    ui01: neoTokens.ui01,
    ui02: neoTokens.ui02,
    ui03: neoTokens.ui03,
    ui04: neoTokens.ui04,
    ui05: neoTokens.ui05,
    ui06: neoTokens.ui06,
    ui07: neoTokens.ui07,
    ui08: neoTokens.ui08,
    ui09: neoTokens.ui09,
    ui10: neoTokens.ui10,

    // ----- Actions -----

    // Primary
    action01: neoTokens.action01,
    action01Hover: neoTokens.hover01,
    action01Active: neoTokens.active01,

    // Secondary
    action02: neoTokens.action02,
    action02Hover: neoTokens.hover02,
    action02Active: neoTokens.active02,

    // Destructive
    actionDanger: 'error01',
    actionDangerHover: 'error06',
    actionDangerActive: 'error04',

    // Tertiary
    action03: 'transparent',
    action03Hover: neoTokens.hover03,
    action03Active: neoTokens.active03,

    // Disabled
    disabled01: neoTokens.disabled01,

    // Focus
    focus01: neoTokens.focus01,

    // ----- Links -----

    link01: 'primary07',
    link01Hover: 'primary08',
    link01Active: 'primary06',

    // ----- Text -----

    // Primary
    text01: neoTokens.textColor01,

    // Secondary
    text02: neoTokens.textColor02,

    // Tertiary
    text03: 'surface07',

    // High-contrast
    text04: neoTokens.textColor04,

    // Error
    textError: 'error08',

    // ----- Icons -----

    // Primary
    icon01: neoTokens.icon01,

    // Secondary
    icon02: neoTokens.icon02,

    // Tertiary
    icon03: neoTokens.icon03,

    // High-contrast
    icon04: neoTokens.icon04,

    // Error
    iconError: 'error06',

    // ----- Forms -----

    field01: 'surface04',

    // ----- Feedback -----

    // Success
    success01: neoTokens.success01,
    success02: 'success04',

    // Warning
    warning01: neoTokens.warning01,
    warning02: neoTokens.warning02,

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
    labelRegular: neoTokens.label01,

    labelBold: neoTokens.labelBold01,

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

    heading1: neoTokens.heading01,

    heading2: neoTokens.heading02,

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
