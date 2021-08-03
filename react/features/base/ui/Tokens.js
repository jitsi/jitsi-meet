// @flow

// Default color palette
export const colors = {
    error03: '#7A141F',
    error04: '#A21B29',
    error05: '#CB2233',
    error06: '#E04757',
    error08: '#EAA7AD',

    primary01: '#00112D',
    primary02: '#00225A',
    primary03: '#003486',
    primary04: '#0045B3',
    primary05: '#0056E0',
    primary06: '#246FE5',
    primary07: '#669AEC',
    primary08: '#99BBF3',
    primary09: '#CCDDF9',

    surface00: '#111111',
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
    surface12: '#AAAAAA',

    success04: '#189B55',
    success05: '#1EC26A',

    warning05: '#F8AE1A',
    warning06: '#ED9E1B'
};

// Mapping between the token used and the color
export const colorMap = {
    // Default page background
    uiBackground: 'surface01',

    // Container background
    ui01: 'surface02',
    ui02: 'surface03',
    ui03: 'surface04',
    ui04: 'surface05',
    ui05: 'surface06',

    // Primary buttons
    action01: 'primary05',

    // Hover state for primary buttons
    action01Hover: 'primary06',

    // Active state for primary buttons
    action01Active: 'primary04',

    // Focus border color
    action01Focus: 'primary08',

    // Disabled state for primary buttons
    action01Disabled: 'primary02',

    // Secondary buttons
    action02: 'surface04',

    // Hover state for secondary buttons
    action02Hover: 'surface05',

    // Active state for secondary buttons
    action02Active: 'surface03',

    // Focus border color
    action02Focus: 'surface07',

    // Disabled state for secondary buttons
    action02Disabled: 'surface02',

    // Tertiary buttons
    action03: 'transparent',

    // Hover state for tertiary buttons
    action03Hover: 'surface05',

    // Active state for tertiary buttons
    action03Active: 'surface03',

    // Focus border color
    action03Focus: 'surface07',

    // Disabled state for tertiary buttons
    action03Disabled: 'transparent',

    // Danger button background
    actionDanger: 'error05',

    // Hover state for danger buttons
    actionDangerHover: 'error06',

    // Active state for danger buttons
    actionDangerActive: 'error04',

    // Focus border color
    actionDangerFocus: 'error08',

    // Disabled state for danger buttons
    actionDangerDisabled: 'error03',

    // Bottom sheet background
    bottomSheet: 'surface00',

    // Primary text – default color for body copy & headers
    text01: 'surface11',

    // Secondary text with medium contrast
    text02: 'surface09',

    // Tertiary text with low contrast – placeholders, disabled actions, label for disabled buttons
    text03: 'surface07',

    // Text for bottom sheet items
    text04: 'surface12',

    // error messages
    textError: 'error06',

    // Primary color for icons
    icon01: 'surface11',

    // Secondary color for input fields
    icon02: 'surface09',

    // Tertiary color for disabled actions
    icon03: 'surface07',

    // Error message
    iconError: 'error06',

    // Forms
    // Default background for input fields
    field01: 'surface01',

    // Hover background for input fields
    field01Hover: 'surface03',

    // Focus border color
    field01Focus: 'primary05',

    // Disabled background for input fields
    field01Disabled: 'surface05',

    // Background for high-contrast input fields
    field02: 'surface11',

    // Color for the section divider
    dividerColor: 'surface12',

    // Background for high-contrast input fields on hover
    field02Hover: 'primary09',

    // Focus border color
    field02Focus: 'primary05',

    // Disabled background for high-contrast input fields
    field02Disabled: 'surface06',

    // Background for section header
    section01: 'surface10',

    // Active color for section header
    section01Active: 'primary04',

    // Inactive color for section header
    section01Inactive: 'surface01',

    // Borders
    // Border for the input fields in hover state
    border01: 'surface08',

    // Border for the input fields
    border02: 'surface06',

    // Line separators
    border03: 'surface04',

    // Color for error border & message
    borderError: 'error06',

    // Links
    // Default color for links
    link01: 'primary07',

    // Color for links in the hover state
    link01Hover: 'primary08',

    // Color for links in the active state
    link01Active: 'primary06',

    // Support
    // Color for positive messages applied to icons & borders
    success01: 'success05',

    // Color for positive messages applied to backgrounds
    success02: 'success05',

    // Color for warning messages applied to icons, borders & backgrounds
    warning01: 'warning05',

    // Color for indicating a raised hand
    warning02: 'warning06'
};


export const font = {
    weightRegular: '400',
    weightSemiBold: '600'
};

export const shape = {
    borderRadius: 6,
    boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)'
};

export const spacing = [ 0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80 ];

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
    },

    bodyShortRegular: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBold: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyShortRegularLarge: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBoldLarge: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongRegular: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongBold: {
        fontSize: 14,
        lineHeight: 24,
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

    heading7: {
        fontSize: 14,
        lineHeight: 24,
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    }
};
