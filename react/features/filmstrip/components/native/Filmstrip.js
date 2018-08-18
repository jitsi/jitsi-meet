// @flow

import React, { Component } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants';
import { Container, Platform } from '../../../base/react';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../../base/responsive-ui';

import { setFilmstripVisibleParticipantIds } from '../../actions';
import { isFilmstripVisible } from '../../functions';

import LocalThumbnail from './LocalThumbnail';
import styles from './styles';
import Thumbnail from './Thumbnail';

/**
 * Filmstrip component's property types.
 */
type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The indicator which determines whether the filmstrip is enabled.
     *
     * @private
     */
    _enabled: boolean,

    /**
     * An array of participant IDs that are currently visible in the
     * Filmstrip.
     */
    _visibleParticipantIds: Array<string>,

    /**
     * The local participant in the conference.
     *
     * @private
     */
    _localParticipant: Object,

    /**
     * The remote participants in the conference.
     *
     * @private
     */
    _participants: Array<any>,

    /**
     * The indicator which determines whether the filmstrip is visible.
     *
     * @private
     */
    _visible: boolean
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class Filmstrip extends Component<Props> {
    /**
     * Whether the local participant should be rendered separately from the
     * remote participants i.e. outside of their {@link ScrollView}.
     */
    _separateLocalThumbnail: boolean;

    /**
     * The config to tell the {@code FlatList} component when to show/hide
     * clipped or not visible children.
     */
    _viewabilityConfig: Object;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // eslint-disable-next-line max-len
        // See https://github.com/facebook/react-native/blob/master/Libraries/Lists/ViewabilityHelper.js
        // for more details.
        this._viewabilityConfig = {
            /**
             * Tells the Filmstrip how much of the area of the Thumbnail should
             * be visible in order to set its state visible.
             */
            itemVisiblePercentThreshold: 20,

            /**
             * The minimum time a thumbnail has to be visible or invisible in
             * order to update its visibility status. A smaller number will
             * provide better responsivity, but will also cause much more status
             * updates that can cause performance issues.
             */
            minimumViewTime: 500,

            /**
             * If it's true, the visibility state will only be updated if it is
             * caused by a direct user action. We don't want this however,
             * because a Thumbnail can become visible or invisible due to
             * participants joining or leaving the conference.
             */
            waitForInteraction: false
        };

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

        this._onViewableItemsChanged = this._onViewableItemsChanged.bind(this);
        this._renderItem = this._renderItem.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._enabled) {
            return null;
        }

        const isNarrowAspectRatio_ = isNarrowAspectRatio(this);
        const filmstripStyle
            = isNarrowAspectRatio_
                ? styles.filmstripNarrow
                : styles.filmstripWide;

        return (
            <Container
                style = { filmstripStyle }
                visible = { this.props._visible }>
                {
                    this._separateLocalThumbnail
                        && !isNarrowAspectRatio_
                        && <LocalThumbnail />
                }
                <FlatList
                    data = { this._getFilmstripData() }
                    horizontal = { isNarrowAspectRatio_ }
                    onViewableItemsChanged = { this._onViewableItemsChanged }
                    removeClippedSubviews = { true }
                    renderItem = { this._renderItem }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }
                    style = { styles.filmstripWrapper }
                    viewabilityConfig = { this._viewabilityConfig } />
                {
                    this._separateLocalThumbnail
                        && isNarrowAspectRatio_
                        && <LocalThumbnail />
                }
            </Container>
        );
    }

    /**
     * Returns the participant list in a format suitable for the
     * {@code FlatList} component to display.
     *
     * @private
     * @returns {Array<{participant: Object, key: string}>}
     */
    _getFilmstripData() {
        const { _participants } = this.props;
        const data = [];

        // If _separateLocalThumbnail is false (e.g. on Android for now, see
        // comment in constructor for more details) we render the local
        // participant together with the remote participants, so we need to put
        // it as the first element of the data array.
        if (!this._separateLocalThumbnail) {
            const { _localParticipant } = this.props;

            data.push({
                participant: _localParticipant,
                key: _localParticipant.id
            });
        }

        if (_participants.length) {
            for (const p of _participants) {
                data.push({
                    key: p.id,
                    participant: p
                });
            }

            if (isNarrowAspectRatio(this)) {
                data.reverse();
            }
        }

        return data;
    }

    _onViewableItemsChanged: Object => void;

    /**
     * Called when the viewability of thumbnails changes, as defined by the
     * viewabilityConfig prop.
     *
     * @private
     * @param {Object} changeEvent - Info about the item thats visibility has
     * changed.
     * @returns {void}
     */
    _onViewableItemsChanged(changeEvent) {
        if (changeEvent
                && changeEvent.viewableItems
                && changeEvent.viewableItems.length) {
            const visibleParticipants = [];

            for (const viewableItem of changeEvent.viewableItems) {
                visibleParticipants.push(viewableItem.item.participant.id);
            }

            this.props.dispatch(
                setFilmstripVisibleParticipantIds(visibleParticipants));
        }
    }

    _renderItem: Object => React$Element<*>

    /**
     * Renders a single {@code Participant} {@code Thumbnail} in the filmstrip.
     *
     * @private
     * @param {Participant} participant - The participant to render a thumbnail
     * for.
     * @returns {React$Element<*>}
     */
    _renderItem({ item }) {
        const hideVideo
            = !this.props._visibleParticipantIds.includes(item.participant.id);

        return (
            <Thumbnail
                hideVideo = { hideVideo }
                key = { item.key }
                participant = { item.participant } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _participants: Participant[],
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participants = state['features/base/participants'];
    const { enabled, visibleParticipantIds } = state['features/filmstrip'];

    return {
        /**
         * The indicator which determines whether the filmstrip is enabled.
         *
         * @private
         * @type {boolean}
         */
        _enabled: enabled,

        /**
         * The local participant in the conference.
         *
         * @private
         * @type {Participant}
         */
        _localParticipant: getLocalParticipant(state),

        /**
         * The remote participants in the conference.
         *
         * @private
         * @type {Participant[]}
         */
        _participants: participants.filter(p => !p.local),

        /**
         * The indicator which determines whether the filmstrip is visible. The
         * mobile/react-native Filmstrip is visible when there are at least 2
         * participants in the conference (including the local one).
         *
         * @private
         * @type {boolean}
         */
        _visible: isFilmstripVisible(state),

        /**
         * An array of participant IDs that are currently visible in the
         * Filmstrip.
         */
        _visibleParticipantIds: visibleParticipantIds
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Filmstrip));
