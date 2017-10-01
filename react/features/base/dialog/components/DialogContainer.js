import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Implements a DialogContainer responsible for showing all dialogs. We will
 * need a separate container so we can handle multiple dialogs by showing them
 * simultaneously or queuing them.
 */
export class DialogContainer extends Component {
    /**
     * DialogContainer component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The component to render.
         */
        _component: PropTypes.func,

        /**
         * The props to pass to the component that will be rendered.
         */
        _componentProps: PropTypes.object
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _component: component } = this.props;

        return (
            component
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
 *     _componentProps: Object
 * }}
 */
function _mapStateToProps(state) {
    const stateFeaturesBaseDialog = state['features/base/dialog'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps
    };
}

export default connect(_mapStateToProps)(DialogContainer);
