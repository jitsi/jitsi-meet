// @flow
import React from 'react';

import { getToolbarButtons } from '../../../base/config';
import { isMobileBrowser } from '../../../base/environment/utils';
import { connect } from '../../../base/redux';
import { LAYOUT_CLASSNAMES } from '../../../conference/components/web/Conference';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import {
    ASPECT_RATIO_BREAKPOINT,
    FILMSTRIP_TYPE,
    TOOLBAR_HEIGHT_MOBILE
} from '../../constants';
import { getActiveParticipantsIds } from '../../functions';
import { isFilmstripResizable, isStageFilmstripTopPanel } from '../../functions.web';

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
    _videosClassName: string
};

const StageFilmstrip = (props: Props) => props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && (
    <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
        <Filmstrip
            { ...props }
            filmstripType = { FILMSTRIP_TYPE.STAGE } />
    </span>
);

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const toolbarButtons = getToolbarButtons(state);
    const activeParticipants = getActiveParticipantsIds(state);
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons.length;
    const {
        gridDimensions: dimensions = {},
        filmstripHeight,
        filmstripWidth,
        thumbnailSize
    } = state['features/filmstrip'].stageFilmstripDimensions;
    const gridDimensions = dimensions;

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

    const remoteFilmstripHeight = filmstripHeight - (collapseTileView && filmstripPadding > 0 ? filmstripPadding : 0);
    const _topPanelFilmstrip = isStageFilmstripTopPanel(state);

    return {
        _columns: gridDimensions.columns,
        _currentLayout: getCurrentLayout(state),
        _filmstripHeight: remoteFilmstripHeight,
        _filmstripWidth: filmstripWidth,
        _remoteParticipants: activeParticipants,
        _resizableFilmstrip: isFilmstripResizable(state) && _topPanelFilmstrip,
        _rows: gridDimensions.rows,
        _thumbnailWidth: thumbnailSize?.width,
        _thumbnailHeight: thumbnailSize?.height,
        _topPanelFilmstrip,
        _verticalViewGrid: false,
        _verticalViewBackground: false
    };
}

export default connect(_mapStateToProps)(StageFilmstrip);
