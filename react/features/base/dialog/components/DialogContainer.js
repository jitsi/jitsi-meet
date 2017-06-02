import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Implements a DialogContainer that will be responsible for
 * showing all dialogs. We will need a separate container so we can handle
 * multiple dialogs, showing them simultaneously or queueing them.
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
        _component: React.PropTypes.func,

        /**
         * The props to pass to the component that will be rendered.
         */
        _componentProps: React.PropTypes.object
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._component) {
            return null;
        }

        return React.createElement(
            this.props._component, this.props._componentProps);
    }
}

/**
 * Maps (parts of) the Redux state to the associated Dialog's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _component: React.Component,
 *     _props: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _component: state['features/base/dialog'].component,
        _componentProps: state['features/base/dialog'].componentProps
    };
}

export default connect(_mapStateToProps)(DialogContainer);
