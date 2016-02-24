/* global $, APP, interfaceConfig*/
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';
import AnalyticsAdapter from '../../statistics/AnalyticsAdapter';

const defaultBottomToolbarButtons = {
    'chat':      '#bottom_toolbar_chat',
    'contacts':  '#bottom_toolbar_contact_list',
    'filmstrip': '#bottom_toolbar_film_strip'
};

const BottomToolbar = {
    init () {
        this.toolbar = $('#bottomToolbar');
    },

    setupListeners (emitter) {
        UIUtil.hideDisabledButtons(defaultBottomToolbarButtons);

        const buttonHandlers = {
            "bottom_toolbar_contact_list": function () {
                AnalyticsAdapter.sendEvent('bottomtoolbar.contacts.toggled');
                emitter.emit(UIEvents.TOGGLE_CONTACT_LIST);
            },
            "bottom_toolbar_film_strip": function () {
                AnalyticsAdapter.sendEvent('bottomtoolbar.filmstrip.toggled');
                emitter.emit(UIEvents.TOGGLE_FILM_STRIP);
            },
            "bottom_toolbar_chat": function () {
                AnalyticsAdapter.sendEvent('bottomtoolbar.chat.toggled');
                emitter.emit(UIEvents.TOGGLE_CHAT);
            }
        };

        Object.keys(buttonHandlers).forEach(
            buttonId => $(`#${buttonId}`).click(buttonHandlers[buttonId])
        );
    },

    resizeToolbar (thumbWidth, thumbHeight) {
        let bottom = (thumbHeight - this.toolbar.outerHeight())/2 + 18;
        this.toolbar.css({bottom});
    },

    /**
     * Returns true if this toolbar is currently visible, or false otherwise.
     * @return <tt>true</tt> if currently visible, <tt>false</tt> - otherwise
     */
    isVisible() {
        return this.toolbar.is(":visible");
    },

    /**
     * Hides the bottom toolbar with animation or not depending on the animate
     * parameter.
     * @param animate <tt>true</tt> to hide the bottom toolbar with animation,
     * <tt>false</tt> or nothing to hide it without animation.
     */
    hide(animate) {
        if (animate)
            this.toolbar.hide("slide", {direction: "right", duration: 300});
        else
            this.toolbar.css("display", "none");
    },

    /**
     * Shows the bottom toolbar with animation or not depending on the animate
     * parameter.
     * @param animate <tt>true</tt> to show the bottom toolbar with animation,
     * <tt>false</tt> or nothing to show it without animation.
     */
    show(animate) {
        if (animate)
            this.toolbar.show("slide", {direction: "right", duration: 300});
        else
            this.toolbar.css("display", "block");
    }
};

export default BottomToolbar;
