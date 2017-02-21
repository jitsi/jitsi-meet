/* global AJS, APP, $, config, interfaceConfig, JitsiMeetJS */
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';
import SideContainerToggler from "../side_pannels/SideContainerToggler";

const defaultToolbarButtons =
  require('../../../react/features/toolbar/components/defaultToolbarButtons');

const primaryToolbarHandlers =
  require('../../../react/features/toolbar/components/primaryToolbarHandlers');

const secondaryToolbarHandlers =
require('../../../react/features/toolbar/components/secondaryToolbarHandlers');

let emitter = null;
let Toolbar;

/**
 * Handlers for toolbar buttons.
 *
 * buttonId {string}: handler {function}
 */
const buttonHandlers = Object.assign({}, primaryToolbarHandlers,
    secondaryToolbarHandlers);

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

Toolbar = {
    init (eventEmitter) {
        emitter = eventEmitter;
        // The toolbar is enabled by default.
        this.enabled = true;
        this.toolbarSelector = $("#mainToolbarContainer");
        this.extendedToolbarSelector = $("#extendedToolbar");

        // Initialise the toolbar buttons.
        // The main toolbar will only take into account
        // it's own configuration from interface_config.
        this._initToolbarButtons();

        this._setShortcutsAndTooltips();

        this._setButtonHandlers();

        this.registerListeners();

        if(!APP.tokenData.isGuest) {
            $("#toolbar_button_profile").addClass("unclickable");
            UIUtil.removeTooltip(
                document.getElementById('toolbar_button_profile'));
        }
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
            buttonId => {
                $(`#${buttonId}`).click((event) => {
                    const handler = buttonHandlers[buttonId];

                    !$(this).prop('disabled') && handler[buttonId](event);
                });
            });
    }
};

export default Toolbar;
