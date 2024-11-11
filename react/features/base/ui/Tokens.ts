// Default color palette
export const colors = {
    error03: '#7A141F',
    error04: '#A21B29',
    error05: '#CB2233',
    error06: '#D83848',
    error08: '#F24D5F',

    primary01: '#00112D',
    primary02: '#00225A',
    primary03: '#003486',
    primary04: '#00ae31',
    primary05: '#00ae31',
    primary06: '#00ae31',
    primary07: '#018a27',
    primary08: '#00ae31',
    primary09: '#018a27',

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
    support09: '#2AA076',

    // The following tokens are not in the Design System and they should be removed
    // after we replace them in the components.
    primary10: '#17A0DB',
    primary11: '#1081B2',
    primary12: '#B8C7E0',
    surface00: '#111111',
    surface12: '#AAAAAA',
    surface13: '#495258',
    surface14: '#555555',
    surface15: '#474747',
    surface16: '#131519',
    surface17: '#161618',
    warning07: '#FFD740',
    disabled01: '#00000040'
};

// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background
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
    action01: 'primary06',
    action01Hover: 'primary07',
    action01Active: 'primary04',

    // Secondary
    action02: 'surface10',
    action02Hover: 'surface11',
    action02Active: 'surface09',

    // Destructive
    actionDanger: 'error05',
    actionDangerHover: 'error06',
    actionDangerActive: 'error04',

    // Tertiary
    action03: 'transparent',
    action03Hover: 'surface04',
    action03Active: 'surface03',

    // Disabled
    disabled01: 'surface09',

    // Focus
    focus01: 'primary07',

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
    support09: 'support09',

    // The following mappings are not in the Design System and they should be removed
    // after we replace them in the components.
    ui00: 'surface00',
    ui12: 'surface11',
    ui13: 'surface14',
    ui14: 'surface15',
    ui15: 'surface12',
    ui16: 'surface16',
    action04: 'primary11',
    action03Focus: 'surface07',
    action03Disabled: 'transparent',
    actionDisabled: 'surface09',
    icon05: 'surface04',
    text05: 'surface06',
    text06: 'surface03',
    text07Info: 'surface02',
    screen01Header: 'primary10',
    screen02Header: 'surface17',
    underlay01: 'surface13',
    bottomSheet: 'surface00',
    dividerColor: 'surface12',
    indicatorColor: 'surface12',
    section01: 'surface10',
    border01: 'surface08',
    border02: 'surface06',
    border03: 'surface04',
    border04: 'primary12',
    border05: 'surface07',
    borderError: 'error06',
    warning03: 'warning07',
    tab01Disabled: 'disabled01',
    switch01Enabled: 'success04',
    switch01Disabled: 'surface06',
    video01Disabled: 'disabled01',
    field01Hover: 'surface03',
    field01Focus: 'primary05',
    field01Disabled: 'surface05',
    field02: 'surface11',
    field02Hover: 'primary09',
    field02Focus: 'primary05',
    field02Disabled: 'surface06'
};


export const font = {
    weightRegular: '400',
    weightSemiBold: '600'
};

export const shape = {
    borderRadius: 50,
    boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)'
};

export const spacing
    = [ 0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128 ];

export const typography = {
    labelRegular: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: font.weightRegular,
        letterSpacing: 0.16
    },

    labelBold: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0.16
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

    heading1: {
        fontSize: 54,
        lineHeight: 64,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading2: {
        fontSize: 42,
        lineHeight: 50,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

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
    },


    // These styles are no longer part of the Design System.
    // They should be replaced and removed.
    heading7: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    labelButton: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    labelButtonLarge: {
        fontSize: 16,
        lineHeight: 24,
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
