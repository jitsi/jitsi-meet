/* global $, APP, interfaceConfig, config*/

import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";

const thumbAspectRatio = 1 / 1;

const FilmStrip = {
    /**
     *
     * @param eventEmitter the {EventEmitter} through which {FilmStrip} is to
     * emit/fire {UIEvents} (such as {UIEvents.TOGGLED_FILM_STRIP}).
     */
    init (eventEmitter) {
        this.filmStrip = $('#remoteVideos');
        this.eventEmitter = eventEmitter;
    },

    /**
     * Toggles the visibility of the film strip.
     *
     * @param visible optional {Boolean} which specifies the desired visibility
     * of the film strip. If not specified, the visibility will be flipped
     * (i.e. toggled); otherwise, the visibility will be set to the specified
     * value.
     */
    toggleFilmStrip (visible) {
        if (typeof visible === 'boolean'
                && this.isFilmStripVisible() == visible) {
            return;
        }

        this.filmStrip.toggleClass("hidden");

        // Emit/fire UIEvents.TOGGLED_FILM_STRIP.
        var eventEmitter = this.eventEmitter;
        if (eventEmitter) {
            eventEmitter.emit(
                    UIEvents.TOGGLED_FILM_STRIP,
                    this.isFilmStripVisible());
        }
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
        return this.filmStrip.innerWidth()
            - parseInt(this.filmStrip.css('paddingLeft'), 10)
            - parseInt(this.filmStrip.css('paddingRight'), 10);
    },

    /**
     * Calculates the thumbnail size.
     * @param videoAreaAvailableWidth the currently available video area width
     * that we want to take into account when calculating the film strip width.
     */
     calculateThumbnailSize (isSideBarVisible) {
        let availableHeight = interfaceConfig.FILM_STRIP_MAX_HEIGHT;

        let numvids = this.getThumbs(true).length;

        let localVideoContainer = $("#localVideoContainer");

        /**
         * If the videoAreaAvailableWidth is set we use this one to calculate
         * the filmStrip width, because we're probably in a state where the
         * film strip size hasn't been updated yet, but it will be.
         */
        let videoAreaAvailableWidth
            = UIUtil.getAvailableVideoWidth(isSideBarVisible)
                - parseInt(this.filmStrip.css('right'), 10)
                - parseInt(this.filmStrip.css('paddingLeft'), 10)
                - parseInt(this.filmStrip.css('paddingRight'), 10)
                - parseInt(this.filmStrip.css('borderLeftWidth'), 10)
                - parseInt(this.filmStrip.css('borderRightWidth'), 10) - 5;

        let availableWidth = Math.floor(
                (videoAreaAvailableWidth - numvids * (
                parseInt(localVideoContainer.css('borderLeftWidth'), 10)
                + parseInt(localVideoContainer.css('borderRightWidth'), 10)
                + parseInt(localVideoContainer.css('paddingLeft'), 10)
                + parseInt(localVideoContainer.css('paddingRight'), 10)
                + parseInt(localVideoContainer.css('marginLeft'), 10)
                + parseInt(localVideoContainer.css('marginRight'), 10)))
                / numvids);

        let maxHeight
            // If the MAX_HEIGHT property hasn't been specified
            // we have the static value.
            = Math.min( interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120,
                        availableHeight);

        availableHeight
            = Math.min( maxHeight, window.innerHeight - 18);

        if (availableHeight < availableWidth) {
            availableWidth = availableHeight;
        }
        else
            availableHeight = availableWidth;

        return {
            thumbWidth: availableWidth,
            thumbHeight: availableHeight
        };
    },

    resizeThumbnails (thumbWidth, thumbHeight,
                      animate = false, forceUpdate = false) {

        return new Promise(resolve => {
            this.getThumbs(!forceUpdate).animate({
                height: thumbHeight,
                width: thumbWidth
            }, {
                queue: false,
                duration: animate ? 500 : 0,
                complete:  resolve
            });

            this.filmStrip.animate({
                // adds 2 px because of small video 1px border
                height: thumbHeight + 2
            }, {
                queue: false,
                duration: animate ? 500 : 0
            });

            if (!animate) {
                resolve();
            }
        });
    },

    getThumbs (only_visible = false) {
        let selector = 'span';
        if (only_visible) {
            selector += ':visible';
        }

        return this.filmStrip.children(selector);
    }
};

export default FilmStrip;
