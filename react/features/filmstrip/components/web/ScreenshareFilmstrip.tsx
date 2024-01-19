import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { LAYOUTS, LAYOUT_CLASSNAMES } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    FILMSTRIP_TYPE
} from '../../constants';
import { getScreenshareFilmstripParticipantId } from '../../functions.web';

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
const ScreenshareFilmstrip = (props: IProps) =>
    props._currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW
        && props._remoteParticipants.length === 1 ? (
            <span className = { LAYOUT_CLASSNAMES[LAYOUTS.TILE_VIEW] }>
                <Filmstrip
                    { ...props }
                    filmstripType = { FILMSTRIP_TYPE.SCREENSHARE } />
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
