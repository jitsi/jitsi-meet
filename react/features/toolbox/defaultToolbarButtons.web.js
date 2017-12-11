// @flow

import React from 'react';

import {
    SHORTCUT_AUDIO_MUTE_TOGGLED,
    SHORTCUT_CHAT_TOGGLED,
    SHORTCUT_RAISE_HAND_CLICKED,
    SHORTCUT_SCREEN_TOGGLED,
    SHORTCUT_VIDEO_MUTE_TOGGLED,
    TOOLBAR_AUDIO_MUTED,
    TOOLBAR_AUDIO_UNMUTED,
    TOOLBAR_CHAT_TOGGLED,
    TOOLBAR_CONTACTS_TOGGLED,
    TOOLBAR_ETHERPACK_CLICKED,
    TOOLBAR_FILMSTRIP_ONLY_DEVICE_SELECTION_TOGGLED,
    TOOLBAR_FULLSCREEN_ENABLED,
    TOOLBAR_HANGUP,
    TOOLBAR_INVITE_CLICKED,
    TOOLBAR_RAISE_HAND_CLICKED,
    TOOLBAR_SCREEN_DISABLED,
    TOOLBAR_SCREEN_ENABLED,
    TOOLBAR_SETTINGS_TOGGLED,
    TOOLBAR_SHARED_VIDEO_CLICKED,
    TOOLBAR_SIP_DIALPAD_CLICKED,
    TOOLBAR_VIDEO_DISABLED,
    TOOLBAR_VIDEO_ENABLED,
    sendAnalyticsEvent
} from '../analytics';
import { ParticipantCounter } from '../contact-list';
import { openDeviceSelectionDialog } from '../device-selection';
import { InfoDialogButton, openInviteDialog } from '../invite';
import UIEvents from '../../../service/UI/UIEvents';
import { VideoQualityButton } from '../video-quality';

import ProfileButton from './components/ProfileButton';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * The cache of {@link getDefaultButtons()}.
 */
let defaultButtons: Object;

/**
 * Returns a map of all button descriptors and according properties.
 *
 * @returns {Object} - The maps of default button descriptors.
 */
export default function getDefaultButtons() {
    if (defaultButtons) {
        return defaultButtons;
    }

    defaultButtons = {
        /**
         * The descriptor of the camera toolbar button.
         */
        camera: {
            classNames: [ 'button', 'icon-camera' ],
            enabled: true,
            isDisplayed: () => true,
            id: 'toolbar_button_camera',
            onClick() {
                const newVideoMutedState = !APP.conference.isLocalVideoMuted();

                if (newVideoMutedState) {
                    sendAnalyticsEvent(TOOLBAR_VIDEO_ENABLED);
                } else {
                    sendAnalyticsEvent(TOOLBAR_VIDEO_DISABLED);
                }
                APP.UI.emitEvent(UIEvents.VIDEO_MUTED, newVideoMutedState);
            },
            popups: [
                {
                    dataAttr: 'audioOnly.featureToggleDisabled',
                    dataInterpolate: { feature: 'video mute' },
                    id: 'unmuteWhileAudioOnly'
                }
            ],
            shortcut: 'V',
            shortcutAttr: 'toggleVideoPopover',
            shortcutFunc() {
                if (APP.conference.isAudioOnly()) {
                    APP.UI.emitEvent(UIEvents.VIDEO_UNMUTING_WHILE_AUDIO_ONLY);

                    return;
                }

                sendAnalyticsEvent(SHORTCUT_VIDEO_MUTE_TOGGLED);
                APP.conference.toggleVideoMuted();
            },
            shortcutDescription: 'keyboardShortcuts.videoMute',
            tooltipKey: 'toolbar.videomute'
        },

        /**
         * The descriptor of the chat toolbar button.
         */
        chat: {
            classNames: [ 'button', 'icon-chat' ],
            enabled: true,
            html: <span className = 'badge-round'>
                <span id = 'unreadMessages' /></span>,
            id: 'toolbar_button_chat',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_CHAT_TOGGLED);
                APP.UI.emitEvent(UIEvents.TOGGLE_CHAT);
            },
            shortcut: 'C',
            shortcutAttr: 'toggleChatPopover',
            shortcutFunc() {
                sendAnalyticsEvent(SHORTCUT_CHAT_TOGGLED);
                APP.UI.toggleChat();
            },
            shortcutDescription: 'keyboardShortcuts.toggleChat',
            sideContainerId: 'chat_container',
            tooltipKey: 'toolbar.chat'
        },

        /**
         * The descriptor of the contact list toolbar button.
         */
        contacts: {
            childComponent: ParticipantCounter,
            classNames: [ 'button', 'icon-contactList' ],
            enabled: true,
            id: 'toolbar_contact_list',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_CONTACTS_TOGGLED);
                APP.UI.emitEvent(UIEvents.TOGGLE_CONTACT_LIST);
            },
            sideContainerId: 'contacts_container',
            tooltipKey: 'bottomtoolbar.contactlist'
        },

        /**
         * The descriptor of the desktop sharing toolbar button.
         */
        desktop: {
            classNames: [ 'button', 'icon-share-desktop' ],
            enabled: true,
            id: 'toolbar_button_desktopsharing',
            onClick() {
                if (APP.conference.isSharingScreen) {
                    sendAnalyticsEvent(TOOLBAR_SCREEN_DISABLED);
                } else {
                    sendAnalyticsEvent(TOOLBAR_SCREEN_ENABLED);
                }
                APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
            },
            popups: [
                {
                    dataAttr: 'audioOnly.featureToggleDisabled',
                    dataInterpolate: { feature: 'screen sharing' },
                    id: 'screenshareWhileAudioOnly'
                }
            ],
            shortcut: 'D',
            shortcutAttr: 'toggleDesktopSharingPopover',
            shortcutFunc() {
                sendAnalyticsEvent(SHORTCUT_SCREEN_TOGGLED);

                // eslint-disable-next-line no-empty-function
                APP.conference.toggleScreenSharing().catch(() => {});
            },
            shortcutDescription: 'keyboardShortcuts.toggleScreensharing',
            tooltipKey: 'toolbar.sharescreen'
        },

        /**
         * The descriptor of the device selection toolbar button.
         */
        fodeviceselection: {
            classNames: [ 'button', 'icon-settings' ],
            enabled: true,
            isDisplayed() {
                return interfaceConfig.filmStripOnly;
            },
            id: 'toolbar_button_fodeviceselection',
            onClick(dispatch: Function) {
                sendAnalyticsEvent(
                    TOOLBAR_FILMSTRIP_ONLY_DEVICE_SELECTION_TOGGLED);

                dispatch(openDeviceSelectionDialog());
            },
            sideContainerId: 'settings_container',
            tooltipKey: 'toolbar.Settings'
        },

        /**
         * The descriptor of the dialpad toolbar button.
         */
        dialpad: {
            classNames: [ 'button', 'icon-dialpad' ],
            enabled: true,

            // TODO: remove it after UI.updateDTMFSupport fix
            hidden: true,
            id: 'toolbar_button_dialpad',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_SIP_DIALPAD_CLICKED);
            },
            tooltipKey: 'toolbar.dialpad'
        },

        /**
         * The descriptor of the etherpad toolbar button.
         */
        etherpad: {
            classNames: [ 'button', 'icon-share-doc' ],
            enabled: true,
            hidden: true,
            id: 'toolbar_button_etherpad',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_ETHERPACK_CLICKED);
                APP.UI.emitEvent(UIEvents.ETHERPAD_CLICKED);
            },
            tooltipKey: 'toolbar.etherpad'
        },

        /**
         * The descriptor of the toolbar button which toggles full-screen mode.
         */
        fullscreen: {
            classNames: [ 'button', 'icon-full-screen' ],
            enabled: true,
            id: 'toolbar_button_fullScreen',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_FULLSCREEN_ENABLED);

                APP.UI.emitEvent(UIEvents.TOGGLE_FULLSCREEN);
            },
            shortcut: 'S',
            shortcutAttr: 'toggleFullscreenPopover',
            shortcutDescription: 'keyboardShortcuts.fullScreen',
            shortcutFunc() {
                sendAnalyticsEvent('shortcut.fullscreen.toggled');
                APP.UI.toggleFullScreen();
            },
            tooltipKey: 'toolbar.fullscreen'
        },

        /**
         * The descriptor of the toolbar button which hangs up the
         * call/conference.
         */
        hangup: {
            classNames: [ 'button', 'icon-hangup', 'button_hangup' ],
            enabled: true,
            isDisplayed: () => true,
            id: 'toolbar_button_hangup',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_HANGUP);
                APP.UI.emitEvent(UIEvents.HANGUP);
            },
            tooltipKey: 'toolbar.hangup'
        },

        /**
         * The descriptor of the toolbar button which opens a dialog for the
         * conference URL and inviting others.
         */
        info: {
            component: InfoDialogButton
        },

        /**
         * The descriptor of the toolbar button which shows the invite user
         * dialog.
         */
        invite: {
            classNames: [ 'button', 'icon-link' ],
            enabled: true,
            id: 'toolbar_button_link',
            onClick(dispatch: Function) {
                sendAnalyticsEvent(TOOLBAR_INVITE_CLICKED);

                dispatch(openInviteDialog());
            },
            tooltipKey: 'toolbar.invite'
        },

        /**
         * The descriptor of the microphone toolbar button.
         */
        microphone: {
            classNames: [ 'button', 'icon-microphone' ],
            enabled: true,
            isDisplayed: () => true,
            id: 'toolbar_button_mute',
            onClick() {
                const sharedVideoManager = APP.UI.getSharedVideoManager();

                if (APP.conference.isLocalAudioMuted()) {
                    // If there's a shared video with the volume "on" and we
                    // aren't the video owner, we warn the user
                    // that currently it's not possible to unmute.
                    if (sharedVideoManager
                        && sharedVideoManager.isSharedVideoVolumeOn()
                        && !sharedVideoManager.isSharedVideoOwner()) {
                        APP.UI.showCustomToolbarPopup(
                            'microphone', 'unableToUnmutePopup', true, 5000);
                    } else {
                        sendAnalyticsEvent(TOOLBAR_AUDIO_UNMUTED);
                        APP.UI.emitEvent(UIEvents.AUDIO_MUTED, false, true);
                    }
                } else {
                    sendAnalyticsEvent(TOOLBAR_AUDIO_MUTED);
                    APP.UI.emitEvent(UIEvents.AUDIO_MUTED, true, true);
                }
            },
            popups: [
                {
                    dataAttr: 'toolbar.micMutedPopup',
                    id: 'micMutedPopup'
                },
                {
                    dataAttr: 'toolbar.unableToUnmutePopup',
                    id: 'unableToUnmutePopup'
                },
                {
                    dataAttr: 'toolbar.talkWhileMutedPopup',
                    id: 'talkWhileMutedPopup'
                }
            ],
            shortcut: 'M',
            shortcutAttr: 'mutePopover',
            shortcutFunc() {
                sendAnalyticsEvent(SHORTCUT_AUDIO_MUTE_TOGGLED);
                APP.conference.toggleAudioMuted();
            },
            shortcutDescription: 'keyboardShortcuts.mute',
            tooltipKey: 'toolbar.mute'
        },

        /**
         * The descriptor of the profile toolbar button.
         */
        profile: {
            component: ProfileButton,
            sideContainerId: 'profile_container'
        },

        /**
         * The descriptor of the "Raise hand" toolbar button.
         */
        raisehand: {
            classNames: [ 'button', 'icon-raised-hand' ],
            enabled: true,
            id: 'toolbar_button_raisehand',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_RAISE_HAND_CLICKED);
                APP.conference.maybeToggleRaisedHand();
            },
            shortcut: 'R',
            shortcutAttr: 'raiseHandPopover',
            shortcutDescription: 'keyboardShortcuts.raiseHand',
            shortcutFunc() {
                sendAnalyticsEvent(SHORTCUT_RAISE_HAND_CLICKED);
                APP.conference.maybeToggleRaisedHand();
            },
            tooltipKey: 'toolbar.raiseHand'
        },

        /**
         * The descriptor of the recording toolbar button. Requires additional
         * initialization in the recording module.
         */
        recording: {
            classNames: [ 'button' ],
            enabled: true,

            // will be displayed once the recording functionality is detected
            hidden: true,
            id: 'toolbar_button_record',
            tooltipKey: 'liveStreaming.buttonTooltip'
        },

        /**
         * The descriptor of the settings toolbar button.
         */
        settings: {
            classNames: [ 'button', 'icon-settings' ],
            enabled: true,
            id: 'toolbar_button_settings',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_SETTINGS_TOGGLED);
                APP.UI.emitEvent(UIEvents.TOGGLE_SETTINGS);
            },
            sideContainerId: 'settings_container',
            tooltipKey: 'toolbar.Settings'
        },

        /**
         * The descriptor of the "Share YouTube video" toolbar button.
         */
        sharedvideo: {
            classNames: [ 'button', 'icon-shared-video' ],
            enabled: true,
            id: 'toolbar_button_sharedvideo',
            onClick() {
                sendAnalyticsEvent(TOOLBAR_SHARED_VIDEO_CLICKED);
                APP.UI.emitEvent(UIEvents.SHARED_VIDEO_CLICKED);
            },
            popups: [
                {
                    dataAttr: 'toolbar.sharedVideoMutedPopup',
                    id: 'sharedVideoMutedPopup'
                }
            ],
            tooltipKey: 'toolbar.sharedvideo'
        },

        videoquality: {
            component: VideoQualityButton
        }
    };

    Object.keys(defaultButtons).forEach(name => {
        const button = defaultButtons[name];

        if (!button.isDisplayed) {
            button.isDisplayed = _isDisplayed;
        }
    });

    return defaultButtons;
}

/**
 * The default implementation of the {@code isDisplayed} method of the toolbar
 * button definition returned by {@link getDefaultButtons()}.
 *
 * @returns {boolean} If the user intarface is full i.e. not filmstrip-only,
 * then {@code true}; otherwise, {@code false}.
 */
function _isDisplayed() {
    return !interfaceConfig.filmStripOnly;
}
