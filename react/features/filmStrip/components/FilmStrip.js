import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ScrollView } from 'react-native';

import { Container } from '../../base/react';

import Thumbnail from './Thumbnail';
import { styles } from './_';

/**
 * React component for film strip.
 *
 * @extends Component
 */
class FilmStrip extends Component {
    /**
     * FilmStrip component's property types.
     *
     * @static
     */
    static propTypes = {
        participants: React.PropTypes.array,
        visible: React.PropTypes.bool.isRequired
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Container
                style = { styles.filmStrip }
                visible = { this.props.visible }>
                <ScrollView

                    // eslint-disable-next-line react/jsx-curly-spacing
                    contentContainerStyle = {
                        styles.filmStripScrollViewContentContainer
                    } // eslint-disable-line react/jsx-curly-spacing
                    horizontal = { true }
                    showsHorizontalScrollIndicator = { false }
                    showsVerticalScrollIndicator = { false }>
                    {
                        this._sort(this.props.participants)
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
 * @returns {{
 *      participants: Participant[],
 *  }}
 */
function mapStateToProps(state) {
    return {
        participants: state['features/base/participants']
    };
}

export default connect(mapStateToProps)(FilmStrip);
