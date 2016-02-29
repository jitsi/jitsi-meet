/* global $, APP, interfaceConfig, config*/

import UIUtil from "../util/UIUtil";

const thumbAspectRatio = 16.0 / 9.0;

const FilmStrip = {
    init () {
        this.filmStrip = $('#remoteVideos');
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
        return this.filmStrip.innerWidth()
            - parseInt(this.filmStrip.css('paddingLeft'), 10)
            - parseInt(this.filmStrip.css('paddingRight'), 10);
    },

    /**
     * Calculates the thumbnail size.
     * @param videoAreaAvailableWidth the currently available video area width
     * that we want to take into account when calculating the film strip width.
     */
     calculateThumbnailSize (videoAreaAvailableWidth) {
        // Calculate the available height, which is the inner window height
        // minus 39px for the header minus 2px for the delimiter lines on the
        // top and bottom of the large video, minus the 36px space inside the
        // remoteVideos container used for highlighting shadow.
        let availableHeight = 100;

        let numvids = this.getThumbs(true).length;

        let localVideoContainer = $("#localVideoContainer");

        /**
         * If the videoAreaAvailableWidth is set we use this one to calculate
         * the filmStrip width, because we're probably in a state where the
         * film strip size hasn't been updated yet, but it will be.
         */
        let filmStripWidth = videoAreaAvailableWidth
            ? videoAreaAvailableWidth
                - parseInt(this.filmStrip.css('right'), 10)
                - parseInt(this.filmStrip.css('paddingLeft'), 10)
                - parseInt(this.filmStrip.css('paddingRight'), 10)
                - parseInt(this.filmStrip.css('borderLeftWidth'), 10)
                - parseInt(this.filmStrip.css('borderRightWidth'), 10)
            : this.getFilmStripWidth();


        let availableWidth = Math.floor(
                (filmStripWidth - numvids * (
                parseInt(localVideoContainer.css('borderLeftWidth'), 10)
                + parseInt(localVideoContainer.css('borderRightWidth'), 10)
                + parseInt(localVideoContainer.css('paddingLeft'), 10)
                + parseInt(localVideoContainer.css('paddingRight'), 10)
                + parseInt(localVideoContainer.css('marginLeft'), 10)
                + parseInt(localVideoContainer.css('marginRight'), 10)))
                / numvids) - numvids*10;

        let maxHeight
            // If the MAX_HEIGHT property hasn't been specified
            // we have the static value.
            = Math.min( interfaceConfig.FILM_STRIP_MAX_HEIGHT || 160,
            availableHeight);

        availableHeight
            = Math.min( maxHeight,
            availableWidth / thumbAspectRatio,
            window.innerHeight - 18);

        if (availableHeight < availableWidth / thumbAspectRatio) {
            availableWidth = Math.floor(availableHeight * thumbAspectRatio);
        }

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
