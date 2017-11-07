import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { setAspectRatio } from '../actions';
import styles from './styles';

/**
 * A root {@link View} which captures the 'onLayout' event and figures out
 * the aspect ratio of the app.
 */
class AspectRatioDetector extends Component {
    /**
     * AspectRatioDetector component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The "onLayout" handler.
         */
        _onLayout: PropTypes.func,

        /**
         * Any nested components.
         */
        children: PropTypes.node
    };

    /**
     * Renders the root view and it's children.
     *
     * @returns {Component}
     */
    render() {
        return (
            <View
                onLayout = { this.props._onLayout }
                style = { styles.aspectRatioDetector } >
                { this.props.children }
            </View>
        );
    }
}

/**
 * Maps dispatching of the aspect ratio actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onLayout: Function
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        /**
         * Handles the "on layout" View's event and dispatches aspect ratio
         * changed action.
         *
         * @param {Object} event - The "on layout" event object/structure passed
         * by react-native.
         * @private
         * @returns {void}
         */
        _onLayout({ nativeEvent: { layout: { height, width } } }) {
            dispatch(setAspectRatio(width, height));
        }
    };
}

export default connect(undefined, _mapDispatchToProps)(AspectRatioDetector);
