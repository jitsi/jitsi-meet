/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setToolbarHovered } from '../actions';
import ToolbarButton from './ToolbarButton';

/**
 * Implements a toolbar in React/Web. It is a strip that contains a set of
 * toolbar items such as buttons. Toolbar is commonly placed inside of a
 * Toolbox.
 *
 * @class Toolbar
 * @extends Component
 */
class Toolbar extends Component {
    _renderToolbarButton: Function;

    /**
     * Base toolbar component's property types.
     *
     * @static
     */
    static propTypes = {

        /**
         *  Handler for mouse out event.
         */
        _onMouseOut: React.PropTypes.func,

        /**
         * Handler for mouse over event.
         */
        _onMouseOver: React.PropTypes.func,

        /**
         * Children of current React component.
         */
        children: React.PropTypes.element,

        /**
         * Toolbar's class name.
         */
        className: React.PropTypes.string,

        /**
         * If the toolbar requires splitter this property defines splitter
         * index.
         */
        splitterIndex: React.PropTypes.number,

        /**
         * Map with toolbar buttons.
         */
        toolbarButtons: React.PropTypes.instanceOf(Map),

        /**
         * Indicates the position of the tooltip.
         */
        tooltipPosition:
            React.PropTypes.oneOf([ 'bottom', 'left', 'right', 'top' ])
    };

    /**
     * Constructor of Primary toolbar class.
     *
     * @param {Object} props - Object containing React component properties.
     */
    constructor(props) {
        super(props);

        // Bind callbacks to preverse this.
        this._renderToolbarButton = this._renderToolbarButton.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        const { className } = this.props;

        return (
            <div
                className = { `toolbar ${className}` }
                onMouseOut = { this.props._onMouseOut }
                onMouseOver = { this.props._onMouseOver }>
                {
                    [ ...this.props.toolbarButtons.entries() ]
                        .reduce(this._renderToolbarButton, [])
                }
                {
                    this.props.children
                }
            </div>
        );
    }

    /**
     * Renders toolbar button. Method is passed to reduce function.
     *
     * @param {Array} acc - Toolbar buttons array.
     * @param {Array} keyValuePair - Key value pair containing button and its
     * key.
     * @param {number} index - Index of the key value pair in the array.
     * @private
     * @returns {Array} Array of toolbar buttons and splitter if it's on.
     */
    _renderToolbarButton(acc: Array<*>, keyValuePair: Array<*>,
                         index: number): Array<ReactElement<*>> {
        const [ key, button ] = keyValuePair;

        if (button.component) {
            acc.push(
                <button.component
                    key = { key }
                    tooltipPosition = { this.props.tooltipPosition } />
            );

            return acc;
        }

        const { splitterIndex, tooltipPosition } = this.props;

        if (splitterIndex && index === splitterIndex) {
            const splitter = <span className = 'toolbar__splitter' />;

            acc.push(splitter);
        }

        const { onClick, onMount, onUnmount } = button;

        acc.push(
            <ToolbarButton
                button = { button }
                key = { key }
                onClick = { onClick }
                onMount = { onMount }
                onUnmount = { onUnmount }
                tooltipPosition = { tooltipPosition } />
        );

        return acc;
    }
}

/**
 * Maps part of Redux actions to component's props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {Object}
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {
        /**
         * Dispatches an action signalling that toolbar is no being hovered.
         *
         * @protected
         * @returns {Object} Dispatched action.
         */
        _onMouseOut() {
            return dispatch(setToolbarHovered(false));
        },

        /**
         * Dispatches an action signalling that toolbar is now being hovered.
         *
         * @protected
         * @returns {Object} Dispatched action.
         */
        _onMouseOver() {
            return dispatch(setToolbarHovered(true));
        }
    };
}

export default connect(undefined, _mapDispatchToProps)(Toolbar);
