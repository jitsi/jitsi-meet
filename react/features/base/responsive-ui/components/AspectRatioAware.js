// @flow

import React, { Component } from 'react';

import { connect } from '../../redux';

import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from '../constants';

/**
 * The type of the React {@code Component} props of {@link AspectRatioAware}.
 */
type Props = {
    aspectRatio: ASPECT_RATIO_NARROW | ASPECT_RATIO_WIDE
};

/**
 * Determines whether a specific React {@code Component} decorated into an
 * {@link AspectRatioAware} has {@link ASPECT_RATIO_NARROW} as the value of its
 * {@code aspectRatio} React prop.
 *
 * @param {AspectRatioAware} component - An {@link AspectRatioAware} which may
 * have an {@code aspectRatio} React prop.
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
    class AspectRatioAware extends Component<Props> {
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
 * Maps (parts of) the redux state to {@link AspectRatioAware} props.
 *
 * @param {Object} state - The whole redux state.
 * @private
 * @returns {{
 *     aspectRatio: Symbol
 * }}
 */
function _mapStateToProps(state) {
    return {
        aspectRatio: state['features/base/responsive-ui'].aspectRatio
    };
}
