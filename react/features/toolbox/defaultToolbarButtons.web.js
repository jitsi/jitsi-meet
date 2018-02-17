// @flow

import React from 'react';

import {
    ACTION_SHORTCUT_TRIGGERED as TRIGGERED,
    AUDIO_MUTE,
    VIDEO_MUTE,
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../analytics';
import { ParticipantCounter } from '../contact-list';
import { openDeviceSelectionDialog } from '../device-selection';
import { InfoDialogButton } from '../invite';
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
                // TODO: Why is this different from the code which handles
                // a keyboard shortcut?
                const newVideoMutedState = !APP.conference.isLocalVideoMuted();

                // The 'enable' attribute in the event is set to true if the
                // button click triggered a mute action, and set to false if it
                // triggered an unmute action.
                sendAnalytics(createToolbarEvent(
                    VIDEO_MUTE,
                    {
                        enable: newVideoMutedState
                    }));
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

                // The 'enable' attribute in the event is set to true if the
                // shortcut triggered a mute action, and set to false if it
                // triggered an unmute action.
                sendAnalytics(createShortcutEvent(
                    VIDEO_MUTE,
                    TRIGGERED,
                    { enable: !APP.conference.isLocalVideoMuted() }));
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
                // The 'enable' attribute is set to true if the click resulted
                // in the chat panel being shown, and to false if it was hidden.
                sendAnalytics(createToolbarEvent(
                    'toggle.chat',
                    {
                        enable: !APP.UI.isChatVisible()
                    }));
                APP.UI.emitEvent(UIEvents.TOGGLE_CHAT);
            },
            shortcut: 'C',
            shortcutAttr: 'toggleChatPopover',
            shortcutFunc() {
                // The 'enable' attribute is set to true if the shortcut
                // resulted in the chat panel being shown, and to false if it
                // was hidden.
                sendAnalytics(createShortcutEvent(
                    'toggle.chat',
                    {
                        enable: !APP.UI.isChatVisible()
                    }));
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
                // TODO: Include an 'enable' attribute which specifies whether
                // the contacts panel was shown or hidden.
                sendAnalytics(createToolbarEvent('contacts'));
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
                // TODO: Why is the button clicked handled differently that
                // a keyboard shortcut press (firing a TOGGLE_SCREENSHARING
                // event vs. directly calling toggleScreenSharing())?
                sendAnalytics(createToolbarEvent(
                    'screen.sharing',
                    {
                        enable: !APP.conference.isSharingScreen
                    }));
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
                // The 'enable' attribute is set to true if pressing the
                // shortcut resulted in screen sharing being enabled, and false
                // if it resulted in screen sharing being disabled.
                sendAnalytics(createShortcutEvent(
                    'toggle.screen.sharing',
                    TRIGGERED,
                    { enable: !APP.conference.isSharingScreen }));

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
                sendAnalytics(
                    createToolbarEvent('filmstrip.only.device.selection'));

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
                sendAnalytics(createToolbarEvent('dialpad'));
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
                // The 'enable' attribute is set to true if the click resulted
                // in the etherpad panel being shown, or false it it was hidden.
                sendAnalytics(createToolbarEvent(
                    'toggle.etherpad',
                    {
                        enable: !APP.UI.isEtherpadVisible()
                    }));
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
                // TODO: why is the fullscreen button handled differently than
                // the fullscreen keyboard shortcut (one results in a direct
                // call to toggleFullScreen, while the other fires an
                // UIEvents.TOGGLE_FULLSCREEN event)?

                // The 'enable' attribute is set to true if the action resulted
                // in fullscreen mode being enabled.
                sendAnalytics(createToolbarEvent(
                    'toggle.fullscreen',
                        {
                            enable: !APP.UI.isFullScreen()
                        }));

                APP.UI.emitEvent(UIEvents.TOGGLE_FULLSCREEN);
            },
            shortcut: 'S',
            shortcutAttr: 'toggleFullscreenPopover',
            shortcutDescription: 'keyboardShortcuts.fullScreen',
            shortcutFunc() {
                // The 'enable' attribute is set to true if the action resulted
                // in fullscreen mode being enabled.
                sendAnalytics(createShortcutEvent(
                    'toggle.fullscreen',
                    {
                        enable: !APP.UI.isFullScreen()
                    }));
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
                sendAnalytics(createToolbarEvent('hangup'));
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
         * The descriptor of the microphone toolbar button.
         */
        microphone: {
            classNames: [ 'button', 'icon-microphone' ],
            enabled: true,
            isDisplayed: () => true,
            id: 'toolbar_button_mute',
            onClick() {
                const sharedVideoManager = APP.UI.getSharedVideoManager();

                // TODO: Clicking the mute button and pressing the mute shortcut
                // could be handled in a uniform manner. The code below checks
                // the mute status and fires the appropriate event (MUTED or
                // UNMUTED), while the code which handles the keyboard shortcut
                // calls toggleAudioMuted(). Also strangely the the user is
                // only warned if they click the button (and not if they use
                // the shortcut).
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
                        sendAnalytics(createToolbarEvent(
                            AUDIO_MUTE,
                            { enable: false }));
                        APP.UI.emitEvent(UIEvents.AUDIO_MUTED, false, true);
                    }
                } else {
                    sendAnalytics(createToolbarEvent(
                        AUDIO_MUTE,
                        { enable: true }));
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
                // The 'enable' attribute in the event is set to true if the
                // shortcut triggered a mute action, and set to false if it
                // triggered an unmute action.
                sendAnalytics(createShortcutEvent(
                    AUDIO_MUTE,
                    TRIGGERED,
                    { enable: !APP.conference.isLocalAudioMuted() }));
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
                // TODO: reduce duplication with shortcutFunc below.

                // The 'enable' attribute is set to true if the pressing of the
                // shortcut resulted in the hand being raised, and to false
                // if it resulted in the hand being 'lowered'.
                sendAnalytics(createToolbarEvent(
                    'raise.hand',
                    { enable: !APP.conference.isHandRaised }));
                APP.conference.maybeToggleRaisedHand();
            },
            shortcut: 'R',
            shortcutAttr: 'raiseHandPopover',
            shortcutDescription: 'keyboardShortcuts.raiseHand',
            shortcutFunc() {
                // The 'enable' attribute is set to true if the pressing of the
                // shortcut resulted in the hand being raised, and to false
                // if it resulted in the hand being 'lowered'.
                sendAnalytics(createShortcutEvent(
                    'toggle.raise.hand',
                    TRIGGERED,
                    { enable: !APP.conference.isHandRaised }));
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
                // TODO: Include an 'enable' attribute which specifies whether
                // the settings panel was shown or hidden.
                sendAnalytics(createToolbarEvent('settings'));
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
                // The 'enable' attribute is set to true if the click resulted
                // in the "start sharing video" dialog being shown, and false
                // if it resulted in the "stop sharing video" dialog being
                // shown.
                sendAnalytics(createToolbarEvent(
                    'shared.video.toggled',
                    {
                        enable: !APP.UI.isSharedVideoShown()
                    }));
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
