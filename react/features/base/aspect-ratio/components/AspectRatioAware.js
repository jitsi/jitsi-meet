// @flow

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from '../constants';

/**
 * Checks if given React component decorated in {@link AspectRatioAwareWrapper}
 * has currently the {@link ASPECT_RATIO_NARROW} set in the aspect ratio
 * property.
 *
 * @param {AspectRatioAwareWrapper} component - A
 * {@link AspectRatioAwareWrapper} which has <tt>aspectRation</tt> property.
 * @returns {boolean}
 */
export function isNarrowAspectRatio(component: React$Component<*>) {
    return component.props.aspectRatio === ASPECT_RATIO_NARROW;
}

/**
 * Decorates a specific React {@code Component} class into an
 * {@link AspectRatioAware} which provides the React prop {@code aspectRatio}
 * updated on each redux state change.
 *
 * @param {Class<React$Component>} WrappedComponent - A React {@code Component}
 * class to be wrapped.
 * @returns {AspectRatioAwareWrapper}
 */
export function makeAspectRatioAware(
        WrappedComponent: Class<React$Component<*>>
): Class<React$Component<*>> {
    /**
     * Renders {@code WrappedComponent} with the React prop {@code aspectRatio}.
     */
    class AspectRatioAware extends Component<*> {
        /**
         * Properties of the aspect ratio aware wrapper.
         */
        static propTypes = {
            /**
             * Either {@link ASPECT_RATIO_NARROW} or {@link ASPECT_RATIO_WIDE}.
             */
            aspectRatio: PropTypes.oneOf([
                ASPECT_RATIO_NARROW,
                ASPECT_RATIO_WIDE
            ])
        }

        /**
         * Implement's React render method to wrap the nested component.
         *
         * @returns {React$Element}
         */
        render(): React$Element<*> {
            return <WrappedComponent { ...this.props } />;
        }
    }

    return connect(_mapStateToProps)(AspectRatioAware);
}

/**
 * Maps Redux state to {@link AspectRatioAwareWrapper} properties.
 *
 * @param {Object} state - The Redux whole state.
 * @returns {{
 *      aspectRatio: Symbol
 * }}
 * @private
 */
function _mapStateToProps(state) {
    return {
        aspectRatio: state['features/base/aspect-ratio'].aspectRatio
    };
}
