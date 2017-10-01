/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { destroyLocalTracks } from '../../base/tracks';
import { NetworkActivityIndicator } from '../../mobile/network-activity';

import { isWelcomePageAppEnabled } from '../functions';
import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';
import styles from './styles';

/**
 * The React {@code Component} displayed by {@code AbstractApp} when it has no
 * {@code Route} to render. Renders a progress indicator when there are ongoing
 * network requests.
 */
class BlankPage extends Component {
    /**
     * {@code BlankPage} React {@code Component}'s prop types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The indicator which determines whether {@code WelcomePage} is (to
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
     * @returns {ReactElement}
     */
    render() {
        return (
            <LocalVideoTrackUnderlay style = { styles.blankPage }>
                <NetworkActivityIndicator />
            </LocalVideoTrackUnderlay>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code BlankPage}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _welcomePageEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _welcomePageEnabled: isWelcomePageAppEnabled(state)
    };
}

export default connect(_mapStateToProps)(BlankPage);
