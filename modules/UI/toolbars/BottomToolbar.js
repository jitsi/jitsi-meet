/* global $ */
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
        this.filmStrip = $('#remoteVideos');
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

    toggleFilmStrip () {
        this.filmStrip.toggleClass("hidden");
    },

    isFilmStripVisible () {
        return !this.filmStrip.hasClass('hidden');
    },

    setupFilmStripOnly () {
        this.filmStrip.css({
            padding: "0px 0px 18px 0px",
            right: 0
        });
    },

    getFilmStripHeight () {
        if (this.isFilmStripVisible()) {
            return this.filmStrip.outerHeight();
        } else {
            return 0;
        }
    },

    getFilmStripWidth () {
        return this.filmStrip.width();
    },

    resizeThumbnails (thumbWidth, thumbHeight, animate = false, show = false) {
        return new Promise(resolve => {
            this.filmStrip.animate({
                // adds 2 px because of small video 1px border
                height: thumbHeight + 2
            }, {
                queue: false,
                duration: animate ? 500 : 0
            });

            this.getThumbs(!show).animate({
                height: thumbHeight,
                width: thumbWidth
            }, {
                queue: false,
                duration: animate ? 500 : 0,
                complete:  resolve
            });

            if (!animate) {
                resolve();
            }
        });
    },

    resizeToolbar (thumbWidth, thumbHeight) {
        let bottom = (thumbHeight - this.toolbar.outerHeight())/2 + 18;
        this.toolbar.css({bottom});
    },

    getThumbs (only_visible = false) {
        let selector = 'span';
        if (only_visible) {
            selector += ':visible';
        }

        return this.filmStrip.children(selector);
    }
};

export default BottomToolbar;
