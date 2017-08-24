import PropTypes from 'prop-types';
import { Component } from 'react';

import { destroyLocalTracks } from '../../base/tracks';

/**
 * A React <tt>Component</tt> which represents a blank page. Destroys the local
 * tracks upon mounting since no media is desired when this component utilized.
 * Renders nothing.
 */
export default class AbstractBlankPage extends Component {
    /**
     * <tt>AbstractBlankPage</tt> React <tt>Component</tt>'s prop types.
     *
     * @static
     */
    static propTypes = {
        dispatch: PropTypes.func
    };

    /**
     * Destroys the local tracks (if any) since no media is desired when this
     * component is rendered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props.dispatch(destroyLocalTracks());
    }

    /**
     * Implements React's {@link Component#render()}. Returns null because the
     * purpose of this component is to destroy the local tracks and render
     * nothing.
     *
     * @inheritdoc
     * @returns {null}
     */
    render() {
        return null;
    }
}
