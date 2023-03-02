/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';

import { IReduxState } from '../../../app/types';
import {
    IconBell,
    IconCalendar,
    IconGear,
    IconHost,
    IconShortcuts,
    IconUser,
    IconVolumeUp
} from '../../../base/icons/svg';
import { connect } from '../../../base/redux/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import DialogWithTabs, { IDialogTab } from '../../../base/ui/components/web/DialogWithTabs';
import { isCalendarEnabled } from '../../../calendar-sync/functions.web';
import {
    DeviceSelection,
    getDeviceSelectionDialogProps,
    submitDeviceSelectionTab
    // @ts-ignore
} from '../../../device-selection';
import {
    submitModeratorTab,
    submitMoreTab,
    submitNotificationsTab,
    submitProfileTab,
    submitShortcutsTab
} from '../../actions';
import { SETTINGS_TABS } from '../../constants';
import {
    getModeratorTabProps,
    getMoreTabProps,
    getNotificationsMap,
    getNotificationsTabProps,
    getProfileTabProps,
    getShortcutsTabProps
} from '../../functions';

// @ts-ignore
import CalendarTab from './CalendarTab';
import ModeratorTab from './ModeratorTab';
import MoreTab from './MoreTab';
import NotificationsTab from './NotificationsTab';
import ProfileTab from './ProfileTab';
import ShortcutsTab from './ShortcutsTab';
/* eslint-enable lines-around-comment */

/**
 * The type of the React {@code Component} props of
 * {@link ConnectedSettingsDialog}.
 */
interface IProps {

    /**
     * Information about the tabs to be rendered.
     */
    _tabs: IDialogTab[];

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
const styles = (theme: Theme) => {
    return {
        settingsDialog: {
            display: 'flex',
            width: '100%',

            '& .auth-name': {
                marginBottom: theme.spacing(1)
            },

            '& .calendar-tab, & .device-selection': {
                marginTop: '20px'
            },

            '& .mock-atlaskit-label': {
                color: '#b8c7e0',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.33,
                padding: `20px 0px ${theme.spacing(1)} 0px`
            },

            '& .checkbox-label': {
                color: theme.palette.text01,
                ...withPixelLineHeight(theme.typography.bodyShortRegular),
                marginBottom: theme.spacing(2),
                display: 'block',
                marginTop: '20px'
            },

            '& input[type="checkbox"]:checked + svg': {
                '--checkbox-background-color': '#6492e7',
                '--checkbox-border-color': '#6492e7'
            },

            '& input[type="checkbox"] + svg + span': {
                color: '#9FB0CC'
            },

            // @ts-ignore
            [[ '& .calendar-tab',
                '& .more-tab',
                '& .box' ]]: {
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
            },

            '& .settings-sub-pane': {
                flex: 1
            },

            '& .settings-sub-pane .right': {
                flex: 1
            },
            '& .settings-sub-pane .left': {
                flex: 1
            },

            '& .settings-sub-pane-element': {
                textAlign: 'left',
                flex: 1
            },

            '& .dropdown-menu': {
                marginTop: '20px'
            },

            '& .settings-checkbox': {
                display: 'flex',
                marginBottom: theme.spacing(3)
            },

            '& .calendar-tab': {
                alignItems: 'center',
                flexDirection: 'column',
                fontSize: '14px',
                minHeight: '100px',
                textAlign: 'center'
            },

            '& .calendar-tab-sign-in': {
                marginTop: '20px'
            },

            '& .sign-out-cta': {
                marginBottom: '20px'
            },

            '& .sign-out-cta-button': {
                display: 'flex',
                justifyContent: 'center'
            },

            '@media only screen and (max-width: 700px)': {
                '& .device-selection': {
                    display: 'flex',
                    flexDirection: 'column'
                },

                '& .more-tab': {
                    flexDirection: 'column'
                }
            }
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
    const tabs: IDialogTab[] = [];

    if (showDeviceSettings) {
        tabs.push({
            name: SETTINGS_TABS.DEVICES,
            component: DeviceSelection,
            labelKey: 'settings.devices',
            props: getDeviceSelectionDialogProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (tabState: any, newProps: any) => {
                // Ensure the device selection tab gets updated when new devices
                // are found by taking the new props and only preserving the
                // current user selected devices. If this were not done, the
                // tab would keep using a copy of the initial props it received,
                // leaving the device list to become stale.

                return {
                    ...newProps,
                    selectedAudioInputId: tabState.selectedAudioInputId,
                    selectedAudioOutputId: tabState.selectedAudioOutputId,
                    selectedVideoInputId: tabState.selectedVideoInputId
                };
            },
            className: `settings-pane ${classes.settingsDialog} devices-pane`,
            submit: (newState: any) => submitDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            icon: IconVolumeUp
        });
    }

    if (showSoundsSettings || showNotificationsSettings) {
        tabs.push({
            name: SETTINGS_TABS.NOTIFICATIONS,
            component: NotificationsTab,
            labelKey: 'settings.notifications',
            propsUpdateFunction: (tabState: any, newProps: any) => {
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
            propsUpdateFunction: (tabState: any, newProps: any) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    followMeEnabled: tabState?.followMeEnabled,
                    startAudioMuted: tabState?.startAudioMuted,
                    startVideoMuted: tabState?.startVideoMuted,
                    startReactionsMuted: tabState?.startReactionsMuted
                };
            },
            className: `settings-pane ${classes.settingsDialog} moderator-pane`,
            submit: submitModeratorTab,
            icon: IconHost
        });
    }

    if (showProfileSettings) {
        tabs.push({
            name: SETTINGS_TABS.PROFILE,
            component: ProfileTab,
            labelKey: 'profile.title',
            props: getProfileTabProps(state),
            className: `settings-pane ${classes.settingsDialog} profile-pane`,
            submit: submitProfileTab,
            icon: IconUser
        });
    }

    if (showCalendarSettings) {
        tabs.push({
            name: SETTINGS_TABS.CALENDAR,
            component: CalendarTab,
            labelKey: 'settings.calendar.title',
            className: `settings-pane ${classes.settingsDialog} calendar-pane`,
            icon: IconCalendar
        });
    }

    tabs.push({
        name: SETTINGS_TABS.SHORTCUTS,
        component: ShortcutsTab,
        labelKey: 'settings.shortcuts',
        props: getShortcutsTabProps(state, isDisplayedOnWelcomePage),
        propsUpdateFunction: (tabState: any, newProps: any) => {
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

            // @ts-ignore
            component: MoreTab,
            labelKey: 'settings.more',
            props: moreTabProps,
            propsUpdateFunction: (tabState: any, newProps: any) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    currentFramerate: tabState?.currentFramerate,
                    currentLanguage: tabState?.currentLanguage,
                    hideSelfView: tabState?.hideSelfView,
                    showPrejoinPage: tabState?.showPrejoinPage,
                    maxStageParticipants: tabState?.maxStageParticipants
                };
            },
            className: `settings-pane ${classes.settingsDialog} more-pane`,
            submit: submitMoreTab,
            icon: IconGear
        });
    }

    return { _tabs: tabs };
}

export default withStyles(styles)(connect(_mapStateToProps)(SettingsDialog));
