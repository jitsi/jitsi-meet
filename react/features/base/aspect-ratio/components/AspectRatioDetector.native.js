// @flow

import { Component } from 'react';
import { DeviceEventEmitter, Dimensions } from 'react-native';
import { connect } from 'react-redux';

import { setAspectRatio } from '../actions';

/**
 * AspectRatioDetector component's property types.
 */
type Props = {

    /**
     * Any nested components.
     */
    children: React$Node,

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<*>
}

/**
 * A root {@link View} which captures the 'onLayout' event and figures out
 * the aspect ratio of the app.
 */
class AspectRatioDetector extends Component<Props> {
    /**
     * Listener for orientation changes.
     */
    _orientationListener: Object;

    /**
     * Implements React's {@link Component#componentWillMount()}. Invoked
     * immediately before mounting occurs. Add a listener for orientation
     * changes.
     *
     * @inheritdoc
     */
    componentWillMount() {
        this._orientationListener = DeviceEventEmitter.addListener(
            'namedOrientationDidChange', () => {
                this._setAspectRatio();
            }
        );

        // Get the initial orientation
        this._setAspectRatio();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._orientationListener.remove();
    }

    /**
     * Sets the current aspect ratio.
     *
     * @private
     * @returns {void}
     */
    _setAspectRatio() {
        const { height, width } = Dimensions.get('window');

        this.props.dispatch(setAspectRatio(width, height));
    }

    /**
     * Renders the root view and it's children.
     *
     * @returns {Component}
     */
    render() {
        return this.props.children;
    }
}

export default connect()(AspectRatioDetector);
