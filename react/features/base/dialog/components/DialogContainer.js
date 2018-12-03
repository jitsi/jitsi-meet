/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * The type of the React {@code Component} props of {@link DialogContainer}.
 */
type Props = {

    /**
     * The component to render.
     */
    _component: Function,

    /**
     * The props to pass to the component that will be rendered.
     */
    _componentProps: Object,

    /**
     * True if the UI is in a compact state where we don't show dialogs.
     */
    _reducedUI: boolean
};

/**
 * Implements a DialogContainer responsible for showing all dialogs. We will
 * need a separate container so we can handle multiple dialogs by showing them
 * simultaneously or queuing them.
 */
export class DialogContainer extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _component: component,
            _reducedUI: reducedUI
        } = this.props;

        return (
            component && !reducedUI
                ? React.createElement(component, this.props._componentProps)
                : null);
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code DialogContainer}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _component: React.Component,
 *     _componentProps: Object,
 *     _reducedUI: boolean
 * }}
 */
function _mapStateToProps(state) {
    const stateFeaturesBaseDialog = state['features/base/dialog'];
    const { reducedUI } = state['features/base/responsive-ui'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _reducedUI: reducedUI
    };
}

export default connect(_mapStateToProps)(DialogContainer);
