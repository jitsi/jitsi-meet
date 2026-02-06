/* eslint-disable @stylistic/no-multi-spaces */
// Mapping between the token used and the color
export const colorMap = {
    // ----- Surfaces -----

    // Default page background. If this changes, make sure to adapt the native side as well:
    //  - JitsiMeetView.m
    //  - JitsiMeetView.java
    uiBackground: 'surface01',

    // Container backgrounds (legacy tokens)
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

    // ----- Semantic Tokens (component-based, backwards compatible) -----

    // Dialog/Modal Components
    dialogBackground: 'surface02',      // Main dialog background (same as ui01)
    dialogOverlay: 'surface03',         // Overlay/backdrop (same as ui02)
    dialogBorder: 'ui02',               // Dialog borders
    dialogText: 'textColor01',          // Primary dialog text (same as text01)
    dialogSecondaryText: 'textColor02', // Secondary dialog text (same as text02)

    // Large Video
    largeVideoBackground: 'surface03',  // Main video area background (same as ui02)
    largeVideoPlaceholder: 'surface03', // Placeholder when no video (same as ui02)

    // Filmstrip
    filmstripBackground: 'surface03',   // Filmstrip container background (same as ui02)
    filmstripBackgroundHover: 'uiBackground', // Filmstrip background on hover/focus
    filmstripDragHandle: 'icon02',      // Filmstrip resize drag handle color
    filmstripDragHandleHover: 'icon01', // Filmstrip resize drag handle hover color
    thumbnailBackground: 'surface03',   // Individual thumbnail background (same as ui02)
    thumbnailBorder: 'ui03',            // Thumbnail borders (same as ui03)
    thumbnailHover: 'hover05',          // Thumbnail hover state (same as action03Hover)
    thumbnailTintBackground: 'uiBackground', // Thumbnail tint overlay background
    thumbnailRaisedHandIcon: 'uiBackground', // Thumbnail raised hand indicator icon
    thumbnailVideoBackground: 'uiBackground', // Thumbnail video/placeholder background

    // Chat
    chatBackground: 'surface02',              // Chat panel background (same as ui01)
    chatBackdrop: 'ui04',                     // Chat screen background (same as ui10)
    chatEmptyText: 'ui03',                    // Empty component text
    chatInputBackground: 'surface03',         // Chat input field background (same as ui02)
    chatInputBorder: 'surface03',             // Chat input border (same as ui02)
    chatLink: 'action01',                     // Chat link color (same as link01)
    chatLobbyMessageBubble: 'support06',      // Lobby message bubble background
    chatLobbyMessageNotice: 'surface01',      // Lobby message notice text
    chatLobbyRecipientContainer: 'support06', // Lobby recipient container background
    chatMessageLocal: 'surface05',            // Local participant message bubble (same as ui04)
    chatMessagePrivate: 'support05',          // Private/DM message bubble
    chatMessageRemote: 'surface03',           // Remote participant message bubble (same as ui02)
    chatMessageText: 'textColor01',           // Chat message text
    chatPrivateNotice: 'textColor02',         // Private message notice text
    chatRecipientCancelIcon: 'icon01',        // Recipient cancel icon color
    chatRecipientContainer: 'support05',      // Recipient container background
    chatRecipientText: 'textColor01',         // Recipient text color
    chatReplyIcon: 'icon01',                  // Reply icon color
    chatSenderName: 'textColor02',            // Sender display name color
    chatTimestamp: 'ui03',                    // Chat timestamp text

    // Toolbox/Toolbar
    toolboxBackground: 'surface02',     // Main toolbox background
    drawerBackground: 'surface02',      // Drawer/side panel background
    toolboxIconHover: 'surface05',      // Toolbox icon hover background
    toolboxIconActive: 'ui02',          // Toolbox icon active/pressed background
    toolboxIconToggled: 'ui02',         // Toolbox icon toggled background
    toolbarButton: 'action01',          // Toolbar button color
    toolbarButtonHover: 'hover01',      // Toolbar button hover (same as action01Hover)
    toolbarButtonActive: 'active01',    // Toolbar button active/pressed state
    toolbarIcon: 'icon01',              // Toolbar icon color
    toolbarIconHover: 'icon01',         // Toolbar icon hover state
    toolbarIconActive: 'action01',      // Toolbar icon active/toggled state

    // Overflow Menu (More Actions)
    overflowMenuBackground: 'surface02',  // Overflow menu background
    overflowMenuBorder: 'surface05',      // Overflow menu border
    overflowMenuItemText: 'text01',       // Overflow menu item text
    overflowMenuItemIcon: 'text01',       // Overflow menu item icon
    overflowMenuItemHover: 'surface03',   // Overflow menu item hover background
    overflowMenuItemDisabled: 'text03',   // Overflow menu item disabled text/icon
    overflowMenuSeparator: 'ui03',        // Overflow menu group separator

    // Participants Pane
    participantsPaneBackground: 'surface02', // Participants list background
    participantItemBackground: 'surface03',  // Individual participant item background
    participantItemHover: 'hover05',         // Participant item hover
    participantItemBorder: 'ui02',           // Participant item border
    participantCounterBadge: 'ui02',         // Participant counter badge background
    participantCounterText: 'text01',        // Participant counter text
    participantModeratorLabel: 'text03',     // Moderator label text
    participantSectionText: 'text02',        // Section header/subtitle text
    participantActionButton: 'action02',     // Action button background
    participantLinkText: 'link01',           // Link text color
    participantWarningText: 'warning02',     // Warning text color
    participantRaisedHandBadge: 'warning02', // Raised hand indicator background
    participantRaisedHandIcon: 'icon04',     // Raised hand icon color

    // Lobby
    lobbyBackground: 'surface02',       // Lobby screen background (same as ui01)
    lobbyPreviewBackground: 'surface03', // Video preview background (same as ui02)

    // Speaker Stats
    speakerStatsBackground: 'surface02',   // Speaker stats panel background
    speakerStatsRowBackground: 'ui02',     // Individual stat row background
    speakerStatsRowAlternate: 'ui03',      // Alternate row background
    speakerStatsBorder: 'surface03',       // Speaker stats borders
    speakerStatsHeaderBackground: 'ui09',  // Header background
    speakerStatsSearchBackground: 'field01', // Search input background
    speakerStatsSearchBorder: 'ui05',      // Search input border
    speakerStatsSearchText: 'text01',      // Search input text
    speakerStatsSearchPlaceholder: 'text03', // Search placeholder
    speakerStatsSearchIcon: 'icon03',      // Search icon color
    speakerStatsLabelText: 'text03',       // Label text color
    speakerStatsSuccessBar: 'success02',   // Success/progress bar
    speakerStatsAvatarLeft: 'surface05',   // Avatar background for participants who left

    // Pre-meeting/Prejoin
    preMeetingBackground: 'surface02',  // Pre-meeting screen container background
    preMeetingPreview: 'ui01',          // Video preview in pre-meeting
    prejoinDialogBackground: 'uiBackground', // Prejoin dialog background
    prejoinDialogDelimiter: 'ui03',     // Prejoin dialog delimiter line
    prejoinDialogDelimiterText: 'text01', // Prejoin dialog delimiter text
    prejoinTitleText: 'text01',         // Prejoin title text color
    prejoinRoomNameText: 'text01',      // Prejoin room name text color
    prejoinWarningBackground: 'warning01', // Warning banner background
    prejoinWarningText: 'text04',       // Warning banner text
    prejoinRecordingWarningText: 'text03', // Recording warning text
    prejoinActionButtonPrimary: 'action01', // Primary action button
    prejoinActionButtonPrimaryHover: 'action01Hover', // Primary button hover
    prejoinActionButtonPrimaryText: 'text01', // Primary button text
    prejoinActionButtonSecondary: 'action02', // Secondary action button
    prejoinActionButtonSecondaryHover: 'action02Hover', // Secondary button hover
    prejoinActionButtonSecondaryText: 'text04', // Secondary button text
    prejoinActionButtonDanger: 'actionDanger', // Danger button (leave)
    prejoinActionButtonDisabled: 'disabled01', // Disabled button
    prejoinCountryPickerBackground: 'ui01', // Country picker background
    prejoinCountryPickerBorder: 'ui03', // Country picker border
    prejoinCountryPickerText: 'text01', // Country picker text
    prejoinCountryRowBackground: 'action03', // Country row background
    prejoinCountryRowHover: 'action03Hover', // Country row hover
    prejoinDeviceStatusOk: 'success01', // Device status OK background
    prejoinDeviceStatusWarning: 'warning01', // Device status warning background
    prejoinDeviceStatusText: 'uiBackground', // Device status text

    // Notifications
    notificationBackground: 'ui04',     // Notification background
    notificationNormalIcon: 'action01', // Normal notification icon
    notificationError: 'iconError',     // Error notification icon
    notificationSuccess: 'success01',   // Success notification icon
    notificationWarning: 'warning01',   // Warning notification icon
    notificationText: 'text04',         // Notification text
    notificationActionText: 'action01', // Notification action text
    notificationErrorText: 'textError', // Error notification text
    notificationActionFocus: 'action01', // Notification action focus outline
    notificationCloseIcon: 'icon04',    // Notification close icon

    // Forms/Inputs
    inputBackground: 'field01',         // Input field background
    inputBorder: 'surface03',           // Input field border (same as ui02)
    inputText: 'textColor01',           // Input field text (same as text01)
    inputPlaceholder: 'textColor02',    // Input placeholder text (same as text02)

    // Breakout Rooms
    breakoutRoomBackground: 'ui01',     // Breakout rooms panel background
    breakoutRoomItemBackground: 'surface03', // Individual breakout room background
    breakoutRoomArrowBackground: 'ui02', // Breakout room arrow container background

    // Settings
    settingsBackground: 'ui01',         // Settings dialog background
    settingsSectionBackground: 'ui02',  // Settings section background
    settingsTabText: 'text01',          // Settings tab text
    settingsShortcutKey: 'surface05',   // Keyboard shortcut key background
    settingsVideoPreviewBorder: 'action01Hover', // Video preview border (selected)
    settingsErrorIcon: 'iconError',     // Error icon color

    // Visitors
    visitorsCountBadge: 'warning02',    // Visitors count badge background
    visitorsCountText: 'uiBackground',  // Visitors count badge text
    visitorsCountIcon: 'icon04',        // Visitors count icon
    visitorsQueueBackground: 'ui01',    // Visitors queue panel background
    visitorsQueueText: 'text01',        // Visitors queue text
    visitorsArrowBackground: 'ui02',    // Visitors arrow container background

    // Welcome Page
    welcomeBackground: 'surface01',     // Welcome page background (same as uiBackground)
    welcomeCard: 'ui01',                // Welcome page tab bar background
    welcomeTabActive: 'icon01',         // Welcome page active tab icon
    welcomeTabInactive: 'icon03',       // Welcome page inactive tab icon

    // ----- Form Components -----

    // Input
    inputLabel: 'text01',                    // Input field label text
    inputFieldBackground: 'ui02',            // Input field background color
    inputFieldBorder: 'ui02',                // Input field border color
    inputFieldText: 'text01',                // Input field text color
    inputFieldPlaceholder: 'text02',         // Input field placeholder text
    inputFieldDisabled: 'text03',            // Input field disabled text
    inputFieldError: 'textError',            // Input field error state
    inputFieldFocus: 'focus01',              // Input field focus outline
    inputClearButton: 'transparent',         // Input clear button background
    inputBottomLabel: 'text02',              // Input bottom label text
    inputBottomLabelError: 'textError',      // Input bottom label error text

    // Select
    selectLabel: 'text01',                   // Select label text
    selectBackground: 'ui02',                // Select background color
    selectText: 'text01',                    // Select text color
    selectDisabled: 'text03',                // Select disabled text
    selectError: 'textError',                // Select error state
    selectFocus: 'focus01',                  // Select focus outline
    selectIcon: 'icon01',                    // Select dropdown icon (enabled)
    selectIconDisabled: 'icon03',            // Select dropdown icon (disabled)
    selectBottomLabel: 'text02',             // Select bottom label text
    selectBottomLabelError: 'textError',     // Select bottom label error text

    // MultiSelect
    multiSelectBackground: 'ui01',           // MultiSelect dropdown background
    multiSelectBorder: 'ui04',               // MultiSelect dropdown border
    multiSelectItemText: 'text01',           // MultiSelect item text
    multiSelectItemHover: 'ui02',            // MultiSelect item hover background
    multiSelectItemDisabled: 'text03',       // MultiSelect disabled item text

    // Checkbox
    checkboxLabel: 'text01',                 // Checkbox label text
    checkboxBorder: 'icon03',                // Checkbox border color
    checkboxChecked: 'action01',             // Checkbox checked background
    checkboxDisabledBackground: 'ui02',      // Checkbox disabled background
    checkboxDisabledBorder: 'surface05',     // Checkbox disabled border
    checkboxDisabledChecked: 'ui02',         // Checkbox disabled checked background
    checkboxIcon: 'icon01',                  // Checkbox check icon (enabled)
    checkboxIconDisabled: 'icon03',          // Checkbox check icon (disabled)

    // Switch
    switchBackground: 'ui01',                // Switch background (unchecked)
    switchBackgroundOn: 'action01',          // Switch background (checked)
    switchToggle: 'ui04',                    // Switch toggle circle
    switchToggleDisabled: 'ui03',            // Switch toggle circle (disabled)
    switchFocus: 'focus01',                  // Switch focus outline

    // Tabs
    tabText: 'text02',                       // Tab text (unselected)
    tabTextHover: 'text01',                  // Tab text (hover)
    tabTextSelected: 'text01',               // Tab text (selected)
    tabTextDisabled: 'text03',               // Tab text (disabled)
    tabBorder: 'ui05',                       // Tab bottom border (unselected)
    tabBorderHover: 'ui10',                  // Tab bottom border (hover)
    tabBorderSelected: 'action01',           // Tab bottom border (selected)
    tabBorderDisabled: 'ui05',               // Tab bottom border (disabled)
    tabFocus: 'focus01',                     // Tab focus outline
    tabBadgeBackground: 'warning01',         // Tab count badge background
    tabBadgeText: 'text04',                  // Tab count badge text

    // ListItem
    listItemText: 'text01',                  // List item text color
    listItemBackground: 'ui01',              // List item default background
    listItemHover: 'surface03',              // List item hover background
    listItemHighlighted: 'surface03',        // List item highlighted/active background
    listItemBoxShadow: 'ui02',               // List item actions box shadow color

    // ClickableIcon
    clickableIconBackground: 'transparent',  // Clickable icon background
    clickableIconHover: 'ui02',              // Clickable icon hover background
    clickableIconActive: 'ui03',             // Clickable icon active/pressed background
    clickableIconFocus: 'focus01',           // Clickable icon focus outline

    // Label
    labelBackground: 'ui04',                 // Label default background
    labelText: 'text01',                     // Label text color
    labelWhiteBackground: 'ui08',            // Label white variant background
    labelWhiteText: 'text04',                // Label white variant text
    labelWhiteIcon: 'surface01',             // Label white variant icon

    // Tooltip
    tooltipBackground: 'uiBackground',       // Tooltip background color
    tooltipText: 'text01',                   // Tooltip text color

    // Polls
    pollsBackground: 'surface03',            // Poll container background
    pollsTitle: 'text01',                    // Poll title text
    pollsSubtitle: 'text02',                 // Poll subtitle/secondary text
    pollsQuestion: 'text01',                 // Poll question text
    pollsAnswer: 'text01',                   // Poll answer text
    pollsBarBackground: 'ui03',              // Poll results bar background
    pollsBarPercentage: 'text01',            // Poll results percentage text
    pollsVotersBackground: 'ui03',           // Poll voters list background
    pollsVotersText: 'text01',               // Poll voters list text
    pollsSeparator: 'ui03',                  // Poll section separator
    pollsSendLabel: 'text01',                // Poll send button label
    pollsSendDisabled: 'text03',             // Poll send button disabled label
    pollsPaneBackground: 'ui01',             // Poll pane container background
    pollsPaneBorder: 'ui05',                 // Poll pane border
    pollsCreateBackground: 'uiBackground',   // Poll create dialog background
    pollsCreateBorder: 'ui06',               // Poll create dialog border

    // Video Quality / Slider
    sliderKnob: 'text01',                    // Slider knob/thumb color
    sliderTrack: 'text03',                   // Slider track color
    sliderFocus: 'ui06',                     // Slider focus outline
    videoQualityText: 'text01',              // Video quality dialog text
    videoQualityBackground: 'surface02',     // Video quality dialog background

    // Connection Indicator
    connectionIndicatorLost: 'ui05',         // Connection indicator lost status
    connectionIndicatorOther: 'action01',    // Connection indicator other status

    // Device Selection
    deviceSelectorBackground: 'ui01',        // Device selector background
    deviceSelectorText: 'text01',            // Device selector text
    deviceSelectorBorder: 'ui03',            // Device selector border
    deviceSelectorTextBackground: 'uiBackground', // Device selector text-only background
    deviceSelectorVideoPreview: 'uiBackground', // Device selector video preview background

    // Invite / Dial-in
    dialInBackground: 'ui01',                // Dial-in summary background
    dialInText: 'text01',                    // Dial-in summary text
    dialInSecondaryText: 'text02',           // Dial-in summary secondary text

    // Reactions
    reactionsMenuBackground: 'ui01',         // Reactions menu background
    reactionsMenuBorder: 'ui02',             // Reactions menu border

    // Recording / Live Stream
    recordingBackground: 'ui01',             // Recording panel background
    recordingText: 'text01',                 // Recording panel text
    recordingHighlightButton: 'ui04',        // Recording highlight button background
    recordingHighlightButtonDisabled: 'text02', // Recording highlight button disabled background
    recordingHighlightButtonIcon: 'ui02',    // Recording highlight button icon color
    recordingHighlightButtonIconDisabled: 'text03', // Recording highlight button disabled icon color
    recordingNotificationText: 'surface01',  // Recording notification text color
    recordingNotificationAction: 'action01', // Recording notification action color

    // Virtual Background
    virtualBackgroundBackground: 'ui01',     // Virtual background picker background
    virtualBackgroundText: 'text01',         // Virtual background picker text
    virtualBackgroundBorder: 'ui03',         // Virtual background item border
    virtualBackgroundPreview: 'uiBackground', // Virtual background preview container

    // Conference / Meeting
    conferenceTimerText: 'text01',           // Conference timer text
    conferenceSubjectText: 'text01',         // Conference subject text
    conferenceNoticeBackground: 'uiBackground', // Conference notice background
    conferenceNoticeText: 'text01',          // Conference notice text
    conferenceRaisedHandLabelText: 'uiBackground', // Raised hands count label text
    conferenceRaisedHandLabelIcon: 'surface01', // Raised hands count label icon

    // Subtitle Messages
    subtitleMessageBackground: 'ui02',       // Subtitle message background
    subtitleMessageText: 'text01',           // Subtitle message text
    subtitleMessageSender: 'text02',         // Subtitle message sender name
    subtitleMessageTime: 'text03',           // Subtitle message timestamp

    // Language Selector
    languageSelectorBackground: 'ui01',      // Language selector background
    languageSelectorText: 'text01',          // Language selector text
    languageSelectorHover: 'ui02',           // Language selector item hover

    // Video Menu
    videoMenuBackground: 'ui01',             // Video menu background
    videoMenuBorder: 'ui02',                 // Video menu border
    videoMenuText: 'text01',                 // Video menu text
    videoMenuSliderBackground: 'ui03',       // Video menu slider background

    // File Sharing
    fileSharingBackground: 'ui01',           // File sharing panel background
    fileSharingText: 'text01',               // File sharing text
    fileSharingEmptyText: 'text02',          // File sharing empty state text
    fileSharingEmptyIcon: 'icon03',          // File sharing empty state icon
    fileSharingItemBackground: 'surface03',  // File sharing item background
    fileSharingItemBorder: 'ui02',           // File sharing item hover/border

    // Gifs
    gifsBackground: 'ui01',                  // GIFs panel background
    gifsText: 'text01',                      // GIFs panel text

    // Whiteboard
    whiteboardBackground: 'ui03',            // Whiteboard background
    whiteboardText: 'text01',                // Whiteboard panel text

    // Salesforce
    salesforceSearchBackground: 'field01',   // Salesforce search input background
    salesforceSearchBorder: 'ui05',          // Salesforce search input border
    salesforceSearchText: 'dialogText',      // Salesforce search input text
    salesforceSearchPlaceholder: 'text03',   // Salesforce search placeholder
    salesforceSearchIcon: 'text03',          // Salesforce search icon

    // Security Dialog
    securityDialogBackground: 'ui01',        // Security dialog background
    securityDialogText: 'text01',            // Security dialog text
    securityDialogSecondaryText: 'text02',   // Security dialog secondary text
    securityDialogBorder: 'ui07',            // Security dialog border color

    // Deep Linking
    deepLinkingBackground: 'ui01',           // Deep linking page content pane background
    deepLinkingBorder: 'ui03',               // Deep linking page content pane border
    deepLinkingText: 'text01',               // Deep linking page text
    deepLinkingSeparator: 'ui03',            // Deep linking separator line
    deepLinkingLabelText: 'text02',          // Deep linking label text
    deepLinkingLink: 'link01',               // Deep linking link color

    // Base React Components
    baseReactBackground: 'ui01',             // Base react component background
    baseReactText: 'text01',                 // Base react component text
    baseReactBorder: 'ui03',                 // Base react component border

    // Inline Dialog
    inlineDialogBackground: 'ui01',          // Inline dialog background
    inlineDialogText: 'text01',              // Inline dialog text
    inlineDialogBorder: 'ui02',              // Inline dialog border

    // Pre-meeting / Action Button
    actionButtonBackground: 'ui01',          // Action button background (different from main buttons)
    actionButtonText: 'text01',              // Action button text
    actionButtonBorder: 'ui03',              // Action button border

    // Audio Route Picker
    audioRoutePickerBackground: 'ui01',      // Audio route picker background
    audioRoutePickerText: 'text01',          // Audio route picker text
    audioRoutePickerBorder: 'ui03',          // Audio route picker border

    // Etherpad
    etherpadBackground: 'ui01',              // Etherpad panel background
    etherpadText: 'text01',                  // Etherpad panel text

    // Display Name
    displayNameBackground: 'ui01',           // Display name background
    displayNameText: 'text01',               // Display name text

    // Car Mode
    carModeBackground: 'ui01',               // Car mode background
    carModeText: 'text01',                   // Car mode text
    carModeBorder: 'ui03',                   // Car mode border

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
    weightRegular: 400,
    weightSemiBold: 600
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
        fontSize: '0.625rem',
        lineHeight: '1rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortRegular: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBold: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyShortRegularLarge: {
        fontSize: '1rem',
        lineHeight: '1.375rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyShortBoldLarge: {
        fontSize: '1rem',
        lineHeight: '1.375rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongRegular: {
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongRegularLarge: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: font.weightRegular,
        letterSpacing: 0
    },

    bodyLongBold: {
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    bodyLongBoldLarge: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading1: 'heading01',

    heading2: 'heading02',

    heading3: {
        fontSize: '2rem',
        lineHeight: '2.5rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading4: {
        fontSize: '1.75rem',
        lineHeight: '2.25rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading5: {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
        fontWeight: font.weightSemiBold,
        letterSpacing: 0
    },

    heading6: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
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
