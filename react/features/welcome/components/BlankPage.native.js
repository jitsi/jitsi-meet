/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';

import { destroyLocalTracks } from '../../base/tracks';

import { isWelcomePageAppEnabled } from '../functions';
import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';
import styles from './styles';

/**
 * The React <tt>Component</tt> displayed by <tt>AbstractApp</tt> when it has no
 * <tt>Route</tt> to render. Renders a progress indicator when there are ongoing
 * network requests.
 */
class BlankPage extends Component {
    /**
     * <tt>BlankPage</tt> React <tt>Component</tt>'s prop types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Indicates whether there is network activity i.e. ongoing network
         * requests.
         *
         * @private
         */
        _networkActivity: PropTypes.bool,

        /**
         * The indicator which determines whether <tt>WelcomePage</tt> is (to
         * be) rendered.
         *
         * @private
         */
        _welcomePageEnabled: PropTypes.bool,

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
        this.props._welcomePageEnabled
            || this.props.dispatch(destroyLocalTracks());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        return (
            <LocalVideoTrackUnderlay style = { styles.blankPage }>
                <ActivityIndicator
                    animating = { this.props._networkActivity }
                    size = { 'large' } />
            </LocalVideoTrackUnderlay>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React <tt>Component</tt> props of
 * <tt>BlankPage</tt>.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _networkActivity: boolean,
 *     _welcomePageEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { requests } = state['features/network-activity'];

    return {
        _networkActivity:
            Boolean(requests && (requests.length || requests.size)),
        _welcomePageEnabled: isWelcomePageAppEnabled(state)
    };
}

export default connect(_mapStateToProps)(BlankPage);
