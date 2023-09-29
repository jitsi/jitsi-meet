import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getToolbarButtons } from '../../../base/config/functions.web';
import { isMobileBrowser } from '../../../base/environment/utils';
import { LAYOUTS, LAYOUT_CLASSNAMES } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    ASPECT_RATIO_BREAKPOINT,
    FILMSTRIP_TYPE,
    TOOLBAR_HEIGHT_MOBILE
} from '../../constants';
import { getActiveParticipantsIds, isFilmstripResizable, isStageFilmstripTopPanel } from '../../functions.web';

import Filmstrip from './Filmstrip';

interface IProps {

    /**
     * The number of columns in tile view.
     */
    _columns: number;

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout?: string;

    /**
     * The height of the filmstrip.
     */
    _filmstripHeight?: number;

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth?: number;

    /**
     * Whether or not the current layout is vertical filmstrip.
     */
    _isVerticalFilmstrip: boolean;

    /**
     * The participants in the call.
     */
    _remoteParticipants: Array<Object>;

    /**
     * The length of the remote participants array.
     */
    _remoteParticipantsLength: number;

    /**
     * Whether or not the filmstrip should be user-resizable.
     */
    _resizableFilmstrip: boolean;

    /**
     * The number of rows in tile view.
     */
    _rows: number;

    /**
     * The height of the thumbnail.
     */
    _thumbnailHeight?: number;

    /**
     * The width of the thumbnail.
     */
    _thumbnailWidth?: number;

    /**
     * Whether or not the vertical filmstrip should have a background color.
     */
    _verticalViewBackground: boolean;

    /**
     * Whether or not the vertical filmstrip should be displayed as grid.
     */
    _verticalViewGrid: boolean;

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string;
}

// eslint-disable-next-line no-confusing-arrow
const StageFilmstrip = (props: IProps) =>
    props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW ? (
        <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
            <Filmstrip
                { ...props }
                filmstripType = { FILMSTRIP_TYPE.STAGE } />
        </span>
    ) : null
;

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Components' own props.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const toolbarButtons = getToolbarButtons(state);
    const activeParticipants = getActiveParticipantsIds(state);
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons.length;
    const {
        gridDimensions: dimensions = { columns: undefined,
            rows: undefined },
        filmstripHeight,
        filmstripWidth,
        thumbnailSize
    } = state['features/filmstrip'].stageFilmstripDimensions;
    const gridDimensions = dimensions;

    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const availableSpace = clientHeight - Number(filmstripHeight);
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

    const remoteFilmstripHeight = Number(filmstripHeight) - (
        collapseTileView && filmstripPadding > 0 ? filmstripPadding : 0);
    const _topPanelFilmstrip = isStageFilmstripTopPanel(state);

    return {
        _columns: gridDimensions.columns ?? 1,
        _currentLayout: getCurrentLayout(state),
        _filmstripHeight: remoteFilmstripHeight,
        _filmstripWidth: filmstripWidth,
        _remoteParticipants: activeParticipants,
        _resizableFilmstrip: isFilmstripResizable(state) && _topPanelFilmstrip,
        _rows: gridDimensions.rows ?? 1,
        _thumbnailWidth: thumbnailSize?.width,
        _thumbnailHeight: thumbnailSize?.height,
        _topPanelFilmstrip,
        _verticalViewGrid: false,
        _verticalViewBackground: false
    };
}

export default connect(_mapStateToProps)(StageFilmstrip);
