/* global $ */
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';
import AnalyticsAdapter from '../../statistics/AnalyticsAdapter';

const defaultBottomToolbarButtons = {
    'chat':      '#bottom_toolbar_chat',
    'contacts':  '#bottom_toolbar_contact_list',
    'filmstrip': '#bottom_toolbar_film_strip'
};

$(document).bind("remotevideo.resized", function (event, width, height) {
    let toolbar = $('#bottomToolbar');
    let bottom = (height - toolbar.outerHeight())/2 + 18;

    toolbar.css({bottom});
});

const BottomToolbar = {
    init (emitter) {
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

    toggleFilmStrip () {
        $("#remoteVideos").toggleClass("hidden");
    }
};

export default BottomToolbar;
