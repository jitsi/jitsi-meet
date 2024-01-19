import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import {
    IconBell,
    IconCalendar,
    IconGear,
    IconImage,
    IconModerator,
    IconShortcuts,
    IconUser,
    IconVideo,
    IconVolumeUp
} from '../../../base/icons/svg';
import DialogWithTabs, { IDialogTab } from '../../../base/ui/components/web/DialogWithTabs';
import { isCalendarEnabled } from '../../../calendar-sync/functions.web';
import { submitAudioDeviceSelectionTab, submitVideoDeviceSelectionTab } from '../../../device-selection/actions.web';
import AudioDevicesSelection from '../../../device-selection/components/AudioDevicesSelection';
import VideoDeviceSelection from '../../../device-selection/components/VideoDeviceSelection';
import {
    getAudioDeviceSelectionDialogProps,
    getVideoDeviceSelectionDialogProps
} from '../../../device-selection/functions.web';
import { checkBlurSupport, checkVirtualBackgroundEnabled } from '../../../virtual-background/functions';
import { iAmVisitor } from '../../../visitors/functions';
import {
    submitModeratorTab,
    submitMoreTab,
    submitNotificationsTab,
    submitProfileTab,
    submitShortcutsTab,
    submitVirtualBackgroundTab
} from '../../actions';
import { SETTINGS_TABS } from '../../constants';
import {
    getModeratorTabProps,
    getMoreTabProps,
    getNotificationsMap,
    getNotificationsTabProps,
    getProfileTabProps,
    getShortcutsTabProps,
    getVirtualBackgroundTabProps
} from '../../functions';

import CalendarTab from './CalendarTab';
import ModeratorTab from './ModeratorTab';
import MoreTab from './MoreTab';
import NotificationsTab from './NotificationsTab';
import ProfileTab from './ProfileTab';
import ShortcutsTab from './ShortcutsTab';
import VirtualBackgroundTab from './VirtualBackgroundTab';

/**
 * The type of the React {@code Component} props of
 * {@link ConnectedSettingsDialog}.
 */
interface IProps {

    /**
     * Information about the tabs to be rendered.
     */
    _tabs: IDialogTab<any>[];

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: string;

    /**
     * Invoked to save changed settings.
     */
    dispatch: IStore['dispatch'];

    /**
     * Indicates whether the device selection dialog is displayed on the
     * welcome page or not.
     */
    isDisplayedOnWelcomePage: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        settingsDialog: {
            display: 'flex',
            width: '100%'
        }
    };
});

const SettingsDialog = ({ _tabs, defaultTab, dispatch }: IProps) => {
    const { classes } = useStyles();

    const correctDefaultTab = _tabs.find(tab => tab.name === defaultTab)?.name;
    const tabs = _tabs.map(tab => {
        return {
            ...tab,
            className: `settings-pane ${classes.settingsDialog}`,
            submit: (...args: any) => tab.submit
                && dispatch(tab.submit(...args))
        };
    });

    return (
        <DialogWithTabs
            className = 'settings-dialog'
            defaultTab = { correctDefaultTab }
            tabs = { tabs }
            titleKey = 'settings.title' />
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ConnectedSettingsDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @private
 * @returns {{
 *     tabs: Array<Object>
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { isDisplayedOnWelcomePage } = ownProps;
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];

    // The settings sections to display.
    const showDeviceSettings = configuredTabs.includes('devices');
    const moreTabProps = getMoreTabProps(state);
    const moderatorTabProps = getModeratorTabProps(state);
    const { showModeratorSettings } = moderatorTabProps;
    const showMoreTab = configuredTabs.includes('more');
    const showProfileSettings
        = configuredTabs.includes('profile') && !state['features/base/config'].disableProfile;
    const showCalendarSettings
        = configuredTabs.includes('calendar') && isCalendarEnabled(state);
    const showSoundsSettings = configuredTabs.includes('sounds');
    const enabledNotifications = getNotificationsMap(state);
    const showNotificationsSettings = Object.keys(enabledNotifications).length > 0;
    const virtualBackgroundSupported = checkBlurSupport();
    const enableVirtualBackground = checkVirtualBackgroundEnabled(state);
    const tabs: IDialogTab<any>[] = [];
    const _iAmVisitor = iAmVisitor(state);

    if (showDeviceSettings) {
        tabs.push({
            name: SETTINGS_TABS.AUDIO,
            component: AudioDevicesSelection,
            labelKey: 'settings.audio',
            props: getAudioDeviceSelectionDialogProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getAudioDeviceSelectionDialogProps>) => {
                // Ensure the device selection tab gets updated when new devices
                // are found by taking the new props and only preserving the
                // current user selected devices. If this were not done, the
                // tab would keep using a copy of the initial props it received,
                // leaving the device list to become stale.

                return {
                    ...newProps,
                    noiseSuppressionEnabled: tabState.noiseSuppressionEnabled,
                    selectedAudioInputId: tabState.selectedAudioInputId,
                    selectedAudioOutputId: tabState.selectedAudioOutputId
                };
            },
            submit: (newState: any) => submitAudioDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            icon: IconVolumeUp
        });
        !_iAmVisitor && tabs.push({
            name: SETTINGS_TABS.VIDEO,
            component: VideoDeviceSelection,
            labelKey: 'settings.video',
            props: getVideoDeviceSelectionDialogProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getVideoDeviceSelectionDialogProps>) => {
                // Ensure the device selection tab gets updated when new devices
                // are found by taking the new props and only preserving the
                // current user selected devices. If this were not done, the
                // tab would keep using a copy of the initial props it received,
                // leaving the device list to become stale.

                return {
                    ...newProps,
                    currentFramerate: tabState?.currentFramerate,
                    localFlipX: tabState.localFlipX,
                    selectedVideoInputId: tabState.selectedVideoInputId
                };
            },
            submit: (newState: any) => submitVideoDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            icon: IconVideo
        });
    }

    if (virtualBackgroundSupported && !_iAmVisitor && enableVirtualBackground) {
        tabs.push({
            name: SETTINGS_TABS.VIRTUAL_BACKGROUND,
            component: VirtualBackgroundTab,
            labelKey: 'virtualBackground.title',
            props: getVirtualBackgroundTabProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getVirtualBackgroundTabProps>,
                    tabStates: any) => {
                const videoTabState = tabStates[tabs.findIndex(tab => tab.name === SETTINGS_TABS.VIDEO)];

                return {
                    ...newProps,
                    selectedVideoInputId: videoTabState?.selectedVideoInputId || newProps.selectedVideoInputId,
                    options: tabState.options
                };
            },
            submit: (newState: any) => submitVirtualBackgroundTab(newState),
            cancel: () => {
                const { options } = getVirtualBackgroundTabProps(state, isDisplayedOnWelcomePage);

                return submitVirtualBackgroundTab({ options }, true);
            },
            icon: IconImage
        });
    }

    if ((showSoundsSettings || showNotificationsSettings) && !_iAmVisitor) {
        tabs.push({
            name: SETTINGS_TABS.NOTIFICATIONS,
            component: NotificationsTab,
            labelKey: 'settings.notifications',
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getNotificationsTabProps>) => {
                return {
                    ...newProps,
                    enabledNotifications: tabState?.enabledNotifications || {},
                    soundsIncomingMessage: tabState?.soundsIncomingMessage,
                    soundsParticipantJoined: tabState?.soundsParticipantJoined,
                    soundsParticipantKnocking: tabState?.soundsParticipantKnocking,
                    soundsParticipantLeft: tabState?.soundsParticipantLeft,
                    soundsReactions: tabState?.soundsReactions,
                    soundsTalkWhileMuted: tabState?.soundsTalkWhileMuted
                };
            },
            props: getNotificationsTabProps(state, showSoundsSettings),
            submit: submitNotificationsTab,
            icon: IconBell
        });
    }

    if (showModeratorSettings && !_iAmVisitor) {
        tabs.push({
            name: SETTINGS_TABS.MODERATOR,
            component: ModeratorTab,
            labelKey: 'settings.moderator',
            props: moderatorTabProps,
            propsUpdateFunction: (tabState: any, newProps: typeof moderatorTabProps) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    followMeEnabled: tabState?.followMeEnabled,
                    startAudioMuted: tabState?.startAudioMuted,
                    startVideoMuted: tabState?.startVideoMuted,
                    startReactionsMuted: tabState?.startReactionsMuted
                };
            },
            submit: submitModeratorTab,
            icon: IconModerator
        });
    }

    if (showProfileSettings) {
        tabs.push({
            name: SETTINGS_TABS.PROFILE,
            component: ProfileTab,
            labelKey: 'profile.title',
            props: getProfileTabProps(state),
            submit: submitProfileTab,
            icon: IconUser
        });
    }

    if (showCalendarSettings && !_iAmVisitor) {
        tabs.push({
            name: SETTINGS_TABS.CALENDAR,
            component: CalendarTab,
            labelKey: 'settings.calendar.title',
            icon: IconCalendar
        });
    }

    !_iAmVisitor && tabs.push({
        name: SETTINGS_TABS.SHORTCUTS,
        component: ShortcutsTab,
        labelKey: 'settings.shortcuts',
        props: getShortcutsTabProps(state, isDisplayedOnWelcomePage),
        propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getShortcutsTabProps>) => {
            // Updates tab props, keeping users selection

            return {
                ...newProps,
                keyboardShortcutsEnabled: tabState?.keyboardShortcutsEnabled
            };
        },
        submit: submitShortcutsTab,
        icon: IconShortcuts
    });

    if (showMoreTab && !_iAmVisitor) {
        tabs.push({
            name: SETTINGS_TABS.MORE,
            component: MoreTab,
            labelKey: 'settings.more',
            props: moreTabProps,
            propsUpdateFunction: (tabState: any, newProps: typeof moreTabProps) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    currentLanguage: tabState?.currentLanguage,
                    hideSelfView: tabState?.hideSelfView,
                    showPrejoinPage: tabState?.showPrejoinPage,
                    maxStageParticipants: tabState?.maxStageParticipants
                };
            },
            submit: submitMoreTab,
            icon: IconGear
        });
    }

    return { _tabs: tabs };
}

export default connect(_mapStateToProps)(SettingsDialog);
