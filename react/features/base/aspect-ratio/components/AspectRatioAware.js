// @flow
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ASPECT_RATIO_NARROW } from '../constants';

/**
 * Decorates given React component class into {@link AspectRatioAwareWrapper}
 * which provides the <tt>aspectRatio</tt> property updated on each Redux state
 * change.
 *
 * @param {ReactClass} WrapperComponent - A React component class to be wrapped.
 * @returns {AspectRatioAwareWrapper}
 */
export function AspectRatioAware(
        WrapperComponent: ReactClass<*>): ReactClass<*> {
    return connect(_mapStateToProps)(
        class AspectRatioAwareWrapper extends Component {
            /**
             * Properties of the aspect ratio aware wrapper.
             */
            static propTypes = {
                /**
                 * Either {@link ASPECT_RATIO_NARROW} or
                 * {@link ASPECT_RATIO_WIDE}.
                 */
                aspectRatio: PropTypes.symbol
            }

            /**
             * Implement's React render method to wrap the nested component.
             *
             * @returns {XML}
             */
            render(): React$Element<*> {
                return <WrapperComponent { ...this.props } />;
            }
        });
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

/**
 * Checks if given React component decorated in {@link AspectRatioAwareWrapper}
 * has currently the {@link ASPECT_RATIO_NARROW} set in the aspect ratio
 * property.
 *
 * @param {AspectRatioAwareWrapper} component - A
 * {@link AspectRatioAwareWrapper} which has <tt>aspectRation</tt> property.
 * @returns {boolean}
 */
export function isNarrowAspectRatio(component: ReactClass<*>) {
    return component.props.aspectRatio === ASPECT_RATIO_NARROW;
}
