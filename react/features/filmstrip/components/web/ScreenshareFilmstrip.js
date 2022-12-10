// @flow
import React from 'react';

import { connect } from '../../../base/redux';
import { LAYOUTS, LAYOUT_CLASSNAMES, getCurrentLayout } from '../../../video-layout';
import {
    FILMSTRIP_TYPE
} from '../../constants';
import { getScreenshareFilmstripParticipantId } from '../../functions';

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

const ScreenshareFilmstrip = (props: Props) => props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW
    && props._remoteParticipants.length === 1 && (
    <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
        <Filmstrip
            { ...props }
            filmstripType = { FILMSTRIP_TYPE.SCREENSHARE } />
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
    const {
        screenshareFilmstripDimensions: {
            filmstripHeight,
            filmstripWidth,
            thumbnailSize
        }
    } = state['features/filmstrip'];
    const id = getScreenshareFilmstripParticipantId(state);

    return {
        _columns: 1,
        _currentLayout: getCurrentLayout(state),
        _filmstripHeight: filmstripHeight,
        _filmstripWidth: filmstripWidth,
        _remoteParticipants: id ? [ id ] : [],
        _resizableFilmstrip: false,
        _rows: 1,
        _thumbnailWidth: thumbnailSize?.width,
        _thumbnailHeight: thumbnailSize?.height,
        _verticalViewGrid: false,
        _verticalViewBackground: false
    };
}

export default connect(_mapStateToProps)(ScreenshareFilmstrip);
