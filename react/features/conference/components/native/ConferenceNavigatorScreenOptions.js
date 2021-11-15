// @flow
/* eslint-disable react/no-multi-comp */

import { TransitionPresets } from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';

import {
    Icon,
    IconClose,
    IconHelp,
    IconHome,
    IconInfo,
    IconSettings
} from '../../../base/icons';
import BaseTheme from '../../../base/ui/components/BaseTheme';

import { goBack } from './ConferenceNavigationContainerRef';
import HeaderNavigationButton from './HeaderNavigationButton';

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
 * Dial-IN Info screen options and transition types.
 */
export const dialInSummaryScreenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: true,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
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
        backgroundColor: BaseTheme.palette.screen01Header
    }
};

/**
 * Screen options for welcome page.
 */
export const welcomeScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.field01Disabled }
            size = { 20 }
            src = { IconHome } />
    ),
    headerTitleStyle: {
        color: BaseTheme.palette.screen01Header
    }
};

/**
 * Screen options for settings screen.
 */
export const settingsScreenOptions = {
    ...drawerScreenOptions,
    drawerIcon: ({ focused }) => (
        <Icon
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.field01Disabled }
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
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.field01Disabled }
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
            color = { focused ? BaseTheme.palette.screen01Header : BaseTheme.palette.field01Disabled }
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
    ...fullScreenOptions
};

/**
 * Screen options for lobby modal.
 */
export const lobbyScreenOptions = {
    ...fullScreenOptions
};

/**
 * Tab bar options for chat screen.
 */
export const chatTabBarOptions = {
    activeTintColor: BaseTheme.palette.screen01Header,
    labelStyle: {
        fontSize: BaseTheme.typography.labelRegular.fontSize
    },
    inactiveTintColor: BaseTheme.palette.field02Disabled,
    indicatorStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    }
};

/**
 * Screen options for presentation type modals.
 */
export const presentationScreenOptions = {
    ...conferenceModalPresentation,
    headerBackTitleVisible: false,
    headerLeft: () => (
        <HeaderNavigationButton
            onPress = { goBack }
            src = { IconClose } />
    ),
    headerStatusBarHeight: 0,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for chat.
 */
export const chatScreenOptions = {
    ...presentationScreenOptions
};

/**
 * Screen options for invite modal.
 */
export const inviteScreenOptions = {
    ...presentationScreenOptions
};

/**
 * Screen options for participants modal.
 */
export const participantsScreenOptions = {
    ...presentationScreenOptions
};

/**
 * Screen options for shared document.
 */
export const sharedDocumentScreenOptions = {
    ...TransitionPresets.DefaultTransition,
    headerBackTitleVisible: false,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.screen01Header
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};
