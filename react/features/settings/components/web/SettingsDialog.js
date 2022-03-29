// @flow

import { withStyles } from '@material-ui/styles';
import React, { Component } from 'react';

import { getAvailableDevices } from '../../../base/devices';
import { DialogWithTabs, hideDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { isCalendarEnabled } from '../../../calendar-sync';
import {
    DeviceSelection,
    getDeviceSelectionDialogProps,
    submitDeviceSelectionTab
} from '../../../device-selection';
import {
    submitModeratorTab,
    submitMoreTab,
    submitProfileTab,
    submitSoundsTab
} from '../../actions';
import { SETTINGS_TABS } from '../../constants';
import {
    getModeratorTabProps,
    getMoreTabProps,
    getProfileTabProps,
    getSoundsTabProps
} from '../../functions';

import CalendarTab from './CalendarTab';
import ModeratorTab from './ModeratorTab';
import MoreTab from './MoreTab';
import ProfileTab from './ProfileTab';
import SoundsTab from './SoundsTab';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of
 * {@link ConnectedSettingsDialog}.
 */
type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: string,

    /**
     * Information about the tabs to be rendered.
     */
    _tabs: Array<Object>,

    /**
     * Invoked to save changed settings.
     */
    dispatch: Function
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        settingsDialog: {
            display: 'flex',
            width: '100%',

            '&.profile-pane': {
                flexDirection: 'column'
            },

            '& .auth-name': {
                marginBottom: `${theme.spacing(1)}px`
            },

            '& .calendar-tab, & .device-selection': {
                marginTop: '20px'
            },

            '& .mock-atlaskit-label': {
                color: '#b8c7e0',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.33,
                padding: `20px 0px ${theme.spacing(1)}px 0px`
            },

            '& input[type="checkbox"]:checked + svg': {
                '--checkbox-background-color': '#6492e7',
                '--checkbox-border-color': '#6492e7'
            },

            '& input[type="checkbox"] + svg + span': {
                color: '#9FB0CC'
            },

            [[ '& .calendar-tab',
                '& .more-tab',
                '& .box' ]]: {
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
            },

            '& .profile-edit': {
                display: 'flex',
                width: '100%'
            },

            '& .profile-edit-field': {
                flex: 0.5,
                marginRight: '20px'
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

            '& .moderator-settings-wrapper': {
                paddingTop: '20px'
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
class SettingsDialog extends Component<Props> {
    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._closeDialog = this._closeDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _tabs, defaultTab, dispatch } = this.props;
        const onSubmit = this._closeDialog;
        const defaultTabIdx
            = _tabs.findIndex(({ name }) => name === defaultTab);
        const tabs = _tabs.map(tab => {
            return {
                ...tab,
                onMount: tab.onMount
                    ? (...args) => dispatch(tab.onMount(...args))
                    : undefined,
                submit: (...args) => tab.submit
                    && dispatch(tab.submit(...args))
            };
        });

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = 'settings-dialog'
                defaultTab = {
                    defaultTabIdx === -1 ? undefined : defaultTabIdx
                }
                onSubmit = { onSubmit }
                tabs = { tabs }
                titleKey = 'settings.title' />
        );
    }

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        this.props.dispatch(hideDialog());
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
function _mapStateToProps(state, ownProps) {
    const { classes } = ownProps;
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];

    // The settings sections to display.
    const showDeviceSettings = configuredTabs.includes('devices');
    const moreTabProps = getMoreTabProps(state);
    const moderatorTabProps = getModeratorTabProps(state);
    const { showModeratorSettings } = moderatorTabProps;
    const { showLanguageSettings, showNotificationsSettings, showPrejoinSettings } = moreTabProps;
    const showMoreTab = showLanguageSettings || showNotificationsSettings || showPrejoinSettings;
    const showProfileSettings
        = configuredTabs.includes('profile') && !state['features/base/config'].disableProfile;
    const showCalendarSettings
        = configuredTabs.includes('calendar') && isCalendarEnabled(state);
    const showSoundsSettings = configuredTabs.includes('sounds');
    const tabs = [];

    if (showDeviceSettings) {
        tabs.push({
            name: SETTINGS_TABS.DEVICES,
            component: DeviceSelection,
            label: 'settings.devices',
            onMount: getAvailableDevices,
            props: getDeviceSelectionDialogProps(state),
            propsUpdateFunction: (tabState, newProps) => {
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
            styles: `settings-pane ${classes.settingsDialog} devices-pane`,
            submit: submitDeviceSelectionTab
        });
    }

    if (showProfileSettings) {
        tabs.push({
            name: SETTINGS_TABS.PROFILE,
            component: ProfileTab,
            label: 'profile.title',
            props: getProfileTabProps(state),
            styles: `settings-pane ${classes.settingsDialog} profile-pane`,
            submit: submitProfileTab
        });
    }

    if (showModeratorSettings) {
        tabs.push({
            name: SETTINGS_TABS.MODERATOR,
            component: ModeratorTab,
            label: 'settings.moderator',
            props: moderatorTabProps,
            propsUpdateFunction: (tabState, newProps) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    followMeEnabled: tabState?.followMeEnabled,
                    startAudioMuted: tabState?.startAudioMuted,
                    startVideoMuted: tabState?.startVideoMuted,
                    startReactionsMuted: tabState?.startReactionsMuted
                };
            },
            styles: `settings-pane ${classes.settingsDialog} moderator-pane`,
            submit: submitModeratorTab
        });
    }

    if (showCalendarSettings) {
        tabs.push({
            name: SETTINGS_TABS.CALENDAR,
            component: CalendarTab,
            label: 'settings-pane settings.calendar.title',
            styles: `${classes.settingsDialog} calendar-pane`
        });
    }

    if (showSoundsSettings) {
        tabs.push({
            name: SETTINGS_TABS.SOUNDS,
            component: SoundsTab,
            label: 'settings.sounds',
            props: getSoundsTabProps(state),
            styles: `settings-pane ${classes.settingsDialog} profile-pane`,
            submit: submitSoundsTab
        });
    }

    if (showMoreTab) {
        tabs.push({
            name: SETTINGS_TABS.MORE,
            component: MoreTab,
            label: 'settings.more',
            props: moreTabProps,
            propsUpdateFunction: (tabState, newProps) => {
                // Updates tab props, keeping users selection

                return {
                    ...newProps,
                    currentFramerate: tabState?.currentFramerate,
                    currentLanguage: tabState?.currentLanguage,
                    hideSelfView: tabState?.hideSelfView,
                    showPrejoinPage: tabState?.showPrejoinPage,
                    enabledNotifications: tabState?.enabledNotifications
                };
            },
            styles: `settings-pane ${classes.settingsDialog} more-pane`,
            submit: submitMoreTab
        });
    }

    return { _tabs: tabs };
}

export default withStyles(styles)(connect(_mapStateToProps)(SettingsDialog));
