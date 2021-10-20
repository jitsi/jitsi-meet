import { TransitionPresets } from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';

import { IconClose } from '../../../base/icons';
import BaseTheme from '../../../base/ui/components/BaseTheme';

import { goBack } from './ConferenceNavigationContainerRef';
import HeaderNavigationButton from './HeaderNavigationButton';


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
export const screenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: false,
    headerShown: false
};

/**
 * Screen options for conference.
 */
export const conferenceScreenOptions = {
    ...screenOptions
};

/**
 * Screen options for lobby modal.
 */
export const lobbyScreenOptions = {
    ...screenOptions
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
