import { withStyles } from '@mui/styles';
import React, { Component } from 'react';

import { IReduxState } from '../../../app/types';
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
import { connect } from '../../../base/redux/functions';
import DialogWithTabs, { IDialogTab } from '../../../base/ui/components/web/DialogWithTabs';
import { isCalendarEnabled } from '../../../calendar-sync/functions.web';
import { submitAudioDeviceSelectionTab, submitVideoDeviceSelectionTab } from '../../../device-selection/actions.web';
import AudioDevicesSelection from '../../../device-selection/components/AudioDevicesSelection';
import VideoDeviceSelection from '../../../device-selection/components/VideoDeviceSelection';
import {
    getAudioDeviceSelectionDialogProps,
    getVideoDeviceSelectionDialogProps
} from '../../../device-selection/functions.web';
import { checkBlurSupport } from '../../../virtual-background/functions';
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
     * An object containing the CSS classes.
     */
    classes: Object;

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: string;

    /**
     * Invoked to save changed settings.
     */
    dispatch: Function;

    /**
     * Indicates whether the device selection dialog is displayed on the
     * welcome page or not.
     */
    isDisplayedOnWelcomePage: boolean;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        settingsDialog: {
            display: 'flex',
            width: '100%'
        }
    };
};

/**
 * A React {@code Component} for displaying a dialog to modify local settings
 * and conference-wide (moderator) settings. This version is connected to
 * redux to get the current settings.
 *
 * @augments Component
 */
class SettingsDialog extends Component<IProps> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _tabs, defaultTab, dispatch } = this.props;
        const correctDefaultTab = _tabs.find(tab => tab.name === defaultTab)?.name;
        const tabs = _tabs.map(tab => {
            return {
                ...tab,
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
    }
}

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
    const { classes, isDisplayedOnWelcomePage } = ownProps;
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
    const tabs: IDialogTab<any>[] = [];

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
            className: `settings-pane ${classes.settingsDialog}`,
            submit: (newState: any) => submitAudioDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            icon: IconVolumeUp
        });
        tabs.push({
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
            className: `settings-pane ${classes.settingsDialog}`,
            submit: (newState: any) => submitVideoDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            icon: IconVideo
        });
    }

    if (virtualBackgroundSupported) {
        tabs.push({
            name: SETTINGS_TABS.VIRTUAL_BACKGROUND,
            component: VirtualBackgroundTab,
            labelKey: 'virtualBackground.title',
            props: getVirtualBackgroundTabProps(state),
            className: `settings-pane ${classes.settingsDialog}`,
            submit: (newState: any) => submitVirtualBackgroundTab(newState),
            cancel: () => {
                const { _virtualBackground } = getVirtualBackgroundTabProps(state);

                return submitVirtualBackgroundTab({
                    options: {
                        backgroundType: _virtualBackground.backgroundType,
                        enabled: _virtualBackground.backgroundEffectEnabled,
                        url: _virtualBackground.virtualSource,
                        selectedThumbnail: _virtualBackground.selectedThumbnail,
                        blurValue: _virtualBackground.blurValue
                    }
                }, true);
            },
            icon: IconImage
        });
    }

    if (showSoundsSettings || showNotificationsSettings) {
        tabs.push({
            name: SETTINGS_TABS.NOTIFICATIONS,
            component: NotificationsTab,
            labelKey: 'settings.notifications',
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getNotificationsTabProps>) => {
                return {
                    ...newProps,
                    enabledNotifications: tabState?.enabledNotifications || {}
                };
            },
            props: getNotificationsTabProps(state, showSoundsSettings),
            className: `settings-pane ${classes.settingsDialog}`,
            submit: submitNotificationsTab,
            icon: IconBell
        });
    }

    if (showModeratorSettings) {
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
            className: `settings-pane ${classes.settingsDialog}`,
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
            className: `settings-pane ${classes.settingsDialog}`,
            submit: submitProfileTab,
            icon: IconUser
        });
    }

    if (showCalendarSettings) {
        tabs.push({
            name: SETTINGS_TABS.CALENDAR,
            component: CalendarTab,
            labelKey: 'settings.calendar.title',
            className: `settings-pane ${classes.settingsDialog}`,
            icon: IconCalendar
        });
    }

    tabs.push({
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
        className: `settings-pane ${classes.settingsDialog}`,
        submit: submitShortcutsTab,
        icon: IconShortcuts
    });

    if (showMoreTab) {
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
            className: `settings-pane ${classes.settingsDialog}`,
            submit: submitMoreTab,
            icon: IconGear
        });
    }

    return { _tabs: tabs };
}

export default withStyles(styles)(connect(_mapStateToProps)(SettingsDialog));
