// @flow

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';

import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/aspect-ratio';
import { Container } from '../../base/react';

import Thumbnail from './Thumbnail';
import { styles } from './_';

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * mobile/React Native.
 *
 * @extends Component
 */
class Filmstrip extends Component<*> {
    /**
     * Filmstrip component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The participants in the conference.
         *
         * @private
         * @type {Participant[]}
         */
        _participants: PropTypes.array,

        /**
         * The indicator which determines whether the filmstrip is visible.
         *
         * @private
         * @type {boolean}
         */
        _visible: PropTypes.bool.isRequired
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const isNarrowAspectRatio_ = isNarrowAspectRatio(this);
        const filmstripStyle
            = isNarrowAspectRatio_
                ? styles.filmstripNarrow
                : styles.filmstripWide;

        return (
            <Container
                style = { filmstripStyle }
                visible = { this.props._visible }>
                <ScrollView
                    horizontal = { isNarrowAspectRatio_ }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }>
                    {
                        /* eslint-disable react/jsx-wrap-multilines */

                        this._sort(this.props._participants)
                            .map(p =>
                                <Thumbnail
                                    key = { p.id }
                                    participant = { p } />)

                        /* eslint-enable react/jsx-wrap-multilines */
                    }
                </ScrollView>
            </Container>
        );
    }

    /**
     * Sorts a specific array of {@code Participant}s in display order.
     *
     * @param {Participant[]} participants - The array of {@code Participant}s
     * to sort in display order.
     * @private
     * @returns {Participant[]} A new array containing the elements of the
     * specified {@code participants} array sorted in display order.
     */
    _sort(participants) {
        // XXX Array.prototype.sort() is not appropriate because (1) it operates
        // in place and (2) it is not necessarily stable.

        const sortedParticipants = [];

        // Group the remote participants so that the local participant does not
        // appear in between remote participants. Have the remote participants
        // from right to left with the newest added/joined to the leftmost side.
        for (let i = participants.length - 1; i >= 0; --i) {
            const p = participants[i];

            p.local || sortedParticipants.push(p);
        }

        // Have the local participant at the rightmost side.
        for (let i = participants.length - 1; i >= 0; --i) {
            const p = participants[i];

            p.local && sortedParticipants.push(p);
        }

        return sortedParticipants;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _participants: Participant[],
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participants = state['features/base/participants'];

    return {
        /**
         * The participants in the conference.
         *
         * @private
         * @type {Participant[]}
         */
        _participants: participants,

        /**
         * The indicator which determines whether the filmstrip is visible. The
         * mobile/react-native Filmstrip is visible when there are at least 2
         * participants in the conference (including the local one).
         *
         * @private
         * @type {boolean}
         */
        _visible: participants.length > 1
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Filmstrip));
