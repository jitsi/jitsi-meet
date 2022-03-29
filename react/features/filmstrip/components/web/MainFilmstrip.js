// @flow
import React from 'react';

import { getToolbarButtons } from '../../../base/config';
import { isMobileBrowser } from '../../../base/environment/utils';
import { connect } from '../../../base/redux';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import {
    ASPECT_RATIO_BREAKPOINT,
    FILMSTRIP_BREAKPOINT,
    FILMSTRIP_BREAKPOINT_OFFSET,
    TOOLBAR_HEIGHT,
    TOOLBAR_HEIGHT_MOBILE } from '../../constants';
import { isFilmstripResizable, showGridInVerticalView } from '../../functions.web';

import Filmstrip from './Filmstrip';

type Props = {

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The number of columns in tile view.
     */
    _columns: number,

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth: number,

    /**
     * The height of the filmstrip.
     */
    _filmstripHeight: number,

    /**
     * Whether the filmstrip has scroll or not.
     */
    _hasScroll: boolean,

    /**
     * Whether or not the current layout is vertical filmstrip.
     */
    _isVerticalFilmstrip: boolean,

    /**
     * The participants in the call.
     */
    _remoteParticipants: Array<Object>,

    /**
     * The length of the remote participants array.
     */
    _remoteParticipantsLength: number,

    /**
     * Whether or not the filmstrip should be user-resizable.
     */
    _resizableFilmstrip: boolean,

    /**
     * The number of rows in tile view.
     */
    _rows: number,

    /**
     * The height of the thumbnail.
     */
    _thumbnailHeight: number,

    /**
     * The width of the thumbnail.
     */
    _thumbnailWidth: number,

    /**
     * Whether or not the vertical filmstrip should have a background color.
     */
    _verticalViewBackground: boolean,

    /**
     * Whether or not the vertical filmstrip should be displayed as grid.
     */
    _verticalViewGrid: boolean,

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string,

    /**
     * Whether or not the filmstrip videos should currently be displayed.
     */
    _visible: boolean
};

const MainFilmstrip = (props: Props) => <span><Filmstrip { ...props } /></span>;

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const toolbarButtons = getToolbarButtons(state);
    const { visible, remoteParticipants, width: verticalFilmstripWidth } = state['features/filmstrip'];
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons.length;
    const {
        gridDimensions: dimensions = {},
        filmstripHeight,
        filmstripWidth,
        hasScroll: tileViewHasScroll,
        thumbnailSize: tileViewThumbnailSize
    } = state['features/filmstrip'].tileViewDimensions;
    const _currentLayout = getCurrentLayout(state);
    const _resizableFilmstrip = isFilmstripResizable(state);
    const _verticalViewGrid = showGridInVerticalView(state);
    let gridDimensions = dimensions;
    let _hasScroll = false;

    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const availableSpace = clientHeight - filmstripHeight;
    let filmstripPadding = 0;

    if (availableSpace > 0) {
        const paddingValue = TOOLBAR_HEIGHT_MOBILE - availableSpace;

        if (paddingValue > 0) {
            filmstripPadding = paddingValue;
        }
    } else {
        filmstripPadding = TOOLBAR_HEIGHT_MOBILE;
    }

    const collapseTileView = reduceHeight
        && isMobileBrowser()
        && clientWidth <= ASPECT_RATIO_BREAKPOINT;

    const shouldReduceHeight = reduceHeight && (
        isMobileBrowser() || _currentLayout !== LAYOUTS.VERTICAL_FILMSTRIP_VIEW);

    let _thumbnailSize, remoteFilmstripHeight, remoteFilmstripWidth;

    switch (_currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _hasScroll = Boolean(tileViewHasScroll);
        _thumbnailSize = tileViewThumbnailSize;
        remoteFilmstripHeight = filmstripHeight - (collapseTileView && filmstripPadding > 0 ? filmstripPadding : 0);
        remoteFilmstripWidth = filmstripWidth;
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
        const {
            remote,
            remoteVideosContainer,
            gridView,
            hasScroll
        } = state['features/filmstrip'].verticalViewDimensions;

        _hasScroll = Boolean(hasScroll);
        remoteFilmstripHeight = remoteVideosContainer?.height - (!_verticalViewGrid && shouldReduceHeight
            ? TOOLBAR_HEIGHT : 0);
        remoteFilmstripWidth = remoteVideosContainer?.width;

        if (_verticalViewGrid) {
            gridDimensions = gridView.gridDimensions;
            _thumbnailSize = gridView.thumbnailSize;
            _hasScroll = gridView.hasScroll;
        } else {
            _thumbnailSize = remote;
        }
        break;
    }
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const { remote, remoteVideosContainer, hasScroll } = state['features/filmstrip'].horizontalViewDimensions;

        _hasScroll = Boolean(hasScroll);
        _thumbnailSize = remote;
        remoteFilmstripHeight = remoteVideosContainer?.height;
        remoteFilmstripWidth = remoteVideosContainer?.width;
        break;
    }
    }

    return {
        _columns: gridDimensions.columns,
        _currentLayout,
        _filmstripHeight: remoteFilmstripHeight,
        _filmstripWidth: remoteFilmstripWidth,
        _hasScroll,
        _remoteParticipantsLength: remoteParticipants.length,
        _remoteParticipants: remoteParticipants,
        _resizableFilmstrip,
        _rows: gridDimensions.rows,
        _thumbnailWidth: _thumbnailSize?.width,
        _thumbnailHeight: _thumbnailSize?.height,
        _visible: visible,
        _verticalViewGrid,
        _verticalViewBackground: verticalFilmstripWidth.current + FILMSTRIP_BREAKPOINT_OFFSET >= FILMSTRIP_BREAKPOINT
    };
}

export default connect(_mapStateToProps)(MainFilmstrip);
