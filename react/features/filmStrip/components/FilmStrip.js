import React, { Component } from 'react';
import { connect } from 'react-redux';

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
                {
                    this.props.participants
                        .sort((a, b) => b.local - a.local)
                        .map(p =>
                            <Thumbnail
                                key = { p.id }
                                participant = { p } />)
                }
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
