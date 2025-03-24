import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getHideSelfView } from '../../../base/settings/functions.any';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import { FILMSTRIP_TYPE, TILE_ASPECT_RATIO, TILE_HORIZONTAL_MARGIN } from '../../constants';
import { getActiveParticipantsIds, showGridInVerticalView } from '../../functions.web';

import Thumbnail from './Thumbnail';

/**
 * The type of the React {@code Component} props of {@link ThumbnailWrapper}.
 */
interface IProps {

    /**
     * Whether or not to hide the self view.
     */
    _disableSelfView?: boolean;

    /**
     * The type of filmstrip this thumbnail is displayed in.
     */
    _filmstripType?: string;

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails in the last row in tile view.
     */
    _horizontalOffset?: number;

    /**
     * Whether or not the thumbnail is a local screen share.
     */
    _isLocalScreenShare?: boolean;

    /**
     * The ID of the participant associated with the Thumbnail.
     */
    _participantID?: string;

    /**
     * The width of the thumbnail. Used for expanding the width of the thumbnails on last row in case
     * there is empty space.
     */
    _thumbnailWidth?: number;

    /**
     * The index of the column in tile view.
     */
    columnIndex?: number;

    /**
     * The index of the ThumbnailWrapper in stage view.
     */
    index?: number;

    /**
     * The index of the row in tile view.
     */
    rowIndex?: number;

    /**
     * The styles coming from react-window.
     */
    style: Object;
}

/**
 * A wrapper Component for the Thumbnail that translates the react-window specific props
 * to the Thumbnail Component's props.
 */
class ThumbnailWrapper extends Component<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            _disableSelfView,
            _filmstripType = FILMSTRIP_TYPE.MAIN,
            _isLocalScreenShare = false,
            _horizontalOffset = 0,
            _participantID,
            _thumbnailWidth,
            style
        } = this.props;

        if (typeof _participantID !== 'string') {
            return null;
        }

        if (_participantID === 'local') {
            return _disableSelfView ? null : (
                <Thumbnail
                    filmstripType = { _filmstripType }
                    horizontalOffset = { _horizontalOffset }
                    key = 'local'
                    style = { style }
                    width = { _thumbnailWidth } />);
        }

        if (_isLocalScreenShare) {
            return _disableSelfView ? null : (
                <Thumbnail
                    filmstripType = { _filmstripType }
                    horizontalOffset = { _horizontalOffset }
                    key = 'localScreenShare'
                    participantID = { _participantID }
                    style = { style }
                    width = { _thumbnailWidth } />);
        }

        return (
            <Thumbnail
                filmstripType = { _filmstripType }
                horizontalOffset = { _horizontalOffset }
                key = { `remote_${_participantID}` }
                participantID = { _participantID }
                style = { style }
                width = { _thumbnailWidth } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ThumbnailWrapper}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: { columnIndex: number;
    data: { filmstripType: string; }; index?: number; rowIndex: number; }) {
    const _currentLayout = getCurrentLayout(state);
    const { remoteParticipants: remote } = state['features/filmstrip'];
    const activeParticipants = getActiveParticipantsIds(state);
    const disableSelfView = getHideSelfView(state);
    const _verticalViewGrid = showGridInVerticalView(state);
    const filmstripType = ownProps.data?.filmstripType;
    const stageFilmstrip = filmstripType === FILMSTRIP_TYPE.STAGE;
    const sortedActiveParticipants = activeParticipants.sort();
    const remoteParticipants = stageFilmstrip ? sortedActiveParticipants : remote;
    const remoteParticipantsLength = remoteParticipants.length;
    const localId = getLocalParticipant(state)?.id;

    if (_currentLayout === LAYOUTS.TILE_VIEW || _verticalViewGrid || stageFilmstrip) {
        const { columnIndex, rowIndex } = ownProps;
        const { tileViewDimensions, stageFilmstripDimensions, verticalViewDimensions } = state['features/filmstrip'];
        const { gridView } = verticalViewDimensions;
        let gridDimensions = tileViewDimensions?.gridDimensions,
            thumbnailSize = tileViewDimensions?.thumbnailSize;

        if (stageFilmstrip) {
            gridDimensions = stageFilmstripDimensions.gridDimensions;
            thumbnailSize = stageFilmstripDimensions.thumbnailSize;
        } else if (_verticalViewGrid) {
            gridDimensions = gridView?.gridDimensions;
            thumbnailSize = gridView?.thumbnailSize;
        }
        const { columns = 1, rows = 1 } = gridDimensions ?? {};
        const index = (rowIndex * columns) + columnIndex;
        let horizontalOffset, thumbnailWidth;
        const { iAmRecorder, disableTileEnlargement } = state['features/base/config'];
        const { localScreenShare } = state['features/base/participants'];
        const localParticipantsLength = localScreenShare ? 2 : 1;

        let participantsLength;

        if (stageFilmstrip) {
            // We use the length of activeParticipants in stage filmstrip which includes local participants.
            participantsLength = remoteParticipantsLength;
        } else {
            // We need to include the local screenshare participant in tile view.
            participantsLength = remoteParticipantsLength

            // Add local camera and screen share to total participant count when self view is not disabled.
            + (disableSelfView ? 0 : localParticipantsLength)

            // Removes iAmRecorder from the total participants count.
            - (iAmRecorder ? 1 : 0);
        }

        if (rowIndex === rows - 1) { // center the last row
            const partialLastRowParticipantsNumber = participantsLength % columns;

            if (partialLastRowParticipantsNumber > 0) {
                const { width = 1, height = 1 } = thumbnailSize ?? {};
                const availableWidth = columns * (width + TILE_HORIZONTAL_MARGIN);
                let widthDifference = 0;
                let widthToUse = width;

                if (!disableTileEnlargement) {
                    thumbnailWidth = Math.min(
                        (availableWidth / partialLastRowParticipantsNumber) - TILE_HORIZONTAL_MARGIN,
                        height * TILE_ASPECT_RATIO);
                    widthDifference = thumbnailWidth - width;
                    widthToUse = thumbnailWidth;
                }

                horizontalOffset
                    = Math.floor((availableWidth
                        - (partialLastRowParticipantsNumber * (widthToUse + TILE_HORIZONTAL_MARGIN))) / 2
                    )
                    + (columnIndex * widthDifference);
            }
        }

        if (index > participantsLength - 1) {
            return {};
        }

        if (stageFilmstrip) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _participantID: remoteParticipants[index] === localId ? 'local' : remoteParticipants[index],
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        // When the thumbnails are reordered, local participant is inserted at index 0.
        const localIndex = disableSelfView ? remoteParticipantsLength : 0;

        // Local screen share is inserted at index 1 after the local camera.
        const localScreenShareIndex = disableSelfView ? remoteParticipantsLength : 1;
        const remoteIndex = !iAmRecorder && !disableSelfView
            ? index - localParticipantsLength
            : index;

        if (!iAmRecorder && index === localIndex) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _participantID: 'local',
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        if (!iAmRecorder && localScreenShare && index === localScreenShareIndex) {
            return {
                _disableSelfView: disableSelfView,
                _filmstripType: filmstripType,
                _isLocalScreenShare: true,
                _participantID: localScreenShare?.id,
                _horizontalOffset: horizontalOffset,
                _thumbnailWidth: thumbnailWidth
            };
        }

        return {
            _filmstripType: filmstripType,
            _participantID: remoteParticipants[remoteIndex],
            _horizontalOffset: horizontalOffset,
            _thumbnailWidth: thumbnailWidth
        };
    }

    if (_currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && filmstripType === FILMSTRIP_TYPE.SCREENSHARE) {
        const { screenshareFilmstripParticipantId } = state['features/filmstrip'];
        const screenshares = state['features/video-layout'].remoteScreenShares;
        let id = screenshares.find(sId => sId === screenshareFilmstripParticipantId);

        if (!id && screenshares.length) {
            id = screenshares[screenshares.length - 1];
        }

        return {
            _filmstripType: filmstripType,
            _participantID: id
        };
    }

    const { index } = ownProps;

    if (typeof index !== 'number' || remoteParticipantsLength <= index) {
        return {};
    }

    return {
        _participantID: remoteParticipants[index]
    };
}

export default connect(_mapStateToProps)(ThumbnailWrapper);
