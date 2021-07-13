/* @flow */
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-window';

import { connect } from '../../../base/redux';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

import Thumbnail from './Thumbnail';

/**
 * The type of the React {@code Component} props of {@link ThumbnailWrapper}.
 */
type Props = {

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails in the last row in tile view.
     */
     _horizontalOffset: number,

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
        const { _participantID, style, _horizontalOffset = 0 } = this.props;

        if (typeof _participantID !== 'string') {
            return null;
        }

        if (_participantID === 'local') {
            return (
                <Thumbnail
                    horizontalOffset = { _horizontalOffset }
                    key = 'local'
                    style = { style } />);
        }

        return (
            <Thumbnail
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

    if (_currentLayout === LAYOUTS.TILE_VIEW) {
        const { columnIndex, rowIndex } = ownProps;
        const { gridDimensions = {}, thumbnailSize } = state['features/filmstrip'].tileViewDimensions;
        const { columns, rows } = gridDimensions;
        const index = (rowIndex * columns) + columnIndex;
        let horizontalOffset;

        if (rowIndex === rows - 1) { // center the last row
            const { width: thumbnailWidth } = thumbnailSize;
            const { iAmRecorder } = state['features/base/config'];
            const partialLastRowParticipantsNumber = (remoteParticipantsLength + (iAmRecorder ? 0 : 1)) % columns;

            if (partialLastRowParticipantsNumber > 0) {
                horizontalOffset = Math.floor((columns - partialLastRowParticipantsNumber) * (thumbnailWidth + 4) / 2);
            }
        }

        if (index > remoteParticipantsLength) {
            return {};
        }

        if (index === remoteParticipantsLength) {
            return {
                _participantID: 'local',
                _horizontalOffset: horizontalOffset
            };
        }

        return {
            _participantID: remoteParticipants[index],
            _horizontalOffset: horizontalOffset
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
