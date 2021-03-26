/* @flow */
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-window';

import { connect } from '../../../base/redux';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

import Thumbnail from './Thumbnail';

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
type Props = {
    columnIndex?: number,
    _participantID: ?string,
    rowIndex?: number,
    index: number,
    style: Object,
    _verticalOffset: number
};

/**
 *
 */
class ThumbnailWrapper extends Component<Props> {

    /**
     *
     * @param {Props} props
     */
    constructor(props: Props) {
        super(props);

        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
    }

    /**
     *
     * @returns
     */
    render() {
        const { _participantID, style, _verticalOffset = 0 } = this.props;

        if (typeof _participantID !== 'string') {
            return null;
        }

        if (_participantID === 'local') {
            return (
                <Thumbnail
                    key = 'local'
                    style = { style }
                    verticalOffset = { _verticalOffset } />);
        }

        return (
            <Thumbnail
                key = { `remote_${_participantID}` }
                participantID = { _participantID }
                style = { style }
                verticalOffset = { _verticalOffset } />);
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
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

    if (_currentLayout === LAYOUTS.TILE_VIEW) {
        const { columnIndex, rowIndex } = ownProps;
        const { gridDimensions = {}, thumbnailSize } = state['features/filmstrip'].tileViewDimensions;
        const { columns, rows } = gridDimensions;
        const index = (rowIndex * columns) + columnIndex;
        let verticalOffset;

        if (rowIndex === rows - 1) { // center the last row
            const { width: thumbnailWidth } = thumbnailSize;
            const participantsInTheLastRow = (remoteParticipantsLength + 1) % columns;

            if (participantsInTheLastRow > 0) {
                verticalOffset = Math.floor((columns - participantsInTheLastRow) * (thumbnailWidth + 4) / 2);
            }

        }

        if (index > remoteParticipantsLength) {
            return {};
        }

        if (index === remoteParticipantsLength) {
            return {
                _participantID: 'local',
                _verticalOffset: verticalOffset
            };
        }


        return {
            _participantID: remoteParticipants[index],
            _verticalOffset: verticalOffset
        };

    }

    const { index } = ownProps;

    if (typeof index !== 'number' || remoteParticipantsLength <= index) {
        return {};
    }

    return {
        _participantID: remoteParticipants[remoteParticipantsLength - index - 1]
    };
}

export default connect(_mapStateToProps)(ThumbnailWrapper);
