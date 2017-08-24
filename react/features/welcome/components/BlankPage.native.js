import PropTypes from 'prop-types';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { connect } from 'react-redux';

import AbstractBlankPage from './AbstractBlankPage';
import styles from './styles';

/**
 * Mobile/React Native implementation of <tt>AbstractBlankPage</tt>. Since this
 * is the <tt>Component</tt> rendered when there is no <tt>WelcomePage</tt>,
 * it will show a progress indicator when there are ongoing network requests
 * (notably, the loading of config.js before joining a conference). The use case
 * which prompted the introduction of this <tt>Component</tt> is mobile where
 * SDK users probably disable the <tt>WelcomePage</tt>.
 */
class BlankPage extends AbstractBlankPage {
    /**
     * <tt>BlankPage</tt> React <tt>Component</tt>'s prop types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractBlankPage.propTypes,

        /**
         * Indicates whether there is network activity i.e. ongoing network
         * requests.
         *
         * @private
         */
        _networkActivity: PropTypes.bool
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        return (
            <View style = { styles.blankPage }>
                <ActivityIndicator
                    animating = { this.props._networkActivity }
                    size = { 'large' } />
            </View>
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
 *     networkActivity: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { requests } = state['features/net-interceptor'];

    return {
        _networkActivity: Boolean(requests && Object.keys(requests).length)
    };
}

export default connect(_mapStateToProps)(BlankPage);
