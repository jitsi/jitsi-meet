// @flow

import React, { Component } from 'react';
import {
    Dimensions,
    ScrollView,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { connect } from 'react-redux';

import {
    getNearestReceiverVideoQualityLevel,
    setMaxReceiverVideoQuality
} from '../../../base/conference';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui';

import Thumbnail from './Thumbnail';
import styles from './styles';

/**
 * TileView component's property types.
 */
type Props = {

    /**
     * Whether or not the screen is currently in portrait orientation.
     */
    _isNarrowAspectRatio: boolean,

    /**
     * The participants in the conference.
     */
    _participants: Array<any>,

    /**
     * Invoked to update the receiver video quality.
     */
    dispatch: Dispatch<*>,

    /**
     * Callback to invoke when tile view is tapped.
     */
    onClick: Function
};

const TILE_ASPECT_RATIO = 1;

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class TileView extends Component<Props> {
    /**
     * Updates the receiver video quality.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateReceiverQuality();
    }

    /**
     * Updates the receiver video quality.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this._updateReceiverQuality();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { onClick } = this.props;
        const { height, width } = this._getScreenDimensions();
        const rowElements = this._groupIntoRows(
            this._renderThumbnails(), this._getColumnCount());

        return (
            <ScrollView
                style = {{
                    ...styles.tileView,
                    height,
                    width
                }}>
                <TouchableWithoutFeedback onPress = { onClick }>
                    <View
                        style = {{
                            ...styles.tileViewRows,
                            minHeight: height,
                            minWidth: width
                        }}>
                        { rowElements }
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        );
    }

    /**
     * Returns how many columns should be displayed for tile view.
     *
     * @returns {number}
     * @private
     */
    _getColumnCount() {
        const participantCount = this.props._participants.length;

        // For narrow view, tiles should stack on top of each other for a lonely
        // call and a 1:1 call. Otherwise tiles should be grouped into rows of
        // two.
        if (this.props._isNarrowAspectRatio) {
            return participantCount >= 3 ? 2 : 1;
        }

        if (participantCount === 4) {
            // In wide view, a four person call should display as a 2x2 grid.
            return 2;
        }

        return participantCount >= 3 ? 3 : participantCount;
    }

    /**
     * Returns the current height and width of the screen.
     *
     * @private
     * @returns {Object}
     */
    _getScreenDimensions() {
        return Dimensions.get('window');
    }

    /**
     * Returns all participants with the local participant at the end.
     *
     * @private
     * @returns {Participant[]}
     */
    _getSortedParticipants() {
        const participants = [];
        let localParticipant;

        this.props._participants.forEach(participant => {
            if (participant.local) {
                localParticipant = participant;
            } else {
                participants.push(participant);
            }
        });

        if (localParticipant) {
            participants.push(localParticipant);
        }

        return participants;
    }

    /**
     * Calculate the height and width for the tiles.
     *
     * @private
     * @returns {Object}
     */
    _getTileDimensions() {
        const { _participants } = this.props;
        const { height, width } = this._getScreenDimensions();
        const columns = this._getColumnCount();
        const participantCount = _participants.length;
        const heightToUse = height - 20;
        const widthToUse = width - 20;
        let tileWidth;

        // If there is going to be at least two rows, ensure that at least two
        // rows display fully on screen.
        if (participantCount / columns > 1) {
            tileWidth
                = Math.min(widthToUse / columns, heightToUse / 2);
        } else {
            tileWidth = Math.min(widthToUse / columns, heightToUse);
        }

        return {
            height: tileWidth / TILE_ASPECT_RATIO,
            width: tileWidth
        };
    }

    /**
     * Splits a list of thumbnails into React Elements with a maximum of
     * {@link rowLength} thumbnails in each.
     *
     * @param {Array} thumbnails - The list of thumbnails that should be split
     * into separate row groupings.
     * @param {number} rowLength - How many thumbnails should be in each row.
     * @private
     * @returns {ReactElement[]}
     */
    _groupIntoRows(thumbnails, rowLength) {
        const rowElements = [];

        for (let i = 0; i < thumbnails.length; i++) {
            if (i % rowLength === 0) {
                const thumbnailsInRow
                    = thumbnails.slice(i, i + rowLength);

                rowElements.push(
                    <View
                        key = { rowElements.length }
                        style = { styles.tileViewRow }>
                        { thumbnailsInRow }
                    </View>
                );
            }
        }

        return rowElements;
    }

    /**
     * Creates React Elements to display each participant in a thumbnail. Each
     * tile will be.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderThumbnails() {
        const styleOverrides = {
            aspectRatio: TILE_ASPECT_RATIO,
            flex: 0,
            height: this._getTileDimensions().height,
            width: null
        };

        return this._getSortedParticipants()
            .map(participant => (
                <Thumbnail
                    disablePin = { true }
                    key = { participant.id }
                    participant = { participant }
                    styleOverrides = { styleOverrides } />));
    }

    /**
     * Sets the receiver video quality based on the dimensions of the thumbnails
     * that are displayed.
     *
     * @private
     * @returns {void}
     */
    _updateReceiverQuality() {
        const { height } = this._getTileDimensions();
        const qualityLevel = getNearestReceiverVideoQualityLevel(height);

        this.props.dispatch(setMaxReceiverVideoQuality(qualityLevel));
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code TileView}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _isNarrowAspectRatio: string,
 *     _participants: Participant[]
 * }}
 */
function _mapStateToProps(state) {
    const { aspectRatio } = state['features/base/responsive-ui'];

    return {
        _isNarrowAspectRatio: aspectRatio === ASPECT_RATIO_NARROW,
        _participants: state['features/base/participants']
    };
}

export default connect(_mapStateToProps)(TileView);
