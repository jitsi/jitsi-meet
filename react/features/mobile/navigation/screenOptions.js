import { TransitionPresets } from '@react-navigation/stack';
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
import { screenHeaderCloseButton } from './functions';


/**
 * Navigation container theme.
 */
export const navigationContainerTheme = {
    colors: {
        background: BaseTheme.palette.ui12
    }
};

/**
 * Default modal transition for the current platform.
 */
export const conferenceModalPresentation = Platform.select({
    ios: TransitionPresets.ModalPresentationIOS,
    default: TransitionPresets.DefaultTransition
});

/**
 * Screen options and transition types.
 */
export const fullScreenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: false,
    headerShown: false
};


/**
 * Drawer navigator screens options and transition types.
 */
export const drawerNavigatorScreenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: true,
    headerShown: false
};


/**
 * Drawer screen options and transition types.
 */
export const drawerScreenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: true,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    }
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
    // eslint-disable-next-line no-empty-function
    headerTitle: () => {}
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
export const conferenceScreenOptions = fullScreenOptions;

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
    ...conferenceModalPresentation,
    headerBackTitleVisible: false,
    headerLeft: () => screenHeaderCloseButton(goBack),
    headerStatusBarHeight: 0,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for chat.
 */
export const chatScreenOptions = presentationScreenOptions;

/**
 * Dial-IN Info screen options and transition types.
 */
export const dialInSummaryScreenOptions = {
    ...presentationScreenOptions,
    headerLeft: undefined
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
export const lobbyScreenOptions = presentationScreenOptions;

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
    ...TransitionPresets.DefaultTransition,
    headerBackTitleVisible: false,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen02Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};
