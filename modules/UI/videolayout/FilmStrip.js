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
        this.iconMenuDownClassName = 'icon-menu-down';
        this.iconMenuUpClassName = 'icon-menu-up';
        this.filmStrip = $('#remoteVideos');
        this.eventEmitter = eventEmitter;
        this._initFilmStripToolbar();
        this.registerListeners();
    },

    /**
     * Initializes the filmstrip toolbar
     */
    _initFilmStripToolbar() {
        let toolbar = this._generateFilmStripToolbar();
        let container = document.querySelector('.filmstrip');

        UIUtil.prependChild(container, toolbar);

        let iconSelector = '#hideVideoToolbar i';
        this.toggleFilmStripIcon = document.querySelector(iconSelector);
    },

    /**
     * Generates HTML layout for filmstrip toolbar
     * @returns {HTMLElement}
     * @private
     */
    _generateFilmStripToolbar() {
        let container = document.createElement('div');
        let isVisible = this.isFilmStripVisible();
        container.className = 'filmstripToolbar';

        container.innerHTML = `
            <button id="hideVideoToolbar">
                <i class="icon-menu-${isVisible ? 'down' : 'up'}">
                </i>
            </button>
        `;

        return container;
    },

    /**
     * Attach 'click' listener to "hide filmstrip" button
     */
    registerListeners() {
        let toggleFilmstripMethod = this.toggleFilmStrip.bind(this);
        let selector = '#hideVideoToolbar';
        $('#videospace').on('click', selector, toggleFilmstripMethod);

        let eventEmitter = this.eventEmitter;
        let event = UIEvents.TOGGLE_FILM_STRIP;
        if (eventEmitter) {
            eventEmitter.addListener(event, toggleFilmstripMethod);
        }
    },

    /**
     * Changes classes of icon for showing down state
     */
    showMenuDownIcon() {
        let icon = this.toggleFilmStripIcon;
        icon.classList.add(this.iconMenuDownClassName);
        icon.classList.remove(this.iconMenuUpClassName);
    },

    /**
     * Changes classes of icon for showing up state
     */
    showMenuUpIcon() {
        let icon = this.toggleFilmStripIcon;
        icon.classList.add(this.iconMenuUpClassName);
        icon.classList.remove(this.iconMenuDownClassName);
    },

    /**
     * Toggles the visibility of the film strip.
     *
     * @param visible optional {Boolean} which specifies the desired visibility
     * of the film strip. If not specified, the visibility will be flipped
     * (i.e. toggled); otherwise, the visibility will be set to the specified
     * value.
     */
    toggleFilmStrip(visible) {
        let isVisibleDefined = typeof visible === 'boolean';
        if (!isVisibleDefined) {
            visible = this.isFilmStripVisible();
        } else if (this.isFilmStripVisible() === visible) {
            return;
        }

        this.filmStrip.toggleClass("hidden");

        if (!visible) {
            this.showMenuDownIcon();
        } else {
            this.showMenuUpIcon();
        }

        // Emit/fire UIEvents.TOGGLED_FILM_STRIP.
        var eventEmitter = this.eventEmitter;
        if (eventEmitter) {
            eventEmitter.emit(
                UIEvents.TOGGLED_FILM_STRIP,
                this.isFilmStripVisible());
        }
    },

    /**
     * Shows if filmstrip is visible
     * @returns {boolean}
     */
    isFilmStripVisible() {
        return !this.filmStrip.hasClass('hidden');
    },

    setupFilmStripOnly() {
        this.filmStrip.css({
            padding: "0px 0px 18px 0px",
            right: 0
        });
    },

    /**
     * Returns the height of filmstrip
     * @returns {number} height
     */
    getFilmStripHeight() {
        if (this.isFilmStripVisible()) {
            return this.filmStrip.outerHeight();
        } else {
            return 0;
        }
    },

    /**
     * Returns the width of filmstip
     * @returns {number} width
     */
    getFilmStripWidth() {
        return this.filmStrip.innerWidth()
            - parseInt(this.filmStrip.css('paddingLeft'), 10)
            - parseInt(this.filmStrip.css('paddingRight'), 10);
    },

    /**
     * Calculates the size for thumbnails: local and remote one
     * @returns {*|{localVideo, remoteVideo}}
     */
    calculateThumbnailSize() {
        let availableSizes = this.calculateAvailableSize();
        let width = availableSizes.availableWidth;
        let height = availableSizes.availableHeight;

        return this.calculateThumbnailSizeFromAvailable(width, height);
    },

    /**
     * Normalizes local and remote thumbnail ratios
     */
    normalizeThumbnailRatio() {
        let remoteHeightRatio = interfaceConfig.REMOTE_THUMBNAIL_RATIO_HEIGHT;
        let remoteWidthRatio = interfaceConfig.REMOTE_THUMBNAIL_RATIO_WIDTH;

        let localHeightRatio = interfaceConfig.LOCAL_THUMBNAIL_RATIO_HEIGHT;
        let localWidthRatio = interfaceConfig.LOCAL_THUMBNAIL_RATIO_WIDTH;

        let commonHeightRatio = remoteHeightRatio * localHeightRatio;

        let localRatioCoefficient = localWidthRatio / localHeightRatio;
        let remoteRatioCoefficient = remoteWidthRatio / remoteHeightRatio;

        remoteWidthRatio = commonHeightRatio * remoteRatioCoefficient;
        remoteHeightRatio = commonHeightRatio;

        localWidthRatio = commonHeightRatio * localRatioCoefficient;
        localHeightRatio = commonHeightRatio;

        let localRatio = {
            widthRatio: localWidthRatio,
            heightRatio: localHeightRatio
        };

        let remoteRatio = {
            widthRatio: remoteWidthRatio,
            heightRatio: remoteHeightRatio
        };

        return { localRatio, remoteRatio };
    },

    /**
     * Calculates available size for one thumbnail according to
     * the current window size
     * @returns {{availableWidth: number, availableHeight: number}}
     */
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
     * Takes the available size for thumbnail and calculates
     * final size of thumbnails
     * @param availableWidth
     * @param availableHeight
     * @returns {{localVideo, remoteVideo}}
     */
    calculateThumbnailSizeFromAvailable(availableWidth, availableHeight) {
        let { localRatio, remoteRatio } = this.normalizeThumbnailRatio();
        let { remoteThumbs } = this.getThumbs(true);
        let remoteProportion = remoteRatio.widthRatio * remoteThumbs.length;
        let widthProportion = remoteProportion + localRatio.widthRatio;

        let heightUnit = availableHeight / localRatio.heightRatio;
        let widthUnit = availableWidth / widthProportion;

        if (heightUnit < widthUnit) {
            widthUnit = heightUnit;
        }
        else
            heightUnit = widthUnit;

        let localVideo = {
            thumbWidth: widthUnit * localRatio.widthRatio,
            thumbHeight: heightUnit * localRatio.heightRatio
        };
        let remoteVideo = {
            thumbWidth: widthUnit * remoteRatio.widthRatio,
            thumbHeight: widthUnit * remoteRatio.heightRatio
        };

        return {
            localVideo,
            remoteVideo
        };
    },

    /**
     * Resizes thumbnails
     * @param local
     * @param remote
     * @param animate
     * @param forceUpdate
     * @returns {Promise}
     */
    resizeThumbnails(local, remote,
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

    /**
     * Returns thumbnails of the filmstrip
     * @param only_visible
     * @returns {object} thumbnails
     */
    getThumbs(only_visible = false) {
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
