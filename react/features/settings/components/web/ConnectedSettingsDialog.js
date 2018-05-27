// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import UIEvents from '../../../../../service/UI/UIEvents';

import {
    sendAnalytics,
    createProfilePanelButtonEvent
} from '../../../analytics';
import { hideDialog } from '../../../base/dialog';
import { setFollowMe, setStartMutedPolicy } from '../../../base/conference';
import {
    getAudioOutputDeviceId,
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../../../base/devices';
import { DEFAULT_LANGUAGE, translate } from '../../../base/i18n';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    PARTICIPANT_ROLE
} from '../../../base/participants';

import SettingsDialog from './SettingsDialog';
import type { Props as SettingsDialogProps } from './SettingsDialog';

declare var APP: Object;
declare var interfaceConfig: Object;

type Props = SettingsDialogProps & {

    /**
     * Invoked to save changed settings.
     */
    dispatch: Function,

    /**
     * The object resposible for maintaining translation state.
     */
    i18n: Object,
};

/**
 * A React {@code Component} for displaying a dialog to modify local settings
 * and conference-wide (moderator) settings. This version is connected to
 * redux to get the current settings.
 *
 * @extends Component
 */
class ConnectedSettingsDialog extends Component<Props> {
    /**
     * Initializes a new {@code ConnectedSettingsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedSettingsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        this._onAuthToggle = this._onAuthToggle.bind(this);
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <SettingsDialog
                { ...this.props }
                language = { this.props.i18n.language || DEFAULT_LANGUAGE }
                onAuthToggle = { this._onAuthToggle }
                onCancel = { this._onCloseDialog }
                onSubmit = { this._onSubmit } />
        );
    }

    _onCloseDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _onCloseDialog() {
        this.props.dispatch(hideDialog());
    }

    _onAuthToggle: () => void;

    /**
     * Shows the dialog for logging in or out of a server and closes this
     * dialog.
     *
     * @private
     * @returns {void}
     */
    _onAuthToggle() {
        if (this.props.authLogin) {
            sendAnalytics(createProfilePanelButtonEvent('logout.button'));

            APP.UI.messageHandler.openTwoButtonDialog({
                leftButtonKey: 'dialog.Yes',
                msgKey: 'dialog.logoutQuestion',
                submitFunction(evt, yes) {
                    if (yes) {
                        APP.UI.emitEvent(UIEvents.LOGOUT);
                    }
                },
                titleKey: 'dialog.logoutTitle'
            });
        } else {
            sendAnalytics(createProfilePanelButtonEvent('login.button'));

            APP.UI.emitEvent(UIEvents.AUTH_CLICKED);
        }

        this._onCloseDialog();
    }

    _onSubmit: () => boolean;

    /**
     * Callback invoked on modal submit to save any changed settings.
     *
     * @param {Object} newSettings - The settings specified by the user.
     * @private
     * @returns {boolean} True to close the modal.
     */
    _onSubmit(newSettings) {
        if (newSettings.displayName !== this.props.displayName) {
            APP.conference.changeLocalDisplayName(newSettings.displayName);
        }

        if (newSettings.email !== this.props.email) {
            APP.conference.changeLocalEmail(newSettings.email);
        }

        if (newSettings.followMe !== this.props.followMe) {
            this.props.dispatch(setFollowMe(newSettings.followMe));
        }

        if (newSettings.startAudioMuted !== this.props.startAudioMuted
            || newSettings.startVideoMuted !== this.props.startVideoMuted) {
            this.props.dispatch(setStartMutedPolicy(
                newSettings.startAudioMuted, newSettings.startVideoMuted));
        }

        if (newSettings.language !== this.props.i18n.language) {
            this.props.i18n.changeLanguage(newSettings.language);
        }

        if (newSettings.selectedVideoInputId
            && newSettings.selectedVideoInputId
                !== this.props.currentVideoInputId) {
            this.props.dispatch(
                setVideoInputDevice(newSettings.selectedVideoInputId));
        }

        if (newSettings.selectedAudioInputId
                && newSettings.selectedAudioInputId
                  !== this.props.currentAudioInputId) {
            this.props.dispatch(
                setAudioInputDevice(newSettings.selectedAudioInputId));
        }

        if (newSettings.selectedAudioOutputId
                && newSettings.selectedAudioOutputId
                    !== this.props.currentAudioOutputId) {
            this.props.dispatch(
                setAudioOutputDevice(newSettings.selectedAudioOutputId));
        }

        this._onCloseDialog();
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code SettingsDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     authEnabled: boolean,
 *     authLogin: string,
 *     availableDevices: Array,
 *     currentAudioInputId: string,
 *     currentAudioOutputId: string,
 *     currentVideoInputId: string,
 *     disableAudioInputChange: boolean,
 *     disableDeviceChange: boolean,
 *     displayName: string,
 *     email: string,
 *     followMe: boolean,
 *     hasAudioPermission: Function,
 *     hasVideoPermission: Function,
 *     hideAudioInputPreview: boolean,
 *     hideAudioOutputSelect: boolean,
 *     showDeviceSettings: boolean,
 *     showLanguageSettings: boolean,
 *     showModeratorSettings: boolean,
 *     showProfileSettings: boolean,
 *     startAudioMuted: boolean,
 *     startVideoMuted: boolean
 * }}
 */
function _mapStateToProps(state) {
    const conference = state['features/base/conference'];
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];
    const jwt = state['features/base/jwt'];
    const localParticipant = getLocalParticipant(state);
    const settings = state['features/base/settings'];

    return {
        authEnabled: conference.authEnabled,
        authLogin: conference.authLogin,
        displayName: localParticipant.name,
        email: localParticipant.email,
        followMe: Boolean(conference.followMeEnabled),
        startAudioMuted: Boolean(conference.startAudioMutedPolicy),
        startVideoMuted: Boolean(conference.startVideoMutedPolicy),

        // Props used for device selection
        availableDevices: state['features/base/devices'],
        currentAudioInputId: settings.micDeviceId,
        currentAudioOutputId: getAudioOutputDeviceId(),
        currentVideoInputId: settings.cameraDeviceId,
        disableAudioInputChange:
            !JitsiMeetJS.isMultipleAudioInputSupported(),
        disableDeviceChange:
            !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
        hasAudioPermission: JitsiMeetJS.mediaDevices
            .isDevicePermissionGranted.bind(null, 'audio'),
        hasVideoPermission: JitsiMeetJS.mediaDevices
            .isDevicePermissionGranted.bind(null, 'video'),
        hideAudioInputPreview:
            !JitsiMeetJS.isCollectingLocalStats(),
        hideAudioOutputSelect: !JitsiMeetJS.mediaDevices
                            .isDeviceChangeAvailable('output'),

        // The settings sections to display.
        showDeviceSettings: configuredTabs.includes('devices'),
        showLanguageSettings: configuredTabs.includes('language'),
        showModeratorSettings: configuredTabs.includes('moderator')
            && localParticipant.role === PARTICIPANT_ROLE.MODERATOR,
        showProfileSettings: configuredTabs.includes('profile') && jwt.isGuest
    };
}

export default translate(connect(_mapStateToProps)(ConnectedSettingsDialog));
