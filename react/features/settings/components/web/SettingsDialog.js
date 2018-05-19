// @flow

import Tabs from '@atlaskit/tabs';
import React, { Component } from 'react';

import { StatelessDialog } from '../../../base/dialog';
import { LANGUAGES, translate } from '../../../base/i18n';
import { DeviceSelection } from '../../../device-selection';
import type { DeviceSelectionProps } from '../../../device-selection';

import { SETTINGS_TABS } from '../../constants';

import MoreTab from './MoreTab';
import type { Props as MoreTabProps } from './MoreTab';
import ProfileTab from './ProfileTab';
import type { Props as ProfileTabProps } from './ProfileTab';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * The type of the React {@code Component} props of {@link SettingsDialog}.
 */
export type Props = {
    ...$Exact<DeviceSelectionProps>,
    ...$Exact<MoreTabProps>,
    ...$Exact<ProfileTabProps>,

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: string,

    /**
     * Callback invoked to close the dialog without saving changes.
     */
    onCancel: Function,

    /**
     * Callback invoked to save settings changes.
     */
    onSubmit: Function,

    /**
     * Whether or not to display device selection.
     */
    showDeviceSettings: boolean,

    /**
     * Whether or not to display language selection.
     */
    showLanguageSettings: boolean,

    /**
     * Whether or not to display moderator options.
     */
    showModeratorSettings: boolean,

    /**
     * Whether or not to display profile editing options.
     */
    showProfileSettings: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SettingsDialog}.
 */
type State = {

    /**
     * The entered value of the local participant's display name.
     */
    displayName: string,

    /**
     * The entered valued of the local participant's email.
     */
    email: string,

    /**
     * Whether the follow me feature is enabled or disabled.
     */
    followMe: boolean,

    /**
     * The language selected for display.
     */
    language: string,

    /**
     * The value of the selected audio input device.
     */
    selectedAudioInputId: string,

    /**
     * The value of the selected audio output device.
     */
    selectedAudioOutputId: string,

    /**
     * The value of the selected video input device.
     */
    selectedVideoInputId: string,

    /**
     * Whether the start audio muted feature is enabled or disabled.
     */
    startAudioMuted: boolean,

    /**
     * Whether the start video muted feature is enabled or disabled.
     */
    startVideoMuted: boolean
};

/**
 * A React {@code Component} for displaying a dialog to modify local settings
 * and conference-wide (moderator) settings.
 *
 * @extends Component
 */
class SettingsDialog extends Component<Props, State> {
    /**
     * Initializes a new {@code SettingsDialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            displayName: this.props.displayName,
            email: this.props.email,
            followMe: this.props.followMe,
            language: this.props.language,
            selectedAudioInputId: this.props.currentAudioInputId,
            selectedAudioOutputId: this.props.currentAudioOutputId,
            selectedVideoInputId: this.props.currentVideoInputId,
            startAudioMuted: this.props.startAudioMuted,
            startVideoMuted: this.props.startVideoMuted
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onAudioInputChange = this._onAudioInputChange.bind(this);
        this._onAudioOutputChange = this._onAudioOutputChange.bind(this);
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onEmailChange = this._onEmailChange.bind(this);
        this._onFollowMeChange = this._onFollowMeChange.bind(this);
        this._onLanguageSelected = this._onLanguageSelected.bind(this);
        this._onStartAudioMutedChange
            = this._onStartAudioMutedChange.bind(this);
        this._onStartVideoMutedChange
            = this._onStartVideoMutedChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onVideoInputChange = this._onVideoInputChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const tabs = this._getTabs();
        let content;

        if (tabs.length > 1) {
            content = <Tabs tabs = { tabs } />;
        } else if (tabs.length === 1) {
            content = tabs[0].content;
        } else {
            content = null;

            logger.warn('No settings tabs configured to display.');
        }

        return (
            <StatelessDialog
                disableBlanketClickDismiss
                    = { this.props.disableBlanketClickDismiss }
                onCancel = { this.props.onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'settings.title'>
                <div className = 'settings-dialog'>
                    { content }
                </div>
            </StatelessDialog>
        );
    }

    /**
     * Creates the tab configuration objects expected by Atlaskit {@code Tab}.
     *
     * @returns {Array} An array of tab configuration objects.
     */
    _getTabs() {
        const {
            defaultTab,
            showDeviceSettings,
            showLanguageSettings,
            showModeratorSettings,
            showProfileSettings,
            t
        } = this.props;
        const tabs = [];
        let defaultTabChosen = false;

        if (showDeviceSettings) {
            const defaultSelected = defaultTab === SETTINGS_TABS.DEVICES;

            defaultTabChosen = defaultTabChosen || defaultSelected;

            tabs.push({
                content: this._renderDevicesTab(),
                defaultSelected,
                label: t('settings.devices')
            });
        }

        if (showProfileSettings) {
            const defaultSelected = defaultTab === SETTINGS_TABS.PROFILE;

            defaultTabChosen = defaultTabChosen || defaultSelected;

            tabs.push({
                content: this._renderProfileTab(),
                defaultSelected,
                label: t('profile.title')
            });
        }

        if (showModeratorSettings || showLanguageSettings) {
            const defaultSelected = defaultTab === SETTINGS_TABS.MORE;

            defaultTabChosen = defaultTabChosen || defaultSelected;

            tabs.push({
                content: this._renderMoreTab(),
                defaultSelected,
                label: t('settings.more')
            });
        }

        if (tabs.length && !defaultTabChosen) {
            tabs[0].defaultSelected = true;
        }

        return tabs;
    }

    _onAudioInputChange: (string) => void;

    /**
     * Callback invoked when the preferred audio input device has been changed.
     *
     * @param {string} selectedAudioInputId - The device ID of the new preferred
     * audio input device.
     * @private
     * @returns {void}
     */
    _onAudioInputChange(selectedAudioInputId) {
        this.setState({ selectedAudioInputId });
    }

    _onAudioOutputChange: (string) => void;

    /**
     * Callback invoked when the preferred audio output device has been changed.
     *
     * @param {string} selectedAudioOutputId - The device ID of the new
     * preferred audio output device.
     * @private
     * @returns {void}
     */
    _onAudioOutputChange(selectedAudioOutputId) {
        this.setState({ selectedAudioOutputId });
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Callback invoked when the desired local display name has changed.
     *
     * @param {Object} event - The DOM event on changing the setting.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange({ target: { value } }) {
        this.setState({ displayName: value });
    }

    _onEmailChange: (Object) => void;

    /**
     * Callback invoked when the desired local email has changed.
     *
     * @param {Object} event - The DOM event on changing the setting.
     * @private
     * @returns {void}
     */
    _onEmailChange({ target: { value } }) {
        this.setState({ email: value });
    }

    _onFollowMeChange: (Object) => void;

    /**
     * Callback invoked after changing the setting to have all participants
     * automatically mimic conference behavior of the local participant.
     *
     * @param {Object} event - The DOM event on changing the setting.
     * @private
     * @returns {void}
     */
    _onFollowMeChange({ target: { checked } }) {
        this.setState({ followMe: checked });
    }

    _onLanguageSelected: (string) => void;

    /**
     * Callback invoked when a new local display language has been selected.
     *
     * @param {string} language - The code of the new language to use.
     * @private
     * @returns {void}
     */
    _onLanguageSelected(language) {
        this.setState({ language });
    }

    _onStartAudioMutedChange: (Object) => void;

    /**
     * Callback invoked after changing the setting to have all participants
     * join the conference as audio muted.
     *
     * @param {Object} event - The DOM event on changing the setting.
     * @private
     * @returns {void}
     */
    _onStartAudioMutedChange({ target: { checked } }) {
        this.setState({ startAudioMuted: checked });
    }

    _onStartVideoMutedChange: (Object) => void;

    /**
     * Callback invoked after changing the setting to have all participants
     * join the conference as video muted.
     *
     * @param {Object} event - The DOM event on changing the setting.
     * @private
     * @returns {void}
     */
    _onStartVideoMutedChange({ target: { checked } }) {
        this.setState({ startVideoMuted: checked });
    }

    _onSubmit: () => void;

    /**
     * Callback invoked to save changes to settings.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        this.props.onSubmit({ ...this.state });
    }

    _onVideoInputChange: (string) => void;

    /**
     * Callback invoked when the preferred video input device has been changed.
     *
     * @param {string} selectedVideoInputId - The device ID of the new preferred
     * video input device.
     * @private
     * @returns {void}
     */
    _onVideoInputChange(selectedVideoInputId) {
        this.setState({ selectedVideoInputId });
    }

    /**
     * Renders a React Element for device selection.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderDevicesTab() {
        return (
            <div className = 'settings-pane devices-pane'>
                <DeviceSelection
                    availableDevices = { this.props.availableDevices }
                    disableAudioInputChange
                        = { this.props.disableAudioInputChange }
                    disableDeviceChange = { this.props.disableDeviceChange }
                    hasAudioPermission = { this.props.hasAudioPermission }
                    hasVideoPermission = { this.props.hasVideoPermission }
                    hideAudioInputPreview = { this.props.hideAudioInputPreview }
                    hideAudioOutputSelect = { this.props.hideAudioOutputSelect }
                    onAudioInputChange = { this._onAudioInputChange }
                    onAudioOutputChange = { this._onAudioOutputChange }
                    onVideoInputChange = { this._onVideoInputChange }
                    selectedAudioInputId = { this.state.selectedAudioInputId }
                    selectedAudioOutputId = { this.state.selectedAudioOutputId }
                    selectedVideoInputId
                        = { this.state.selectedVideoInputId } />
            </div>
        );
    }

    /**
     * Renders a React Element for showing language and moderator settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderMoreTab() {
        return (
            <div className = 'settings-pane more-pane'>
                <MoreTab
                    currentLanguage = { this.state.language }
                    followMeEnabled = { this.state.followMe }
                    languages = { LANGUAGES }
                    onFollowMeChange = { this._onFollowMeChange }
                    onLanguageChange = { this._onLanguageSelected }
                    onStartAudioMutedChange = { this._onStartAudioMutedChange }
                    onStartVideoMutedChange = { this._onStartVideoMutedChange }
                    showLanguageSettings = { this.props.showLanguageSettings }
                    showModeratorSettings = { this.props.showModeratorSettings }
                    startAudioMutedEnabled = { this.state.startAudioMuted }
                    startVideoMutedEnabled = { this.state.startVideoMuted } />
            </div>
        );
    }

    /**
     * Renders a React Element for showing profile settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderProfileTab() {
        return (
            <div className = 'settings-pane profile-pane'>
                <ProfileTab
                    authEnabled = { this.props.authEnabled }
                    authLogin = { this.props.authLogin }
                    displayName = { this.state.displayName }
                    email = { this.state.email }
                    isGuest = { this.props.isGuest }
                    onAuthToggle = { this.props.onAuthToggle }
                    onDisplayNameChange = { this._onDisplayNameChange }
                    onEmailChange = { this._onEmailChange } />
            </div>
        );
    }
}

export default translate(SettingsDialog);
