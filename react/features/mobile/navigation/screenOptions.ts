import { TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';

import BaseTheme from '../../base/ui/components/BaseTheme.native';

import { goBack } from './components/conference/ConferenceNavigationContainerRef';
import { goBack as goBackToLobbyScreen } from './components/lobby/LobbyNavigationContainerRef';
import { lobbyScreenHeaderCloseButton, screenHeaderCloseButton } from './functions';
import { goBack as goBackToWelcomeScreen } from './rootNavigationContainerRef';


/**
 * Default modal transition for the current platform.
 */
export const modalPresentation = Platform.select({
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
 * Navigation container theme.
 */
export const navigationContainerTheme = {
    colors: {
        background: BaseTheme.palette.uiBackground
    }
};

/**
 * Screen options for welcome page.
 */
export const welcomeScreenOptions = {
    ...TransitionPresets.ModalTransition,
    gestureEnabled: false,
    headerShown: true,
    headerStyle: {
        backgroundColor: BaseTheme.palette.ui01
    },
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
    swipeEnabled: false,
    tabBarIndicatorStyle: {
        backgroundColor: BaseTheme.palette.link01Active
    },
    tabBarStyle: {
        backgroundColor: BaseTheme.palette.ui01,
        borderBottomColor: BaseTheme.palette.ui06,
        borderBottomWidth: 0.4
    }
};

/**
 * Screen options for presentation type modals.
 */
export const presentationScreenOptions = {
    ...modalPresentation,
    headerBackTitleVisible: false,
    headerLeft: () => screenHeaderCloseButton(goBack),
    headerStatusBarHeight: 0,
    headerStyle: {
        backgroundColor: BaseTheme.palette.ui01
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for breakout rooms screen.
 */
export const breakoutRoomsScreenOptions = presentationScreenOptions;

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
    headerLeft: () => screenHeaderCloseButton(goBackToWelcomeScreen)
};

/**
 * Screen options for invite modal.
 */
export const inviteScreenOptions = presentationScreenOptions;

/**
 * Screen options for live stream modal.
 */
export const liveStreamScreenOptions = presentationScreenOptions;

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
 * Screen options for subtitles modal.
 */
export const subtitlesScreenOptions = presentationScreenOptions;

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
export const sharedDocumentScreenOptions = presentationScreenOptions;

/**
 * Screen options for settings modal.
 */
export const settingsScreenOptions = presentationScreenOptions;

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
        backgroundColor: BaseTheme.palette.ui01
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    }
};

/**
 * Screen options for profile setting.
 */
export const profileSettingsScreenOptions = {
    headerStyle: {
        backgroundColor: BaseTheme.palette.ui01
    },
    headerTitleStyle: {
        color: BaseTheme.palette.text01
    },
    headerBackTitleVisible: false
};

/**
 * Screen options for language select screen.
 */
export const languageSelectScreenOptions = profileSettingsScreenOptions;

/**
 * Screen options for pre-join screen.
 */
export const unsafeMeetingScreenOptions = preJoinScreenOptions;

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

/**
 * Screen options for settings navigation container screen.
 */
export const settingsNavigationContainerScreenOptions = {
    ...modalPresentation,
    gestureEnabled: true,
    headerShown: false
};
