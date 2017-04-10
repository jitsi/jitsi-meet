import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { Container } from '../../base/react';

import Thumbnail from './Thumbnail';
import { styles } from './_';

/**
 * React component for filmstrip.
 *
 * @extends Component
 */
class Filmstrip extends Component {
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
        _participants: React.PropTypes.array,

        /**
         * The indicator which determines whether the filmstrip is visible.
         *
         * @private
         * @type {boolean}
         */
        _visible: React.PropTypes.bool.isRequired
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Container
                style = { styles.filmstrip }
                visible = { this.props._visible }>
                <ScrollView

                    // eslint-disable-next-line react/jsx-curly-spacing
                    contentContainerStyle = {
                        styles.filmstripScrollViewContentContainer
                    } // eslint-disable-line react/jsx-curly-spacing
                    horizontal = { true }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }>
                    {
                        this._sort(this.props._participants)
                            .map(p =>
                                <Thumbnail
                                    key = { p.id }
                                    participant = { p } />)
                    }
                </ScrollView>
            </Container>
        );
    }

    /**
     * Sorts a specific array of <tt>Participant</tt>s in display order.
     *
     * @param {Participant[]} participants - The array of <tt>Participant</tt>s
     * to sort in display order.
     * @private
     * @returns {Participant[]} A new array containing the elements of the
     * specified <tt>participants</tt> array sorted in display order.
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
    return {
        /**
         * The participants in the conference.
         *
         * @private
         * @type {Participant[]}
         */
        _participants: state['features/base/participants'],

        /**
         * The indicator which determines whether the filmstrip is visible.
         *
         * XXX The React Component Filmstrip is used on mobile only at the time
         * of this writing and on mobile the filmstrip is visible when the
         * toolbar is not.
         *
         * @private
         * @type {boolean}
         */
        _visible: !state['features/toolbox'].visible
    };
}

export default connect(_mapStateToProps)(Filmstrip);
