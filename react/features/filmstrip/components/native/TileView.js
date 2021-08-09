// @flow

import React, { Component } from 'react';
import {
    FlatList,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import type { Dispatch } from 'redux';

import { getLocalParticipant, getParticipantCountWithFake } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { SQUARE_TILE_ASPECT_RATIO } from '../../constants';

import Thumbnail from './Thumbnail';
import styles from './styles';
import { setVisibleRemoteParticipants } from '../../actions.web';

/**
 * The type of the React {@link Component} props of {@link TileView}.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    _columns: number,

    /**
     * Application's viewport height.
     */
    _height: number,

    /**
     * The local participant.
     */
    _localParticipant: Object,

    /**
     * The number of participants in the conference.
     */
    _participantCount: number,

    /**
     * An array with the IDs of the remote participants in the conference.
     */
    _remoteParticipants: Array<string>,

    _thumbnailHeight: number,

    /**
     * Application's viewport height.
     */
    _width: number,

    /**
     * Invoked to update the receiver video quality.
     */
    dispatch: Dispatch<any>,

    /**
     * Callback to invoke when tile view is tapped.
     */
    onClick: Function
};

/**
 * Implements a React {@link Component} which displays thumbnails in a two
 * dimensional grid.
 *
 * @extends Component
 */
class TileView extends Component<Props> {

    /**
     *
     * @param {*} props
     */
    constructor(props: Props) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._getItemLayout = this._getItemLayout.bind(this);
        this._onViewableItemsChanged = this._onViewableItemsChanged.bind(this);
        this._getSortedParticipants = this._getSortedParticipants.bind(this);
        this._renderThumbnail = this._renderThumbnail.bind(this);
        this.viewabilityConfig = {
            itemVisiblePercentThreshold: 30
        };
        this._flatListStyles = {};
    }

    /**
     *
     * @param {*} item
     * @returns
     */
    _keyExtractor(item) {
        return item;
    }

    /**
     *
     * @param {*} data
     * @param {*} index
     * @returns
     */
    _getItemLayout(data, index) {
        const { _columns, _thumbnailHeight } = this.props;
        const cellHeight = _thumbnailHeight;

        return {
            length: cellHeight,
            offset: cellHeight * Math.floor(index / _columns),
            index
        };
    }

    /**
     * A handler for visible items changes.
     *
     * @param {Object} data - The visible items data.
     * @param {Array<Object>} data.viewableItems - The visible items array.
     * @returns {void}
     */
    _onViewableItemsChanged({ viewableItems = 0 }) {
        console.log(`visisble indexes ${JSON.stringify((viewableItems || []).map(i => i.index))}`);
        const indexArray = viewableItems.map(i => i.index);

        this.props.dispatch(setVisibleRemoteParticipants(Math.min(indexArray), Math.max(indexArray)));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _columns, _height, _thumbnailHeight, _width, onClick } = this.props;
        const participants = this._getSortedParticipants();
        const initialRowsToRender = Math.ceil(_height / _thumbnailHeight);

        if (this._flatListStyles.height !== _height || this._flatListStyles.width !== _width) {
            this._flatListStyles = {
                height: _height,
                width: _width
            };
        }

        return (
            <TouchableWithoutFeedback onPress = { onClick }>
                <FlatList
                    contentContainerStyle = { styles.tileView }
                    data = { participants }
                    horizontal = { false }
                    initialNumToRender = { initialRowsToRender }
                    key = { _columns }
                    keyExtractor = { this._keyExtractor }
                    numColumns = { _columns }
                    onViewableItemsChanged = { this._onViewableItemsChanged }
                    renderItem = { this._renderThumbnail }
                    style = { this._flatListStyles }
                    viewabilityConfig = { this.viewabilityConfig }
                    windowSize = { 2 } />
            </TouchableWithoutFeedback>
        );
    }

    /**
     * Returns all participants with the local participant at the end.
     *
     * @private
     * @returns {Participant[]}
     */
    _getSortedParticipants() {
        const { _localParticipant, _remoteParticipants } = this.props;
        const participants = [ ..._remoteParticipants ];

        _localParticipant && participants.push(_localParticipant.id);

        return participants;
    }

    /**
     * Creates React Elements to display each participant in a thumbnail. Each
     * tile will be.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderThumbnail({ item, index /*, separators */ }) {
        const { _thumbnailHeight } = this.props;
        const styleOverrides = {
            aspectRatio: SQUARE_TILE_ASPECT_RATIO,
            flex: 0,
            height: _thumbnailHeight,
            maxHeight: null,
            maxWidth: null,
            width: null
        };

        console.log(`1rendering thumbnail with index ${index}`);

        return (
            <Thumbnail
                disableTint = { true }
                height = { _thumbnailHeight }
                index = { index }
                key = { item }
                participantID = { item }
                renderDisplayName = { true }
                tileView = { true } />)
        ;
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code TileView}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const responsiveUi = state['features/base/responsive-ui'];
    const { remoteParticipants, tileViewDimensions } = state['features/filmstrip'];
    const { height } = tileViewDimensions.thumbnailSize;
    const { columns } = tileViewDimensions;

    return {
        _aspectRatio: responsiveUi.aspectRatio,
        _columns: columns,
        _height: responsiveUi.clientHeight,
        _localParticipant: getLocalParticipant(state),
        _participantCount: getParticipantCountWithFake(state),
        _remoteParticipants: remoteParticipants,
        _thumbnailHeight: height,
        _width: responsiveUi.clientWidth
    };
}

export default connect(_mapStateToProps)(TileView);
