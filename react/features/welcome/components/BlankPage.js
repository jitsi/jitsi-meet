import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

import { destroyLocalTracks } from '../../base/tracks';

/**
 * A React <tt>Component<tt> which represents a blank page. It renders nothing
 * and destroys local tracks upon being mounted since no media is desired when
 * this component is rendered.
 *
 * The use case which prompted the introduction of this component is mobile
 * where SDK users probably disable the Welcome page.
 */
class BlankPage extends Component {
    /**
     * {@code BlankPage} component's property types.
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
     * Implements React's {@link Component#render()}. In this particular case
     * we return null, because the entire purpose of this component is to render
     * nothing.
     *
     * @inheritdoc
     * @returns {null}
     */
    render() {
        return null;
    }
}

export default connect()(BlankPage);
