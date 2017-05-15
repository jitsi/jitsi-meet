/* global $, APP, JitsiMeetJS, interfaceConfig */

import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";

const Filmstrip = {
    /**
     *
     * @param eventEmitter the {EventEmitter} through which {Filmstrip} is to
     * emit/fire {UIEvents} (such as {UIEvents.TOGGLED_FILMSTRIP}).
     */
    init (eventEmitter) {
        this.iconMenuDownClassName = 'icon-menu-down';
        this.iconMenuUpClassName = 'icon-menu-up';
        this.filmstripContainerClassName = 'filmstrip';
        this.filmstrip = $('#remoteVideos');
        this.eventEmitter = eventEmitter;
        this._initFilmstripToolbar();
        this.registerListeners();
    },

    /**
     * Initializes the filmstrip toolbar.
     */
    _initFilmstripToolbar() {
        // Do not show the toggle button in filmstrip only mode.
        if (interfaceConfig.filmStripOnly)
            return;

        let toolbarContainerHTML = this._generateToolbarHTML();
        let className = this.filmstripContainerClassName;
        let container = document.querySelector(`.${className}`);

        UIUtil.prependChild(container, toolbarContainerHTML);

        let iconSelector = '#toggleFilmstripButton i';
        this.toggleFilmstripIcon = document.querySelector(iconSelector);
    },

    /**
     * Generates HTML layout for filmstrip toggle button and wrapping container.
     * @returns {HTMLElement}
     * @private
     */
    _generateToolbarHTML() {
        let container = document.createElement('div');
        let isVisible = this.isFilmstripVisible();
        container.className = 'filmstrip__toolbar';
        container.innerHTML = `
            <button id="toggleFilmstripButton">
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
        // Important:
        // Firing the event instead of executing toggleFilmstrip method because
        // it's important to hide the filmstrip by UI.toggleFilmstrip in order
        // to correctly resize the video area.
        $('#toggleFilmstripButton').on('click',
            () => this.eventEmitter.emit(UIEvents.TOGGLE_FILMSTRIP));

        this._registerToggleFilmstripShortcut();
    },

    /**
     * Registering toggle filmstrip shortcut
     * @private
     */
    _registerToggleFilmstripShortcut() {
        let shortcut = 'F';
        let shortcutAttr = 'filmstripPopover';
        let description = 'keyboardShortcuts.toggleFilmstrip';
        // Important:
        // Firing the event instead of executing toggleFilmstrip method because
        // it's important to hide the filmstrip by UI.toggleFilmstrip in order
        // to correctly resize the video area.
        let handler = () => this.eventEmitter.emit(UIEvents.TOGGLE_FILMSTRIP);

        APP.keyboardshortcut.registerShortcut(
            shortcut,
            shortcutAttr,
            handler,
            description
        );
    },

    /**
     * Changes classes of icon for showing down state
     */
    showMenuDownIcon() {
        let icon = this.toggleFilmstripIcon;
        if(icon) {
            icon.classList.add(this.iconMenuDownClassName);
            icon.classList.remove(this.iconMenuUpClassName);
        }
    },

    /**
     * Changes classes of icon for showing up state
     */
    showMenuUpIcon() {
        let icon = this.toggleFilmstripIcon;
        if(icon) {
            icon.classList.add(this.iconMenuUpClassName);
            icon.classList.remove(this.iconMenuDownClassName);
        }
    },

    /**
     * Toggles the visibility of the filmstrip.
     *
     * @param visible optional {Boolean} which specifies the desired visibility
     * of the filmstrip. If not specified, the visibility will be flipped
     * (i.e. toggled); otherwise, the visibility will be set to the specified
     * value.
     * @param {Boolean} sendAnalytics - True to send an analytics event. The
     * default value is true.
     *
     * Note:
     * This method shouldn't be executed directly to hide the filmstrip.
     * It's important to hide the filmstrip with UI.toggleFilmstrip in order
     * to correctly resize the video area.
     */
    toggleFilmstrip(visible, sendAnalytics = true) {
        const isVisibleDefined = typeof visible === 'boolean';
        if (!isVisibleDefined) {
            visible = this.isFilmstripVisible();
        } else if (this.isFilmstripVisible() === visible) {
            return;
        }
        if (sendAnalytics) {
            JitsiMeetJS.analytics.sendEvent('toolbar.filmstrip.toggled');
        }
        this.filmstrip.toggleClass("hidden");

        if (visible) {
            this.showMenuUpIcon();
        } else {
            this.showMenuDownIcon();
        }

        // Emit/fire UIEvents.TOGGLED_FILMSTRIP.
        const eventEmitter = this.eventEmitter;
        if (eventEmitter) {
            eventEmitter.emit(
                UIEvents.TOGGLED_FILMSTRIP,
                this.isFilmstripVisible());
        }
    },

    /**
     * Shows if filmstrip is visible
     * @returns {boolean}
     */
    isFilmstripVisible() {
        return !this.filmstrip.hasClass('hidden');
    },

    /**
     * Adjusts styles for filmstrip-only mode.
     */
    setFilmstripOnly() {
        this.filmstrip.addClass('filmstrip__videos-filmstripOnly');
    },

    /**
     * Returns the height of filmstrip
     * @returns {number} height
     */
    getFilmstripHeight() {
        if (this.isFilmstripVisible()) {
            return $(`.${this.filmstripContainerClassName}`).outerHeight();
        } else {
            return 0;
        }
    },

    /**
     * Returns the width of filmstip
     * @returns {number} width
     */
    getFilmstripWidth() {
        return this.filmstrip.innerWidth()
            - parseInt(this.filmstrip.css('paddingLeft'), 10)
            - parseInt(this.filmstrip.css('paddingRight'), 10);
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
     * Calculates available size for one thumbnail according to
     * the current window size.
     *
     * @returns {{availableWidth: number, availableHeight: number}}
     */
    calculateAvailableSize() {
        let availableHeight = interfaceConfig.FILM_STRIP_MAX_HEIGHT;
        let thumbs = this.getThumbs(true);
        let numvids = thumbs.remoteThumbs.length;

        let localVideoContainer = $("#localVideoContainer");

        /**
         * If the videoAreaAvailableWidth is set we use this one to calculate
         * the filmstrip width, because we're probably in a state where the
         * filmstrip size hasn't been updated yet, but it will be.
         */
        let videoAreaAvailableWidth
            = UIUtil.getAvailableVideoWidth()
            - this._getFilmstripExtraPanelsWidth()
            - UIUtil.parseCssInt(this.filmstrip.css('right'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('paddingLeft'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('paddingRight'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('borderLeftWidth'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('borderRightWidth'), 10)
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
     * Traverse all elements inside the filmstrip
     * and calculates the sum of all of them except
     * remote videos element. Used for calculation of
     * available width for video thumbnails.
     *
     * @returns {number} calculated width
     * @private
     */
    _getFilmstripExtraPanelsWidth() {
        let className = this.filmstripContainerClassName;
        let width = 0;
        $(`.${className}`)
            .children()
            .each(function () {
                if (this.id !== 'remoteVideos') {
                    width += $(this).outerWidth();
                }
            });
        return width;
    },

    /**
     Calculate the thumbnail size in order to fit all the thumnails in passed
     * dimensions.
     * NOTE: Here we assume that the remote and local thumbnails are with the
     * same height.
     * @param {int} availableWidth the maximum width for all thumbnails
     * @param {int} availableHeight the maximum height for all thumbnails
     * @returns {{localVideo, remoteVideo}}
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
        return {
                    localVideo:{
                        thumbWidth: lW,
                        thumbHeight: h
                    },
                    remoteVideo: {
                        thumbWidth: lW * remoteLocalWidthRatio,
                        thumbHeight: h
                    }
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
    resizeThumbnails(local, remote, animate = false, forceUpdate = false) {
        return new Promise(resolve => {
            let thumbs = this.getThumbs(!forceUpdate);
            let promises = [];

            if(thumbs.localThumb) {
                promises.push(new Promise((resolve) => {
                    thumbs.localThumb.animate({
                        height: local.thumbHeight,
                        width: local.thumbWidth
                    }, this._getAnimateOptions(animate, resolve));
                }));
            }
            if(thumbs.remoteThumbs) {
                promises.push(new Promise((resolve) => {
                    thumbs.remoteThumbs.animate({
                        height: remote.thumbHeight,
                        width: remote.thumbWidth
                    }, this._getAnimateOptions(animate, resolve));
                }));
            }
            promises.push(new Promise((resolve) => {
                this.filmstrip.animate({
                    // adds 2 px because of small video 1px border
                    height: remote.thumbHeight + 2
                }, this._getAnimateOptions(animate, resolve));
            }));

            promises.push(new Promise(() => {
                let { localThumb } = this.getThumbs();
                let height = localThumb.height();
                let fontSize = UIUtil.getIndicatorFontSize(height);
                this.filmstrip.find('.indicator').animate({
                    fontSize
                }, this._getAnimateOptions(animate, resolve));
            }));

            if (!animate) {
                resolve();
            }

            Promise.all(promises).then(resolve);
        });
    },

    /**
     * Helper method. Returns options for jQuery animation
     * @param animate {Boolean} - animation flag
     * @param cb {Function} - complete callback
     * @returns {Object} - animation options object
     * @private
     */
    _getAnimateOptions(animate, cb = $.noop) {
        return {
            queue: false,
            duration: animate ? 500 : 0,
            complete: cb
        };
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
        let remoteThumbs = this.filmstrip.children(selector)
            .not("#localVideoContainer");

        // Exclude the local video container if it has been hidden.
        if (localThumb.hasClass("hidden")) {
            return { remoteThumbs };
        } else {
            return { remoteThumbs, localThumb };
        }
    }
};

export default Filmstrip;
