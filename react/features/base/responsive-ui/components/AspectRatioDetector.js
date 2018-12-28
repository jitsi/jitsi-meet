// @flow

import React, { Component, type Node } from 'react';
import { connect } from 'react-redux';
import { type Dispatch } from 'redux';

import { setAspectRatio } from '../actions';
import DimensionsDetector from './DimensionsDetector';

/**
 * AspectRatioDetector component's property types.
 */
type Props = {

    /**
     * The "onDimensionsHandler" handler.
     */
    _onDimensionsChanged: Function,

    /**
     * Any nested components.
     */
    children: Node
};

/**
 * A root {@link View} which captures the 'onLayout' event and figures out
 * the aspect ratio of the app.
 */
class AspectRatioDetector extends Component<Props> {
    /**
     * Renders the root view and it's children.
     *
     * @returns {Component}
     */
    render() {
        return (
            <DimensionsDetector
                onDimensionsChanged = { this.props._onDimensionsChanged } >
                { this.props.children }
            </DimensionsDetector>
        );
    }
}

/**
 * Maps dispatching of the aspect ratio actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onDimensionsChanged: Function
 * }}
 */
function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {
        /**
         * Handles the "on dimensions changed" event and dispatches aspect ratio
         * changed action.
         *
         * @param {number} width - The new width for the component.
         * @param {number} height - The new height for the component.
         * @private
         * @returns {void}
         */
        _onDimensionsChanged(width: number, height: number) {
            dispatch(setAspectRatio(width, height));
        }
    };
}

export default connect(undefined, _mapDispatchToProps)(AspectRatioDetector);
