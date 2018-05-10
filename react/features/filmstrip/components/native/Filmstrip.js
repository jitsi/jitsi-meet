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

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class Filmstrip extends Component<Props> {
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
                    !isNarrowAspectRatio_ && <LocalThumbnail />
                }
                <ScrollView
                    horizontal = { isNarrowAspectRatio_ }
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
                                    key = { p.id }
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
