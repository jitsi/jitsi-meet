// @flow

import React, { PureComponent } from 'react';
import { FlatList, SafeAreaView } from 'react-native';

import { getLocalParticipant } from '../../../base/participants';
import { Platform } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { setVisibleRemoteParticipants } from '../../actions';
import { isFilmstripVisible, shouldRemoteVideosBeVisible } from '../../functions';

import LocalThumbnail from './LocalThumbnail';
import Thumbnail from './Thumbnail';
import styles from './styles';

// Immutable reference to avoid re-renders.
const NO_REMOTE_VIDEOS = [];

/**
 * Filmstrip component's property types.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    _clientWidth: number,

    _clientHeight: number,

    _localParticipantId: string,

    /**
     * The participants in the conference.
     */
    _participants: Array<any>,

    /**
     * The indicator which determines whether the filmstrip is visible.
     */
    _visible: boolean,

    /**
     * Invoked to trigger state changes in Redux.
     */
    dispatch: Function,
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @augments Component
 */
class Filmstrip extends PureComponent<Props> {
    /**
     * Whether the local participant should be rendered separately from the
     * remote participants ie outside of their {@link ScrollView}.
     */
    _separateLocalThumbnail: boolean;

    /**
     * The FlatList's viewabilityConfig.
     */
    _viewabilityConfig: Object;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // XXX Our current design is to have the local participant separate from
        // the remote participants. Unfortunately, Android's Video
        // implementation cannot accommodate that because remote participants'
        // videos appear on top of the local participant's video at times.
        // That's because Android's Video utilizes EGL and EGL gives us only two
        // practical layers in which we can place our participants' videos:
        // layer #0 sits behind the window, creates a hole in the window, and
        // there we render the LargeVideo; layer #1 is known as media overlay in
        // EGL terms, renders on top of layer #0, and, consequently, is for the
        // Filmstrip. With the separate LocalThumnail, we should have left the
        // remote participants' Thumbnails in layer #1 and utilized layer #2 for
        // LocalThumbnail. Unfortunately, layer #2 is not practical (that's why
        // I said we had two practical layers only) because it renders on top of
        // everything which in our case means on top of participant-related
        // indicators such as moderator, audio and video muted, etc. For now we
        // do not have much of a choice but to continue rendering LocalThumbnail
        // as any other remote Thumbnail on Android.
        this._separateLocalThumbnail = Platform.OS !== 'android';

        this._viewabilityConfig = {
            itemVisiblePercentThreshold: 30,
            minimumViewTime: 500
        };

        this._keyExtractor = this._keyExtractor.bind(this);
        this._getItemLayout = this._getItemLayout.bind(this);
        this._onViewableItemsChanged = this._onViewableItemsChanged.bind(this);
        this._renderThumbnail = this._renderThumbnail.bind(this);
    }

    _keyExtractor: string => string;

    /**
     * Returns a key for a passed item of the list.
     *
     * @param {string} item - The user ID.
     * @returns {string} - The user ID.
     */
    _keyExtractor(item) {
        return item;
    }

    /**
     * Calculates the width and height of the filmstrip based on the screen size and aspect ratio.
     *
     * @returns {Object} - The width and the height.
     */
    _getDimensions() {
        const { _aspectRatio, _clientWidth, _clientHeight } = this.props;
        const { height, width, margin } = styles.thumbnail;

        if (_aspectRatio === ASPECT_RATIO_NARROW) {
            return {
                height,
                width: this._separateLocalThumbnail ? _clientWidth - width - (margin * 2) : _clientWidth
            };
        }

        return {
            height: this._separateLocalThumbnail ? _clientHeight - height - (margin * 2) : _clientHeight,
            width
        };
    }

    _getItemLayout: (?Array<string>, number) => {length: number, offset: number, index: number};

    /**
     * Optimization for FlatList. Returns the length, offset and index for an item.
     *
     * @param {Array<string>} data - The data array with user IDs.
     * @param {number} index - The index number of the item.
     * @returns {Object}
     */
    _getItemLayout(data, index) {
        const { _aspectRatio } = this.props;
        const isNarrowAspectRatio = _aspectRatio === ASPECT_RATIO_NARROW;
        const length = isNarrowAspectRatio ? styles.thumbnail.width : styles.thumbnail.height;

        return {
            length,
            offset: length * index,
            index
        };
    }

    _onViewableItemsChanged: Object => void;

    /**
     * A handler for visible items changes.
     *
     * @param {Object} data - The visible items data.
     * @param {Array<Object>} data.viewableItems - The visible items array.
     * @returns {void}
     */
    _onViewableItemsChanged({ viewableItems = [] }) {
        if (!this._separateLocalThumbnail && viewableItems[0]?.index === 0) {
            // Skip the local thumbnail.
            viewableItems.shift();
        }

        if (viewableItems.length === 0) {
            // User might be fast-scrolling, it will stabilize.
            return;
        }

        let startIndex = viewableItems[0].index;
        let endIndex = viewableItems[viewableItems.length - 1].index;

        if (!this._separateLocalThumbnail) {
            // We are off by one in the remote participants array.
            startIndex -= 1;
            endIndex -= 1;
        }

        this.props.dispatch(setVisibleRemoteParticipants(startIndex, endIndex));
    }

    _renderThumbnail: Object => Object;

    /**
     * Creates React Element to display each participant in a thumbnail.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderThumbnail({ item /* , index , separators */ }) {
        return (
            <Thumbnail
                key = { item }
                participantID = { item } />)
        ;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _aspectRatio, _localParticipantId, _participants, _visible } = this.props;

        if (!_visible) {
            return null;
        }

        const isNarrowAspectRatio = _aspectRatio === ASPECT_RATIO_NARROW;
        const filmstripStyle = isNarrowAspectRatio ? styles.filmstripNarrow : styles.filmstripWide;
        const { height, width } = this._getDimensions();
        const { height: thumbnailHeight, width: thumbnailWidth, margin } = styles.thumbnail;
        const initialNumToRender = Math.ceil(isNarrowAspectRatio
            ? width / (thumbnailWidth + (2 * margin))
            : height / (thumbnailHeight + (2 * margin))
        );
        const participants = this._separateLocalThumbnail ? _participants : [ _localParticipantId, ..._participants ];

        return (
            <SafeAreaView style = { filmstripStyle }>
                {
                    this._separateLocalThumbnail
                        && !isNarrowAspectRatio
                        && <LocalThumbnail />
                }
                <FlatList
                    bounces = { false }
                    data = { participants }
                    getItemLayout = { this._getItemLayout }
                    horizontal = { isNarrowAspectRatio }
                    initialNumToRender = { initialNumToRender }
                    key = { isNarrowAspectRatio ? 'narrow' : 'wide' }
                    keyExtractor = { this._keyExtractor }
                    onViewableItemsChanged = { this._onViewableItemsChanged }
                    renderItem = { this._renderThumbnail }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }
                    style = { styles.flatListStageView }
                    viewabilityConfig = { this._viewabilityConfig }
                    windowSize = { 2 } />
                {
                    this._separateLocalThumbnail && isNarrowAspectRatio
                        && <LocalThumbnail />
                }
            </SafeAreaView>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { enabled, remoteParticipants } = state['features/filmstrip'];
    const showRemoteVideos = shouldRemoteVideosBeVisible(state);
    const responsiveUI = state['features/base/responsive-ui'];

    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio,
        _clientHeight: responsiveUI.clientHeight,
        _clientWidth: responsiveUI.clientWidth,
        _localParticipantId: getLocalParticipant(state)?.id,
        _participants: showRemoteVideos ? remoteParticipants : NO_REMOTE_VIDEOS,
        _visible: enabled && isFilmstripVisible(state)
    };
}

export default connect(_mapStateToProps)(Filmstrip);
