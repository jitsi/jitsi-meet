/* global $, APP, interfaceConfig */

import {
    LAYOUTS,
    getCurrentLayout,
    getMaxColumnCount,
    getTileViewGridDimensions,
    shouldDisplayTileView
} from '../../../react/features/video-layout';

import UIUtil from '../util/UIUtil';

const Filmstrip = {
    /**
     * Caches jquery lookups of the filmstrip for future use.
     */
    init() {
        this.filmstripContainerClassName = 'filmstrip';
        this.filmstrip = $('#remoteVideos');
        this.filmstripRemoteVideos = $('#filmstripRemoteVideosContainer');
    },

    /**
     * Shows if filmstrip is visible
     * @returns {boolean}
     */
    isFilmstripVisible() {
        return APP.store.getState()['features/filmstrip'].visible;
    },

    /**
     * Returns the height of filmstrip
     * @returns {number} height
     */
    getFilmstripHeight() {
        // FIXME Make it more clear the getFilmstripHeight check is used in
        // horizontal film strip mode for calculating how tall large video
        // display should be.
        if (this.isFilmstripVisible() && !interfaceConfig.VERTICAL_FILMSTRIP) {
            return $(`.${this.filmstripContainerClassName}`).outerHeight();
        }

        return 0;
    },

    /**
     * Returns the width of filmstip
     * @returns {number} width
     */
    getFilmstripWidth() {
        return this.isFilmstripVisible()
            ? this.filmstrip.outerWidth()
                - parseInt(this.filmstrip.css('paddingLeft'), 10)
                - parseInt(this.filmstrip.css('paddingRight'), 10)
            : 0;
    },

    /**
     * Calculates the size for thumbnails: local and remote one
     * @returns {*|{localVideo, remoteVideo}}
     */
    calculateThumbnailSize() {
        if (shouldDisplayTileView(APP.store.getState())) {
            return this._calculateThumbnailSizeForTileView();
        }

        const { availableWidth, availableHeight } = this.calculateAvailableSize();

        return this.calculateThumbnailSizeFromAvailable(availableWidth, availableHeight);
    },

    /**
     * Calculates available size for one thumbnail according to
     * the current window size.
     *
     * @returns {{availableWidth: number, availableHeight: number}}
     */
    calculateAvailableSize() {
        const state = APP.store.getState();
        const currentLayout = getCurrentLayout(state);
        const isHorizontalFilmstripView = currentLayout === LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW;

        /**
         * If the videoAreaAvailableWidth is set we use this one to calculate
         * the filmstrip width, because we're probably in a state where the
         * filmstrip size hasn't been updated yet, but it will be.
         */
        const videoAreaAvailableWidth
            = UIUtil.getAvailableVideoWidth()
            - this._getFilmstripExtraPanelsWidth()
            - UIUtil.parseCssInt(this.filmstrip.css('right'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('paddingLeft'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('paddingRight'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('borderLeftWidth'), 10)
            - UIUtil.parseCssInt(this.filmstrip.css('borderRightWidth'), 10)
            - 5;

        let availableHeight = interfaceConfig.FILM_STRIP_MAX_HEIGHT;
        let availableWidth = videoAreaAvailableWidth;
        const thumbs = this.getThumbs(true);

        // If local thumb is not hidden
        if (thumbs.localThumb) {
            const localVideoContainer = $('#localVideoContainer');

            availableWidth = Math.floor(
                videoAreaAvailableWidth - (
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
                        localVideoContainer.css('marginRight'), 10))
            );
        }

        // If the number of videos is 0 or undefined or we're not in horizontal
        // filmstrip mode we don't need to calculate further any adjustments
        // to width based on the number of videos present.
        const numvids = thumbs.remoteThumbs.length;

        if (numvids && isHorizontalFilmstripView) {
            const remoteVideoContainer = thumbs.remoteThumbs.eq(0);

            availableWidth = Math.floor(
                videoAreaAvailableWidth - (numvids * (
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

        // If the MAX_HEIGHT property hasn't been specified
        // we have the static value.
        const maxHeight = Math.min(interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120, availableHeight);

        availableHeight = Math.min(maxHeight, window.innerHeight - 18);

        return {
            availableHeight,
            availableWidth
        };
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
        const className = this.filmstripContainerClassName;
        let width = 0;

        $(`.${className}`)
            .children()
            .each(function() {
                /* eslint-disable no-invalid-this */
                if (this.id !== 'remoteVideos') {
                    width += $(this).outerWidth();
                }
                /* eslint-enable no-invalid-this */
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
         * remoteThumbsInRow - number of remote thumbnails in a row (we have
         * only one local thumbnail) next to the local thumbnail. In vertical
         * filmstrip mode, this will always be 0.
         *
         * Since the height for local thumbnail = height for remote thumbnail
         * and we know the ratio (width:height) for the local and for the
         * remote thumbnail we can find rW/lW:
         * rW / remoteRatio = lW / localRatio then -
         * remoteLocalWidthRatio = rW / lW = remoteRatio / localRatio
         * and rW = lW * remoteRatio / localRatio = lW * remoteLocalWidthRatio
         * And the total width for the thumbnails is:
         * totalWidth = rW * remoteThumbsInRow + lW
         * = lW * remoteLocalWidthRatio * remoteThumbsInRow + lW =
         * lW * (remoteLocalWidthRatio * remoteThumbsInRow + 1)
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

        const remoteThumbsInRow = interfaceConfig.VERTICAL_FILMSTRIP ? 0 : this.getThumbs(true).remoteThumbs.length;
        const remoteLocalWidthRatio = interfaceConfig.REMOTE_THUMBNAIL_RATIO / interfaceConfig.LOCAL_THUMBNAIL_RATIO;
        const lW = Math.min(availableWidth / ((remoteLocalWidthRatio * remoteThumbsInRow) + 1),
            availableHeight * interfaceConfig.LOCAL_THUMBNAIL_RATIO);
        const h = lW / interfaceConfig.LOCAL_THUMBNAIL_RATIO;

        const remoteVideoWidth = lW * remoteLocalWidthRatio;

        let localVideo;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            localVideo = {
                thumbWidth: remoteVideoWidth,
                thumbHeight: h * remoteLocalWidthRatio
            };
        } else {
            localVideo = {
                thumbWidth: lW,
                thumbHeight: h
            };
        }

        return {
            localVideo,
            remoteVideo: {
                thumbWidth: remoteVideoWidth,
                thumbHeight: h
            }
        };
    },

    /**
     * Calculates the size for thumbnails when in tile view layout.
     *
     * @returns {{localVideo, remoteVideo}}
     */
    _calculateThumbnailSizeForTileView() {
        const tileAspectRatio = 16 / 9;

        // The distance from the top and bottom of the screen, as set by CSS, to
        // avoid overlapping UI elements.
        const topBottomPadding = 200;

        // Minimum space to keep between the sides of the tiles and the sides
        // of the window.
        const sideMargins = 30 * 2;

        const state = APP.store.getState();

        const viewWidth = document.body.clientWidth - sideMargins;
        const viewHeight = document.body.clientHeight - topBottomPadding;

        const {
            columns,
            visibleRows
        } = getTileViewGridDimensions(state, getMaxColumnCount());
        const initialWidth = viewWidth / columns;
        const aspectRatioHeight = initialWidth / tileAspectRatio;

        const heightOfEach = Math.floor(Math.min(
            aspectRatioHeight,
            viewHeight / visibleRows
        ));
        const widthOfEach = Math.floor(tileAspectRatio * heightOfEach);

        return {
            localVideo: {
                thumbWidth: widthOfEach,
                thumbHeight: heightOfEach
            },
            remoteVideo: {
                thumbWidth: widthOfEach,
                thumbHeight: heightOfEach
            }
        };
    },

    /**
     * Resizes thumbnails
     * @param local
     * @param remote
     * @param forceUpdate
     * @returns {Promise}
     */
    // eslint-disable-next-line max-params
    resizeThumbnails(local, remote, forceUpdate = false) {
        const state = APP.store.getState();

        if (shouldDisplayTileView(state)) {
            // The size of the side margins for each tile as set in CSS.
            const sideMargins = 10 * 2;
            const { columns, rows } = getTileViewGridDimensions(state, getMaxColumnCount());
            const hasOverflow = rows > columns;

            // Width is set so that the flex layout can automatically wrap
            // tiles onto new rows.
            this.filmstripRemoteVideos.css({ width: (local.thumbWidth * columns) + (columns * sideMargins) });
            this.filmstripRemoteVideos.toggleClass('has-overflow', hasOverflow);
        } else {
            this.filmstripRemoteVideos.css('width', '');
        }

        const thumbs = this.getThumbs(!forceUpdate);

        if (thumbs.localThumb) {
            // eslint-disable-next-line no-shadow
            thumbs.localThumb.css({
                display: 'inline-block',
                height: `${local.thumbHeight}px`,
                'min-height': `${local.thumbHeight}px`,
                'min-width': `${local.thumbWidth}px`,
                width: `${local.thumbWidth}px`
            });

            const avatarSize = local.thumbHeight / 2;

            thumbs.localThumb.find('.avatar-container')
                .height(avatarSize)
                .width(avatarSize);
        }

        if (thumbs.remoteThumbs) {
            thumbs.remoteThumbs.css({
                display: 'inline-block',
                height: `${remote.thumbHeight}px`,
                'min-height': `${remote.thumbHeight}px`,
                'min-width': `${remote.thumbWidth}px`,
                width: `${remote.thumbWidth}px`
            });

            const avatarSize = remote.thumbHeight / 2;

            thumbs.remoteThumbs.find('.avatar-container')
                .height(avatarSize)
                .width(avatarSize);
        }

        const currentLayout = getCurrentLayout(APP.store.getState());

        // Let CSS take care of height in vertical filmstrip mode.
        if (currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
            $('#filmstripLocalVideo').css({
                // adds 4 px because of small video 2px border
                width: `${local.thumbWidth + 4}px`
            });
        } else if (currentLayout === LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW) {
            this.filmstrip.css({
                // adds 4 px because of small video 2px border
                height: `${remote.thumbHeight + 4}px`
            });
        }

        const { localThumb } = this.getThumbs();
        const height = localThumb ? localThumb.height() : 0;
        const fontSize = UIUtil.getIndicatorFontSize(height);

        this.filmstrip.find('.indicator').css({
            'font-size': `${fontSize}px`
        });
    },

    /**
     * Returns thumbnails of the filmstrip
     * @param onlyVisible
     * @returns {object} thumbnails
     */
    getThumbs(onlyVisible = false) {
        let selector = 'span';

        if (onlyVisible) {
            selector += ':visible';
        }

        const localThumb = $('#localVideoContainer');
        const remoteThumbs = this.filmstripRemoteVideos.children(selector);

        // Exclude the local video container if it has been hidden.
        if (localThumb.hasClass('hidden')) {
            return { remoteThumbs };
        }

        return { remoteThumbs,
            localThumb };

    }
};

export default Filmstrip;
