// @flow

import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { Container } from '../../../base/react';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../../base/responsive-ui';

import LocalThumbnail from './LocalThumbnail';
import styles from './styles';
import Thumbnail from './Thumbnail';

/**
 * A threshold that tells the app how much the video may go out of the
 * ScrollView before it gets hidden. This should be increased if the Filmstrip
 * disables videos too agressively.
 */
const VIDEO_DISABLE_FLEXIBILITY = 2;

/**
 * Filmstrip component's property types.
 */
type Props = {

    /**
     * The indicator which determines whether the filmstrip is enabled.
     *
     * @private
     */
    _enabled: boolean,

    /**
     * The participants in the conference.
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

type State = {

    /**
     * An Object that stores the visibility of every thumbnails. True if hidden
     * (not fully visible inside the ScrollView) and false or undefined
     * otherwise. We default to false (hence the name) to avoid an initializer
     * call on mount/render.
     */
    hiddenThumbnails: Object
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * NOTE: This new implementation automagically hides those Thumbnails that get
 * out of the area of the {@code ScrollView}. This has two purposes:
 *   - Performance improvement
 *   - Avoids a limitation of Android's EGL implementation aroung GL layers.
 *
 * @extends Component
 */
class Filmstrip extends Component<Props, State> {
    /**
     * The current scroll (offset) value of the {@code ScrollView}.
     */
    currentScroll: number;

    /**
     * The layout of the {@code ScrollView}.
     */
    scrollViewLayout: {
        height: number,
        width: number,
        x: number,
        y: number
    };

    /**
     * Layouts of each rendered remote {@code Thumbnail}s.
     */
    thumbnailLayouts: Object;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.currentScroll = 0;
        this.thumbnailLayouts = {};

        this.state = {
            hiddenThumbnails: {}
        };

        this._onScroll = this._onScroll.bind(this);
        this._onScrollViewLayout = this._onScrollViewLayout.bind(this);
        this._onThumbnailLayout = this._onThumbnailLayout.bind(this);
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
        const { hiddenThumbnails } = this.state;

        return (
            <Container
                style = { filmstripStyle }
                visible = { this.props._visible }>
                {
                    !isNarrowAspectRatio_ && <LocalThumbnail />
                }
                <ScrollView
                    horizontal = { isNarrowAspectRatio_ }
                    onLayout = { this._onScrollViewLayout }
                    onScroll = { this._onScroll }
                    scrollEventThrottle = { 200 }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }
                    style = { styles.scrollView } >
                    {
                        /* eslint-disable react/jsx-wrap-multilines */

                        this._sort(
                                this.props._participants,
                                isNarrowAspectRatio_)
                            .map(p =>
                                <Thumbnail
                                    hideVideo = {
                                        Boolean(hiddenThumbnails[p.id])
                                    }
                                    key = { p.id }
                                    onLayout = { this._onThumbnailLayout(p.id) }
                                    participant = { p } />)

                        /* eslint-enable react/jsx-wrap-multilines */
                    }
                </ScrollView>
                {
                    isNarrowAspectRatio_ && <LocalThumbnail />
                }
            </Container>
        );
    }

    _onScroll: ?Object => void

    /**
     * Callback for the {@code ScrollView}'s onScroll event.
     *
     * NOTE:
     * - This function calculates the position of the thumbnails and
     * updates their hideVideo prop to disable rendering a thumbnail if it goes
     * out of the ScrollView, even partially. Partially: because otherwise we
     * don't get around the EGL bug.
     * - When boundaries are calculated, {@code begin} always means the position
     * of the side of the {@code Thumbnail} that is closer to the scroll origin
     * of the {@code ScrollView}, and {@code end} is the opposite. E.g. if the
     * {@code ScrollView} is horizontal, then {@code begin} is the leftmost
     * edge, {@code end} is the rightmost. When the {@code ScrollView} is
     * vertical, {@code begin} is the topmost edge, {@code end} is the bottom of
     * the component.
     *
     * @private
     * @param {Object} nativeEvent - The native event.
     * @returns {void}
     */
    _onScroll({ nativeEvent } = {}) {
        if (!this.scrollViewLayout) {
            // ScrollView is not laid out yet, we'll come back here later.
            return;
        }

        // Retreives the current scroll value of the ScrollView.
        // If no parameter provided to the function, we use the last used value.
        // This can happen when we request a re-render in the onLayout callback
        // of either the ScrollView or the Thumbnail.
        if (nativeEvent) {
            this.currentScroll = isNarrowAspectRatio(this)
                ? nativeEvent.contentOffset.x
                : nativeEvent.contentOffset.y;
        }
        const { hiddenThumbnails } = this.state;
        const newHiddenThumbnails = {
            ...hiddenThumbnails
        };
        const _isNarrowAspectRatio = isNarrowAspectRatio(this);
        const participants
            = this._sort(this.props._participants, _isNarrowAspectRatio);

        // This is the boundary we use to decide if the video of a thumbnail is
        // to be rendered or not.
        const scrollViewBoundaries = {
            begin: 0 - VIDEO_DISABLE_FLEXIBILITY,
            end:
                (_isNarrowAspectRatio
                    ? this.scrollViewLayout.width
                    : this.scrollViewLayout.height)
                + VIDEO_DISABLE_FLEXIBILITY
        };
        let needsUpdate = false;

        for (const participant of participants) {
            const layout = this.thumbnailLayouts[participant.id];

            if (!layout) {
                // There is at least one Thumbnail that is not rendered yet,
                // so no need to update as we'll re-run this method when all is
                // done.
                return;
            }

            // Boundaries of a thumbnail, corrected with the scroll value of the
            // ScrollView.
            const participantBoundaries = {
                begin:
                    (_isNarrowAspectRatio
                        ? layout.x
                        : layout.y)
                    - this.currentScroll,
                end:
                    (_isNarrowAspectRatio
                        ? layout.x + layout.width
                        : layout.y + layout.height)
                    - this.currentScroll
            };

            const oldParticipantHidden = hiddenThumbnails[participant.id];
            const participantHidden
                = participantBoundaries.begin < scrollViewBoundaries.begin
                || participantBoundaries.end > scrollViewBoundaries.end;

            // NOTE: oldParticipantHidden may be undefined, that is considered
            // false here
            if ((participantHidden && !oldParticipantHidden)
                || (!participantHidden && oldParticipantHidden)) {
                newHiddenThumbnails[participant.id] = participantHidden;
                needsUpdate = true;
            }
        }

        // Check if there were any changes, so then we need to update the state.
        // Otherwise we don't to avoid unnecessary re-renders.
        if (needsUpdate) {
            this.setState({
                hiddenThumbnails: newHiddenThumbnails
            });
        }
    }

    _onScrollViewLayout: Object => void

    /**
     * Callback to handle the onLayout event of the {@code ScrollView}.
     *
     * @private
     * @param {Object} layout - The layout data.
     * @returns {void}
     */
    _onScrollViewLayout({ nativeEvent: { layout } }) {
        this.scrollViewLayout = layout;

        // ScrollView goes back to 0 scroll on re-layout
        // (e.g. orientation change)
        this.currentScroll = 0;
        this._onScroll();
    }

    _onThumbnailLayout: string => Function

    /**
     * Callback to handle the onLayout event of the {@code Thumbnail}s.
     *
     * @private
     * @param {string} participantId - The ID of the rendered participant.
     * @returns {Function}
     */
    _onThumbnailLayout(participantId) {
        return ({ nativeEvent: { layout } }) => {
            this.thumbnailLayouts[participantId] = layout;
            this._onScroll();
        };
    }

    /**
     * Sorts a specific array of {@code Participant}s in display order.
     *
     * @param {Participant[]} participants - The array of {@code Participant}s
     * to sort in display order.
     * @param {boolean} isNarrowAspectRatio_ - Indicates if the aspect ratio is
     * wide or narrow.
     * @private
     * @returns {Participant[]} A new array containing the elements of the
     * specified {@code participants} array sorted in display order.
     */
    _sort(participants, isNarrowAspectRatio_) {
        // XXX Array.prototype.sort() is not appropriate because (1) it operates
        // in place and (2) it is not necessarily stable.

        const sortedParticipants = [
            ...participants
        ];

        if (isNarrowAspectRatio_) {
            // When the narrow aspect ratio is used, we want to have the remote
            // participants from right to left with the newest added/joined to
            // the leftmost side. The local participant is the leftmost item.
            sortedParticipants.reverse();
        }

        return sortedParticipants;
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
    const { enabled, visible } = state['features/filmstrip'];

    return {
        /**
         * The indicator which determines whether the filmstrip is enabled.
         *
         * @private
         * @type {boolean}
         */
        _enabled: enabled,

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
        _visible: visible && participants.length > 1
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Filmstrip));
