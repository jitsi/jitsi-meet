/* @flow */
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-window';

import { getPinnedParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { shouldHideSelfView } from '../../../base/settings/functions.any';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import { showGridInVerticalView } from '../../functions';

import Thumbnail from './Thumbnail';

/**
 * The type of the React {@code Component} props of {@link ThumbnailWrapper}.
 */
type Props = {

    /**
     * Whether or not to hide the self view.
     */
    _disableSelfView: boolean,

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails in the last row in tile view.
     */
    _horizontalOffset: number,

    /**
     * Whether or not there is a pinned participant.
     */
    _isAnyParticipantPinned: boolean,

    /**
     * The ID of the participant associated with the Thumbnail.
     */
    _participantID: ?string,

    /**
     * The index of the column in tile view.
     */
    columnIndex?: number,

    /**
     * The index of the ThumbnailWrapper in stage view.
     */
    index?: number,

    /**
     * The index of the row in tile view.
     */
    rowIndex?: number,

    /**
     * The styles comming from react-window.
     */
    style: Object
};

/**
 * A wrapper Component for the Thumbnail that translates the react-window specific props
 * to the Thumbnail Component's props.
 */
class ThumbnailWrapper extends Component<Props> {

    /**
     * Creates new ThumbnailWrapper instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
    }

    shouldComponentUpdate: Props => boolean;

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _participantID, style, _horizontalOffset = 0, _isAnyParticipantPinned, _disableSelfView } = this.props;

        if (typeof _participantID !== 'string') {
            return null;
        }

        if (_participantID === 'local') {
            return _disableSelfView ? null : (
                <Thumbnail
                    _isAnyParticipantPinned = { _isAnyParticipantPinned }
                    horizontalOffset = { _horizontalOffset }
                    key = 'local'
                    style = { style } />);
        }

        return (
            <Thumbnail
                _isAnyParticipantPinned = { _isAnyParticipantPinned }
                horizontalOffset = { _horizontalOffset }
                key = { `remote_${_participantID}` }
                participantID = { _participantID }
                style = { style } />);
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ThumbnailWrapper}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const _currentLayout = getCurrentLayout(state);
    const { remoteParticipants } = state['features/filmstrip'];
    const remoteParticipantsLength = remoteParticipants.length;
    const { testing = {} } = state['features/base/config'];
    const disableSelfView = shouldHideSelfView(state);
    const enableThumbnailReordering = testing.enableThumbnailReordering ?? true;
    const _verticalViewGrid = showGridInVerticalView(state);
    const _isAnyParticipantPinned = Boolean(getPinnedParticipant(state));

    if (_currentLayout === LAYOUTS.TILE_VIEW || _verticalViewGrid) {
        const { columnIndex, rowIndex } = ownProps;
        const { gridDimensions: dimensions = {}, thumbnailSize: size } = state['features/filmstrip'].tileViewDimensions;
        const { gridView } = state['features/filmstrip'].verticalViewDimensions;
        const gridDimensions = _verticalViewGrid ? gridView.gridDimensions : dimensions;
        const thumbnailSize = _verticalViewGrid ? gridView.thumbnailSize : size;
        const { columns, rows } = gridDimensions;
        const index = (rowIndex * columns) + columnIndex;
        let horizontalOffset;
        const { iAmRecorder } = state['features/base/config'];
        const participantsLenght = remoteParticipantsLength + (iAmRecorder ? 0 : 1) - (disableSelfView ? 1 : 0);

        if (rowIndex === rows - 1) { // center the last row
            const { width: thumbnailWidth } = thumbnailSize;
            const partialLastRowParticipantsNumber = participantsLenght % columns;

            if (partialLastRowParticipantsNumber > 0) {
                horizontalOffset = Math.floor((columns - partialLastRowParticipantsNumber) * (thumbnailWidth + 4) / 2);
            }
        }

        if (index > participantsLenght - 1) {
            return {};
        }

        // When the thumbnails are reordered, local participant is inserted at index 0.
        const localIndex = enableThumbnailReordering && !disableSelfView ? 0 : remoteParticipantsLength;
        const remoteIndex = enableThumbnailReordering && !iAmRecorder && !disableSelfView ? index - 1 : index;

        if (!iAmRecorder && index === localIndex) {
            return {
                _disableSelfView: disableSelfView,
                _participantID: 'local',
                _horizontalOffset: horizontalOffset,
                _isAnyParticipantPinned: _verticalViewGrid && _isAnyParticipantPinned
            };
        }

        return {
            _participantID: remoteParticipants[remoteIndex],
            _horizontalOffset: horizontalOffset,
            _isAnyParticipantPinned: _verticalViewGrid && _isAnyParticipantPinned
        };
    }

    const { index } = ownProps;

    if (typeof index !== 'number' || remoteParticipantsLength <= index) {
        return {};
    }

    return {
        _participantID: remoteParticipants[index],
        _isAnyParticipantPinned
    };
}

export default connect(_mapStateToProps)(ThumbnailWrapper);
