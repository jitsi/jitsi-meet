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
                        this.props.participants

                            // Group the remote participants so that the local
                            // participant does not appear in between remote
                            // participants.
                            .sort((a, b) => b.local - a.local)

                            // Have the local participant at the rightmost side.
                            // Then have the remote participants from right to
                            // left with the newest added/joined to the leftmost
                            // side.
                            .reverse()
                            .map(p =>
                                <Thumbnail
                                    key = { p.id }
                                    participant = { p } />)
                    }
                </ScrollView>
            </Container>
        );
    }
}

/**
 * FilmStrip component's property types.
 *
 * @static
 */
FilmStrip.propTypes = {
    participants: React.PropTypes.array,
    visible: React.PropTypes.bool.isRequired
};

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {{
 *      participants: Participant[],
 *      tracks: (JitsiLocalTrack|JitsiRemoteTrack)[]
 *  }}
 */
function mapStateToProps(state) {
    return {
        participants: state['features/base/participants']
    };
}

export default connect(mapStateToProps)(FilmStrip);
