import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

import { destroyLocalTracks } from '../../base/tracks';

/**
 * Component for rendering a blank welcome page. It renders absolutely nothing
 * and destroys local tracks upon being mounted, since no media is desired when
 * this component is rendered.
 *
 * The use case is mainly mobile, where SDK users probably disable the welcome
 * page, but using it on the web in the future is not out of the question.
 */
class BlankWelcomePage extends Component {
    /**
     * {@code BlankWelcomePage} component's property types.
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

export default connect()(BlankWelcomePage);
