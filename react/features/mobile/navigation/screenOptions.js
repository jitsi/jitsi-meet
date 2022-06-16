import React from 'react';
import { Platform } from 'react-native';

import {
    Icon,
    IconHelp,
    IconHome,
    IconInfo,
    IconSettings
} from '../../base/icons';
import BaseTheme from '../../base/ui/components/BaseTheme.native';

import { goBack } from './components/conference/ConferenceNavigationContainerRef';
import { goBack as goBackToLobbyScreen } from './components/lobby/LobbyNavigationContainerRef';
import { lobbyScreenHeaderCloseButton, screenHeaderCloseButton } from './functions';
import { goBack as goBackToWelcomeScreen } from './rootNavigationContainerRef';


/**
 * Navigation container theme.
 */
export const navigationContainerTheme = {
    colors: {
        background: BaseTheme.palette.uiBackground
    }
};

/**
 * Drawer navigator screens options and transition types.
 */
export const drawerNavigatorScreenOptions = {
    animation: 'default',
    gestureEnabled: true,
    headerShown: false
};


/**
 * Drawer screen options and transition types.
 */
export const drawerScreenOptions = {
    animation: 'default',
    gestureEnabled: true,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    orientation: Platform.select({
        ios: 'default',
        android: 'all'
    })
};

/**
 * Drawer content options.
 */
export const drawerContentOptions = {
    drawerActiveBackgroundColor: BaseTheme.palette.uiBackground,
    drawerActiveTintColor: BaseTheme.palette.screen01Header,
    drawerInactiveTintColor: BaseTheme.palette.text02,
    drawerLabelStyle: {
        marginLeft: BaseTheme.spacing[2]
    },
    drawerStyle: {
        backgroundColor: BaseTheme.palette.uiBackground,
        maxWidth: 400,
        width: '75%'
    }
};

/**
 * Screen options for welcome page.
 */
export const welcomeScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.icon02 }
            size = { 20 }
            src = { IconHome } />
    ),
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for settings screen.
 */
export const settingsScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.icon02 }
            size = { 20 }
            src = { IconSettings } />
    ),
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for terms/privacy screens.
 */
export const termsAndPrivacyScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.icon02 }
            size = { 20 }
            src = { IconInfo } />
    ),
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for help screen.
 */
export const helpScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.icon02 }
            size = { 20 }
            src = { IconHelp } />
    ),
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for conference.
 */
export const conferenceScreenOptions = {
    animation: 'default',
    gestureEnabled: false,
    headerShown: false,
    orientation: Platform.select({
        ios: 'default',
        android: 'all'
    })
};

/**
 * Tab bar options for chat screen.
 */
export const chatTabBarOptions = {
    tabBarActiveTintColor: BaseTheme.palette.screen01Header,
    tabBarLabelStyle: {
        fontSize: BaseTheme.typography.labelRegular.fontSize
    },
    tabBarInactiveTintColor: BaseTheme.palette.text01,
    tabBarIndicatorStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    }
};

/**
 * Screen options for presentation type modals.
 */
export const presentationScreenOptions = {
    headerBackTitleVisible: false,
    headerLeft: () => screenHeaderCloseButton(goBack),
    headerStatusBarHeight: 0,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    },
    orientation: Platform.select({
        ios: 'default',
        android: 'all'
    })
};

/**
 * Screen options for car mode.
 */
export const carmodeScreenOptions = presentationScreenOptions;

/**
 * Screen options for chat.
 */
export const chatScreenOptions = presentationScreenOptions;

/**
 * Dial-IN Info screen options and transition types.
 */
export const dialInSummaryScreenOptions = {
    ...presentationScreenOptions,
    animation: 'slide_from_bottom',
    headerLeft: () => screenHeaderCloseButton(goBackToWelcomeScreen)
};

/**
 * Screen options for invite modal.
 */
export const inviteScreenOptions = presentationScreenOptions;

/**
 * Screen options for participants modal.
 */
export const participantsScreenOptions = presentationScreenOptions;

/**
 * Screen options for speaker stats modal.
 */
export const speakerStatsScreenOptions = presentationScreenOptions;

/**
 * Screen options for security options modal.
 */
export const securityScreenOptions = presentationScreenOptions;

/**
 * Screen options for recording modal.
 */
export const recordingScreenOptions = presentationScreenOptions;

/**
 * Screen options for live stream modal.
 */
export const liveStreamScreenOptions = presentationScreenOptions;

/**
 * Screen options for lobby modal.
 */
export const lobbyScreenOptions = {
    ...presentationScreenOptions,
    headerLeft: () => lobbyScreenHeaderCloseButton()
};

/**
 * Screen options for lobby chat modal.
 */
export const lobbyChatScreenOptions = {
    ...presentationScreenOptions,
    headerLeft: () => screenHeaderCloseButton(goBackToLobbyScreen)
};

/**
 * Screen options for salesforce link modal.
 */
export const salesforceScreenOptions = presentationScreenOptions;

/**
 * Screen options for GIPHY integration modal.
 */
export const gifsMenuOptions = presentationScreenOptions;

/**
 * Screen options for shared document.
 */
export const sharedDocumentScreenOptions = {
    animation: 'slide_from_right',
    headerBackTitleVisible: false,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    },
    orientation: Platform.select({
        ios: 'default',
        android: 'all'
    })
};

/**
 * Screen options for connecting screen.
 */
export const connectingScreenOptions = {
    gestureEnabled: false,
    headerShown: false
};

/**
 * Screen options for pre-join screen.
 */
export const preJoinScreenOptions = {
    gestureEnabled: false,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    headerTitle: ''
};

/**
 * Screen options for conference navigation container screen.
 */
export const conferenceNavigationContainerScreenOptions = {
    gestureEnabled: false,
    headerShown: false
};

/**
 * Screen options for lobby navigation container screen.
 */
export const lobbyNavigationContainerScreenOptions = {
    gestureEnabled: false,
    headerShown: false
};
