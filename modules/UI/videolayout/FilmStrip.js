/* global $, interfaceConfig */

import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";

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

    calculateThumbnailSize() {
        let availableSizes = this.calculateAvailableSize();
        let width = availableSizes.availableWidth;
        let height = availableSizes.availableHeight;

        return this.calculateThumbnailSizeFromAvailable(width, height);
    },

    calculateAvailableSize() {
        let availableHeight = interfaceConfig.FILM_STRIP_MAX_HEIGHT;
        let thumbs = this.getThumbs(true);
        let numvids = thumbs.remoteThumbs.length;

        let localVideoContainer = $("#localVideoContainer");

        /**
         * If the videoAreaAvailableWidth is set we use this one to calculate
         * the filmStrip width, because we're probably in a state where the
         * film strip size hasn't been updated yet, but it will be.
         */
        let videoAreaAvailableWidth
            = UIUtil.getAvailableVideoWidth()
            - UIUtil.parseCssInt(this.filmStrip.css('right'), 10)
            - UIUtil.parseCssInt(this.filmStrip.css('paddingLeft'), 10)
            - UIUtil.parseCssInt(this.filmStrip.css('paddingRight'), 10)
            - UIUtil.parseCssInt(this.filmStrip.css('borderLeftWidth'), 10)
            - UIUtil.parseCssInt(this.filmStrip.css('borderRightWidth'), 10)
            - 5;

        let availableWidth = videoAreaAvailableWidth;

        // If local thumb is not hidden
        if(thumbs.localThumb) {
            availableWidth = Math.floor(
                (videoAreaAvailableWidth - (
                UIUtil.parseCssInt(
                    localVideoContainer.css('borderLeftWidth'), 10)
                + UIUtil.parseCssInt(
                    localVideoContainer.css('borderRightWidth'), 10)
                + UIUtil.parseCssInt(
                    localVideoContainer.css('paddingLeft'), 10)
                + UIUtil.parseCssInt(
                    localVideoContainer.css('paddingRight'), 10)
                + UIUtil.parseCssInt(
                    localVideoContainer.css('marginLeft'), 10)
                + UIUtil.parseCssInt(
                    localVideoContainer.css('marginRight'), 10)))
            );
        }

        // If the number of videos is 0 or undefined we don't need to calculate
        // further.
        if (numvids) {
            let remoteVideoContainer = thumbs.remoteThumbs.eq(0);
            availableWidth = Math.floor(
                (videoAreaAvailableWidth - numvids * (
                UIUtil.parseCssInt(
                    remoteVideoContainer.css('borderLeftWidth'), 10)
                + UIUtil.parseCssInt(
                    remoteVideoContainer.css('borderRightWidth'), 10)
                + UIUtil.parseCssInt(
                    remoteVideoContainer.css('paddingLeft'), 10)
                + UIUtil.parseCssInt(
                    remoteVideoContainer.css('paddingRight'), 10)
                + UIUtil.parseCssInt(
                    remoteVideoContainer.css('marginLeft'), 10)
                + UIUtil.parseCssInt(
                    remoteVideoContainer.css('marginRight'), 10)))
            );
        }

        let maxHeight
            // If the MAX_HEIGHT property hasn't been specified
            // we have the static value.
            = Math.min(interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120,
            availableHeight);

        availableHeight
            = Math.min(maxHeight, window.innerHeight - 18);

        return { availableWidth, availableHeight };
    },

    /**
     * Calculate the thumbnail size in order to fit all the thumnails in passed
     * dimensions.
     * NOTE: Here we assume that the remote and local thumbnails are with the
     * same height.
     * @param {int} availableWidth the maximum width for all thumbnails
     * @param {int} availableHeight the maximum height for all thumbnails
     */
    calculateThumbnailSizeFromAvailable(availableWidth, availableHeight) {
        /**
         * Let:
         * lW - width of the local thumbnail
         * rW - width of the remote thumbnail
         * h - the height of the thumbnails
         * remoteRatio - width:height for the remote thumbnail
         * localRatio - width:height for the local thumbnail
         * numberRemoteThumbs - number of remote thumbnails (we have only one
         * local thumbnail)
         *
         * Since the height for local thumbnail = height for remote thumbnail
         * and we know the ratio (width:height) for the local and for the
         * remote thumbnail we can find rW/lW:
         * rW / remoteRatio = lW / localRatio then -
         * remoteLocalWidthRatio = rW / lW = remoteRatio / localRatio
         * and rW = lW * remoteRatio / localRatio = lW * remoteLocalWidthRatio
         * And the total width for the thumbnails is:
         * totalWidth = rW * numberRemoteThumbs + lW
         * = lW * remoteLocalWidthRatio * numberRemoteThumbs + lW =
         * lW * (remoteLocalWidthRatio * numberRemoteThumbs + 1)
         * and the h = lW/localRatio
         *
         * In order to fit all the thumbails in the area defined by
         * availableWidth * availableHeight we should check one of the
         * following options:
         * 1) if availableHeight == h - totalWidth should be less than
         * availableWidth
         * 2) if availableWidth ==  totalWidth - h should be less than
         * availableHeight
         *
         * 1) or 2) will be true and we are going to use it to calculate all
         * sizes.
         *
         * if 1) is true that means that
         * availableHeight/h > availableWidth/totalWidth otherwise 2) is true
         */

        const numberRemoteThumbs = this.getThumbs(true).remoteThumbs.length;
        const remoteLocalWidthRatio = interfaceConfig.REMOTE_THUMBNAIL_RATIO /
            interfaceConfig.LOCAL_THUMBNAIL_RATIO;
        const lW = Math.min(availableWidth /
            (remoteLocalWidthRatio * numberRemoteThumbs + 1), availableHeight *
            interfaceConfig.LOCAL_THUMBNAIL_RATIO);
        const h = lW / interfaceConfig.LOCAL_THUMBNAIL_RATIO;
        return { localVideo:{
                        thumbWidth: lW,
                        thumbHeight: h
                    }, remoteVideo: {
                        thumbWidth: lW * remoteLocalWidthRatio,
                        thumbHeight: h
                    }
                };
    },

    resizeThumbnails (local, remote,
                      animate = false, forceUpdate = false) {

        return new Promise(resolve => {
            let thumbs = this.getThumbs(!forceUpdate);
            if(thumbs.localThumb)
                thumbs.localThumb.animate({
                    height: local.thumbHeight,
                    width: local.thumbWidth
                }, {
                    queue: false,
                    duration: animate ? 500 : 0,
                    complete:  resolve
                });
            if(thumbs.remoteThumbs)
                thumbs.remoteThumbs.animate({
                    height: remote.thumbHeight,
                    width: remote.thumbWidth
                }, {
                    queue: false,
                    duration: animate ? 500 : 0,
                    complete:  resolve
                });

            this.filmStrip.animate({
                // adds 2 px because of small video 1px border
                height: remote.thumbHeight + 2
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

        let localThumb = $("#localVideoContainer");
        let remoteThumbs = this.filmStrip.children(selector)
            .not("#localVideoContainer");

        // Exclude the local video container if it has been hidden.
        if (localThumb.hasClass("hidden")) {
            return { remoteThumbs };
        } else {
            return { remoteThumbs, localThumb };
        }

    }

};

export default FilmStrip;
