/* global AJS, APP, $, config, interfaceConfig, JitsiMeetJS */
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';
import SideContainerToggler from "../side_pannels/SideContainerToggler";

let emitter = null;
let Toolbar;

/**
 * Handlers for toolbar buttons.
 *
 * buttonId {string}: handler {function}
 */
const buttonHandlers = {
    "toolbar_button_profile": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.profile.toggled');
        emitter.emit(UIEvents.TOGGLE_PROFILE);
    },
    "toolbar_button_mute": function () {
        let sharedVideoManager = APP.UI.getSharedVideoManager();

        if (APP.conference.audioMuted) {
            // If there's a shared video with the volume "on" and we aren't
            // the video owner, we warn the user
            // that currently it's not possible to unmute.
            if (sharedVideoManager
                && sharedVideoManager.isSharedVideoVolumeOn()
                && !sharedVideoManager.isSharedVideoOwner()) {
                APP.UI.showCustomToolbarPopup(
                    '#unableToUnmutePopup', true, 5000);
            }
            else {
                JitsiMeetJS.analytics.sendEvent('toolbar.audio.unmuted');
                emitter.emit(UIEvents.AUDIO_MUTED, false, true);
            }
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.audio.muted');
            emitter.emit(UIEvents.AUDIO_MUTED, true, true);
        }
    },
    "toolbar_button_camera": function () {
        if (APP.conference.videoMuted) {
            JitsiMeetJS.analytics.sendEvent('toolbar.video.enabled');
            emitter.emit(UIEvents.VIDEO_MUTED, false);
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.video.disabled');
            emitter.emit(UIEvents.VIDEO_MUTED, true);
        }
    },
    "toolbar_button_link": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.invite.clicked');
        emitter.emit(UIEvents.INVITE_CLICKED);
    },
    "toolbar_button_chat": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.chat.toggled');
        emitter.emit(UIEvents.TOGGLE_CHAT);
    },
    "toolbar_contact_list": function () {
        JitsiMeetJS.analytics.sendEvent(
            'toolbar.contacts.toggled');
        emitter.emit(UIEvents.TOGGLE_CONTACT_LIST);
    },
    "toolbar_button_etherpad": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.etherpad.clicked');
        emitter.emit(UIEvents.ETHERPAD_CLICKED);
    },
    "toolbar_button_sharedvideo": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.sharedvideo.clicked');
        emitter.emit(UIEvents.SHARED_VIDEO_CLICKED);
    },
    "toolbar_button_desktopsharing": function () {
        if (APP.conference.isSharingScreen) {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.disabled');
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.screen.enabled');
        }
        emitter.emit(UIEvents.TOGGLE_SCREENSHARING);
    },
    "toolbar_button_fullScreen": function() {
        JitsiMeetJS.analytics.sendEvent('toolbar.fullscreen.enabled');

        emitter.emit(UIEvents.TOGGLE_FULLSCREEN);
    },
    "toolbar_button_sip": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.clicked');
        showSipNumberInput();
    },
    "toolbar_button_dialpad": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.sip.dialpad.clicked');
        dialpadButtonClicked();
    },
    "toolbar_button_settings": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.settings.toggled');
        emitter.emit(UIEvents.TOGGLE_SETTINGS);
    },
    "toolbar_button_hangup": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.hangup');
        emitter.emit(UIEvents.HANGUP);
    },
    "toolbar_button_raisehand": function () {
        JitsiMeetJS.analytics.sendEvent('toolbar.raiseHand.clicked');
        APP.conference.maybeToggleRaisedHand();
    }
};

/**
 * All toolbars buttons description
 */
const defaultToolbarButtons = {
    'microphone': {
        id: 'toolbar_button_mute',
        tooltipKey: 'toolbar.mute',
        className: "button icon-microphone",
        shortcut: 'M',
        shortcutAttr: 'mutePopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.audiomute.toggled');
            APP.conference.toggleAudioMuted();
        },
        shortcutDescription: "keyboardShortcuts.mute",
        popups: [
            {
                id: 'micMutedPopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.micMutedPopup'
            },
            {
                id: 'unableToUnmutePopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.unableToUnmutePopup'
            },
            {
                id: 'talkWhileMutedPopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.talkWhileMutedPopup'
            }
        ],
        content: "Mute / Unmute",
        i18n: "[content]toolbar.mute"
    },
    'camera': {
        id: 'toolbar_button_camera',
        tooltipKey: 'toolbar.videomute',
        className: "button icon-camera",
        shortcut: 'V',
        shortcutAttr: 'toggleVideoPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.videomute.toggled');
            APP.conference.toggleVideoMuted();
        },
        shortcutDescription: "keyboardShortcuts.videoMute",
        content: "Start / stop camera",
        i18n: "[content]toolbar.videomute"
    },
    'desktop': {
        id: 'toolbar_button_desktopsharing',
        tooltipKey: 'toolbar.sharescreen',
        className: 'button icon-share-desktop',
        shortcut: 'D',
        shortcutAttr: 'toggleDesktopSharingPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.screen.toggled');
            APP.conference.toggleScreenSharing();
        },
        shortcutDescription: 'keyboardShortcuts.toggleScreensharing',
        content: 'Share screen',
        i18n: '[content]toolbar.sharescreen'
    },
    'invite': {
        id: 'toolbar_button_link',
        tooltipKey: 'toolbar.invite',
        className: 'button icon-link',
        content: 'Invite others',
        i18n: '[content]toolbar.invite'
    },
    'chat': {
        id: 'toolbar_button_chat',
        tooltipKey: 'toolbar.chat',
        className: 'button icon-chat',
        shortcut: 'C',
        shortcutAttr: 'toggleChatPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.chat.toggled');
            APP.UI.toggleChat();
        },
        shortcutDescription: 'keyboardShortcuts.toggleChat',
        sideContainerId: 'chat_container',
        html: `<span class="badge-round">
                   <span id="unreadMessages"></span>
               </span>`
    },
    'contacts': {
        id: 'toolbar_contact_list',
        tooltipKey: 'bottomtoolbar.contactlist',
        className: 'button icon-contactList',
        sideContainerId: 'contacts_container',
        html: `<span class="badge-round">
                   <span id="numberOfParticipants"></span>
               </span>`
    },
    'profile': {
        id: 'toolbar_button_profile',
        tooltipKey: 'profile.setDisplayNameLabel',
        className: 'button',
        sideContainerId: 'profile_container',
        html: `<img id="avatar" src="images/avatar2.png"/>`
    },
    'etherpad': {
        id: 'toolbar_button_etherpad',
        tooltipKey: 'toolbar.etherpad',
        className: 'button icon-share-doc'
    },
    'fullscreen': {
        id: 'toolbar_button_fullScreen',
        tooltipKey: 'toolbar.fullscreen',
        className: "button icon-full-screen",
        shortcut: 'S',
        shortcutAttr: 'toggleFullscreenPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.fullscreen.toggled');
            APP.UI.toggleFullScreen();
        },
        shortcutDescription: "keyboardShortcuts.fullScreen",
        content: "Enter / Exit Full Screen",
        i18n: "[content]toolbar.fullscreen"
    },
    'settings': {
        id: 'toolbar_button_settings',
        tooltipKey: 'toolbar.Settings',
        className: 'button icon-settings',
        sideContainerId: "settings_container"
    },
    'hangup': {
        id: 'toolbar_button_hangup',
        tooltipKey: 'toolbar.hangup',
        className: "button icon-hangup",
        content: "Hang Up",
        i18n: "[content]toolbar.hangup"
    },
    'raisehand': {
        id: "toolbar_button_raisehand",
        tooltipKey: 'toolbar.raiseHand',
        className: "button icon-raised-hand",
        shortcut: "R",
        shortcutAttr: "raiseHandPopover",
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent("shortcut.raisehand.clicked");
            APP.conference.maybeToggleRaisedHand();
        },
        shortcutDescription: "keyboardShortcuts.raiseHand",
        content: "Raise Hand",
        i18n: "[content]toolbar.raiseHand"
    },
    //init and btn handler: Recording.initRecordingButton (Recording.js)
    'recording': {
        id: 'toolbar_button_record',
        tooltipKey: 'liveStreaming.buttonTooltip',
        className: 'button',
        hidden: true // will be displayed once
                     // the recording functionality is detected
    },
    'sharedvideo': {
        id: 'toolbar_button_sharedvideo',
        tooltipKey: 'toolbar.sharedvideo',
        className: 'button icon-shared-video',
        popups: [
            {
                id: 'sharedVideoMutedPopup',
                className: 'loginmenu extendedToolbarPopup',
                dataAttr: '[title]toolbar.sharedVideoMutedPopup',
                dataAttrPosition: 'w'
            }
        ]
    },
    'sip': {
        id: 'toolbar_button_sip',
        tooltipKey: 'toolbar.sip',
        className: 'button icon-telephone',
        hidden: true // will be displayed once
                     // the SIP calls functionality is detected
    },
    'dialpad': {
        id: 'toolbar_button_dialpad',
        tooltipKey: 'toolbar.dialpad',
        className: 'button icon-dialpad',
        //TODO: remove it after UI.updateDTMFSupport fix
        hidden: true
    }
};

function dialpadButtonClicked() {
    //TODO show the dialpad box
}

function showSipNumberInput () {
    let defaultNumber = config.defaultSipNumber
        ? config.defaultSipNumber
        : '';
    let titleKey = "dialog.sipMsg";
    let msgString = (`
            <input class="input-control"
                   name="sipNumber" type="text"
                   value="${defaultNumber}" autofocus>`);

    APP.UI.messageHandler.openTwoButtonDialog({
        titleKey,
        msgString,
        leftButtonKey: "dialog.Dial",
        submitFunction: function (e, v, m, f) {
            if (v && f.sipNumber) {
                emitter.emit(UIEvents.SIP_DIAL, f.sipNumber);
            }
        },
        focus: ':input:first'
    });
}

/**
 * Get place for toolbar button.
 * Now it can be in main toolbar or in extended (left) toolbar
 *
 * @param btn {string}
 * @returns {string}
 */
function getToolbarButtonPlace (btn) {
    return interfaceConfig.MAIN_TOOLBAR_BUTTONS.includes(btn) ?
        'main' :
        'extended';
}

/**
 * Event handler for side toolbar container toggled event.
 *
 * @param {string} containerId - ID of the container.
 * @param {boolean} isVisible - Flag showing whether container
 * is visible.
 * @returns {void}
 */
function onSideToolbarContainerToggled(containerId, isVisible) {
    Toolbar._handleSideToolbarContainerToggled(containerId, isVisible);
}

/**
 * Event handler for local raise hand changed event.
 *
 * @param {boolean} isRaisedHand - Flag showing whether hand is raised.
 * @returns {void}
 */
function onLocalRaiseHandChanged(isRaisedHand) {
    Toolbar._setToggledState("toolbar_button_raisehand", isRaisedHand);
}

/**
 * Event handler for full screen toggled event.
 *
 * @param {boolean} isFullScreen - Flag showing whether app in full
 * screen mode.
 * @returns {void}
 */
function onFullScreenToggled(isFullScreen) {
    Toolbar._handleFullScreenToggled(isFullScreen);
}

Toolbar = {
    init (eventEmitter) {
        emitter = eventEmitter;
        // The toolbar is enabled by default.
        this.enabled = true;
        this.toolbarSelector = $("#mainToolbarContainer");
        this.extendedToolbarSelector = $("#extendedToolbar");

        // Unregister listeners in case of reinitialization.
        this.unregisterListeners();

        // Initialise the toolbar buttons.
        // The main toolbar will only take into account
        // it's own configuration from interface_config.
        this._initToolbarButtons();

        this._setShortcutsAndTooltips();

        this._setButtonHandlers();

        this.registerListeners();

        APP.UI.addListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            (popupID, show, timeout) => {
                Toolbar._showCustomToolbarPopup(popupID, show, timeout);
            });

        if(!APP.tokenData.isGuest) {
            $("#toolbar_button_profile").addClass("unclickable");
            UIUtil.removeTooltip(
                document.getElementById('toolbar_button_profile'));
        }
    },
    /**
     *  Register listeners for UI events of toolbar component.
     *
     *  @returns {void}
     */
    registerListeners() {
        APP.UI.addListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            onSideToolbarContainerToggled);

        APP.UI.addListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            onLocalRaiseHandChanged);

        APP.UI.addListener(UIEvents.FULLSCREEN_TOGGLED, onFullScreenToggled);
    },
    /**
     *  Unregisters handlers for UI events of Toolbar component.
     *
     *  @returns {void}
     */
    unregisterListeners() {
        APP.UI.removeListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            onSideToolbarContainerToggled);

        APP.UI.removeListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            onLocalRaiseHandChanged);

        APP.UI.removeListener(UIEvents.FULLSCREEN_TOGGLED,
            onFullScreenToggled);
    },
    /**
     * Enables / disables the toolbar.
     * @param {e} set to {true} to enable the toolbar or {false}
     * to disable it
     */
    enable (e) {
        this.enabled = e;
        if (!e && this.isVisible())
            this.hide(false);
    },
    /**
     * Indicates if the bottom toolbar is currently enabled.
     * @return {this.enabled}
     */
    isEnabled() {
        return this.enabled;
    },

    showEtherpadButton () {
        if (!$('#toolbar_button_etherpad').is(":visible")) {
            $('#toolbar_button_etherpad').css({display: 'inline-block'});
        }
    },

    // Shows or hides the 'shared video' button.
    showSharedVideoButton () {
        let id = 'toolbar_button_sharedvideo';
        let shouldShow = UIUtil.isButtonEnabled('sharedvideo')
                && !config.disableThirdPartyRequests;

        if (shouldShow) {
            let el = document.getElementById(id);
            UIUtil.setTooltip(el, 'toolbar.sharedvideo', 'right');
        }
        UIUtil.setVisible(id, shouldShow);
    },

    // checks whether desktop sharing is enabled and whether
    // we have params to start automatically sharing
    checkAutoEnableDesktopSharing () {
        if (UIUtil.isButtonEnabled('desktop')
            && config.autoEnableDesktopSharing) {
            emitter.emit(UIEvents.TOGGLE_SCREENSHARING);
        }
    },

    // Shows or hides SIP calls button
    showSipCallButton (show) {
        let shouldShow = APP.conference.sipGatewayEnabled()
            && UIUtil.isButtonEnabled('sip') && show;
        let id = 'toolbar_button_sip';

        UIUtil.setVisible(id, shouldShow);
    },

    // Shows or hides the dialpad button
    showDialPadButton (show) {
        let shouldShow = UIUtil.isButtonEnabled('dialpad') && show;
        let id = 'toolbar_button_dialpad';

        UIUtil.setVisible(id, shouldShow);
    },

    /**
     * Update the state of the button. The button has blue glow if desktop
     * streaming is active.
     */
    updateDesktopSharingButtonState () {
        this._setToggledState(  "toolbar_button_desktopsharing",
                                APP.conference.isSharingScreen);
    },

    /**
     * Marks video icon as muted or not.
     *
     * @param {boolean} muted if icon should look like muted or not
     */
    toggleVideoIcon (muted) {
        $('#toolbar_button_camera').toggleClass("icon-camera-disabled", muted);

        this._setToggledState("toolbar_button_camera", muted);
    },

    /**
     * Enables / disables audio toolbar button.
     *
     * @param {boolean} enabled indicates if the button should be enabled
     * or disabled
     */
    setVideoIconEnabled (enabled) {
        this._setMediaIconEnabled(
                '#toolbar_button_camera',
                enabled,
                /* data-i18n attribute value */
                `[content]toolbar.${enabled ? 'videomute' : 'cameraDisabled'}`,
                /* shortcut attribute value */
                'toggleVideoPopover');

        enabled || this.toggleVideoIcon(!enabled);
    },

    /**
     * Enables/disables the toolbar button associated with a specific media such
     * as audio or video.
     *
     * @param {string} btn - The jQuery selector <tt>string</tt> which
     * identifies the toolbar button to be enabled/disabled.
     * @param {boolean} enabled - <tt>true</tt> to enable the specified
     * <tt>btn</tt>  or <tt>false</tt> to disable it.
     * @param {string} dataI18n - The value to assign to the <tt>data-i18n</tt>
     * attribute of the specified <tt>btn</tt>.
     * @param {string} shortcut - The value, if any, to assign to the
     * <tt>shortcut</tt> attribute of the specified <tt>btn</tt> if the toolbar
     * button is enabled.
     */
    _setMediaIconEnabled(btn, enabled, dataI18n, shortcut) {
        const $btn = $(btn);

        $btn
            .prop('disabled', !enabled)
            .attr('data-i18n', dataI18n)
            .attr('shortcut', enabled && shortcut ? shortcut : '');

        enabled
            ? $btn.removeAttr('disabled')
            : $btn.attr('disabled', 'disabled');

        APP.translation.translateElement($btn);
    },

    /**
     * Marks audio icon as muted or not.
     *
     * @param {boolean} muted if icon should look like muted or not
     */
    toggleAudioIcon(muted) {
        $('#toolbar_button_mute')
            .toggleClass("icon-microphone", !muted)
            .toggleClass("icon-mic-disabled", muted);

        this._setToggledState("toolbar_button_mute", muted);
    },

    /**
     * Enables / disables audio toolbar button.
     *
     * @param {boolean} enabled indicates if the button should be enabled
     * or disabled
     */
    setAudioIconEnabled (enabled) {
        this._setMediaIconEnabled(
                '#toolbar_button_mute',
                enabled,
                /* data-i18n attribute value */
                `[content]toolbar.${enabled ? 'mute' : 'micDisabled'}`,
                /* shortcut attribute value */
                'mutePopover');

        enabled || this.toggleAudioIcon(!enabled);
    },

    /**
     * Indicates if the toolbar is currently hovered.
     * @return {boolean} true if the toolbar is currently hovered,
     * false otherwise
     */
    isHovered() {
        var hovered = false;
        this.toolbarSelector.find('*').each(function () {
            let id = $(this).attr('id');
            if ($(`#${id}:hover`).length > 0) {
                hovered = true;
                // break each
                return false;
            }
        });
        if (hovered)
            return true;
        if ($("#bottomToolbar:hover").length > 0
            || $("#extendedToolbar:hover").length > 0
            || SideContainerToggler.isHovered()) {
            return true;
        }
        return false;
    },

    /**
     * Returns true if this toolbar is currently visible, or false otherwise.
     * @return <tt>true</tt> if currently visible, <tt>false</tt> - otherwise
     */
    isVisible() {
        return this.toolbarSelector.hasClass("fadeIn");
    },

    /**
     * Hides the toolbar with animation or not depending on the animate
     * parameter.
     */
    hide() {
        this.toolbarSelector
            .removeClass("fadeIn")
            .addClass("fadeOut");

        let slideInAnimation = (SideContainerToggler.isVisible)
                                    ? "slideInExtX"
                                    : "slideInX";
        let slideOutAnimation = (SideContainerToggler.isVisible)
                                    ? "slideOutExtX"
                                    : "slideOutX";

        this.extendedToolbarSelector.toggleClass(slideInAnimation)
            .toggleClass(slideOutAnimation);
    },

    /**
     * Shows the toolbar with animation or not depending on the animate
     * parameter.
     */
    show() {
        if (this.toolbarSelector.hasClass("fadeOut")) {
            this.toolbarSelector.removeClass("fadeOut");
        }

        let slideInAnimation = (SideContainerToggler.isVisible)
                                ? "slideInExtX"
                                : "slideInX";
        let slideOutAnimation = (SideContainerToggler.isVisible)
                                ? "slideOutExtX"
                                : "slideOutX";

        if (this.extendedToolbarSelector.hasClass(slideOutAnimation)) {
            this.extendedToolbarSelector.toggleClass(slideOutAnimation);
        }

        this.toolbarSelector.addClass("fadeIn");
        this.extendedToolbarSelector.toggleClass(slideInAnimation);
    },

    registerClickListeners(listener) {
        $('#mainToolbarContainer').click(listener);

        $("#extendedToolbar").click(listener);
    },

    /**
     * Handles the side toolbar toggle.
     *
     * @param {string} containerId the identifier of the container element
     */
    _handleSideToolbarContainerToggled(containerId) {
        Object.keys(defaultToolbarButtons).forEach(
            id => {
                if (!UIUtil.isButtonEnabled(id))
                    return;

                var button = defaultToolbarButtons[id];

                if (button.sideContainerId
                    && button.sideContainerId === containerId) {
                    UIUtil.buttonClick(button.id, "selected");
                    return;
                }
            }
        );
    },

    /**
     * Handles full screen toggled.
     *
     * @param {boolean} isFullScreen indicates if we're currently in full
     * screen mode
     */
    _handleFullScreenToggled(isFullScreen) {
        let element
            = document.getElementById("toolbar_button_fullScreen");

        element.className = isFullScreen
            ? element.className
                .replace("icon-full-screen", "icon-exit-full-screen")
            : element.className
                .replace("icon-exit-full-screen", "icon-full-screen");

        Toolbar._setToggledState("toolbar_button_fullScreen", isFullScreen);
    },

    /**
     * Initialise toolbar buttons.
     */
    _initToolbarButtons() {
        interfaceConfig.TOOLBAR_BUTTONS.forEach((value, index) => {
            let place = getToolbarButtonPlace(value);

            if (value && value in defaultToolbarButtons) {
                let button = defaultToolbarButtons[value];
                this._addToolbarButton(
                    button,
                    place,
                    (interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX !== undefined
                        && index
                            === interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX));
            }
        });
    },

    /**
     * Adds the given button to the main (top) or extended (left) toolbar.
     *
     * @param {Object} the button to add.
     * @param {boolean} isFirst indicates if this is the first button in the
     * toolbar
     * @param {boolean} isLast indicates if this is the last button in the
     * toolbar
     * @param {boolean} isSplitter if this button is a splitter button for
     * the dialog, which means that a special splitter style will be applied
     */
    _addToolbarButton(button, place, isSplitter) {
        const places = {
            main: 'mainToolbar',
            extended: 'extendedToolbarButtons'
        };
        let id = places[place];
        let buttonElement = document.createElement("a");
        if (button.className) {
            buttonElement.className = button.className;
        }

        if (isSplitter) {
            let splitter = document.createElement('span');
            splitter.className = 'toolbar__splitter';
            document.getElementById(id).appendChild(splitter);
        }

        buttonElement.id = button.id;

        if (button.html)
            buttonElement.innerHTML = button.html;

        //TODO: remove it after UI.updateDTMFSupport fix
        if (button.hidden)
            buttonElement.style.display = 'none';

        if (button.shortcutAttr)
            buttonElement.setAttribute("shortcut", button.shortcutAttr);

        if (button.content)
            buttonElement.setAttribute("content", button.content);

        if (button.i18n)
            buttonElement.setAttribute("data-i18n", button.i18n);

        buttonElement.setAttribute("data-container", "body");
        buttonElement.setAttribute("data-placement", "bottom");
        this._addPopups(buttonElement, button.popups);

        document.getElementById(id)
            .appendChild(buttonElement);
    },

    _addPopups(buttonElement, popups = []) {
        popups.forEach((popup) => {
            const popupElement = document.createElement('div');
            popupElement.id = popup.id;
            popupElement.className = popup.className;
            popupElement.setAttribute('data-i18n', popup.dataAttr);

            let gravity = 'n';
            if (popup.dataAttrPosition)
                gravity = popup.dataAttrPosition;
            // use custom attribute to save gravity option
            // we use 'data-tooltip' in UIUtil to activate all tooltips
            // but we want these to be manually triggered
            popupElement.setAttribute('tooltip-gravity', gravity);

            APP.translation.translateElement($(popupElement));

            buttonElement.appendChild(popupElement);
        });
    },

    /**
     * Show custom popup/tooltip for a specified button.
     * @param popupSelectorID the selector id of the popup to show
     * @param show true or false/show or hide the popup
     * @param timeout the time to show the popup
     */
    _showCustomToolbarPopup(popupSelectorID, show, timeout) {

        const gravity = $(popupSelectorID).attr('tooltip-gravity');
        AJS.$(popupSelectorID)
            .tooltip({
                trigger: 'manual',
                html: true,
                gravity: gravity,
                title: 'title'});
        if (show) {
            AJS.$(popupSelectorID).tooltip('show');
            setTimeout(function () {
                // hide the tooltip
                AJS.$(popupSelectorID).tooltip('hide');
            }, timeout);
        } else {
            AJS.$(popupSelectorID).tooltip('hide');
        }
    },

/**
     * Sets the toggled state of the given element depending on the isToggled
     * parameter.
     *
     * @param elementId the element identifier
     * @param isToggled indicates if the element should be toggled or untoggled
     */
     _setToggledState(elementId, isToggled) {
        $("#" + elementId).toggleClass("toggled", isToggled);
    },

    /**
     * Sets Shortcuts and Tooltips for all toolbar buttons
     *
     * @private
     */
    _setShortcutsAndTooltips() {
        Object.keys(defaultToolbarButtons).forEach(
            id => {
                if (UIUtil.isButtonEnabled(id)) {
                    let button = defaultToolbarButtons[id];
                    let buttonElement = document.getElementById(button.id);
                    if (!buttonElement) return false;
                    let tooltipPosition
                        = (interfaceConfig.MAIN_TOOLBAR_BUTTONS
                        .indexOf(id) > -1)
                        ? "bottom" : "right";

                    UIUtil.setTooltip(  buttonElement,
                        button.tooltipKey,
                        tooltipPosition);

                    if (button.shortcut)
                        APP.keyboardshortcut.registerShortcut(
                            button.shortcut,
                            button.shortcutAttr,
                            button.shortcutFunc,
                            button.shortcutDescription
                        );
                }
            }
        );
    },

    /**
     * Sets Handlers for all toolbar buttons
     *
     * @private
     */
    _setButtonHandlers() {
        Object.keys(buttonHandlers).forEach(
            buttonId => $(`#${buttonId}`).click(function(event) {
                !$(this).prop('disabled') && buttonHandlers[buttonId](event);
            })
        );
    }
};

export default Toolbar;
