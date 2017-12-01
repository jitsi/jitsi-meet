// @flow

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setToolbarHovered } from '../actions';

import StatelessToolbar from './StatelessToolbar';
import ToolbarButton from './ToolbarButton';

/**
 * Implements a toolbar in React/Web. It is a strip that contains a set of
 * toolbar items such as buttons. Toolbar is commonly placed inside of a
 * Toolbox.
 *
 * @class Toolbar
 * @extends Component
 */
class Toolbar extends Component<*> {
    /**
     * Base toolbar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Children of current React component.
         */
        children: PropTypes.element,

        /**
         * Toolbar's class name.
         */
        className: PropTypes.string,

        /**
         * Used to dispatch an action when a button is clicked or on mouse
         * out/in event.
         */
        dispatch: PropTypes.func,

        /**
         * Map with toolbar buttons.
         */
        toolbarButtons: PropTypes.instanceOf(Map),

        /**
         * Indicates the position of the tooltip.
         */
        tooltipPosition: PropTypes.oneOf([ 'bottom', 'left', 'right', 'top' ])
    };

    /**
     * Constructor of Primary toolbar class.
     *
     * @param {Object} props - Object containing React component properties.
     */
    constructor(props: Object) {
        super(props);

        // Bind callbacks to preverse this.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._renderToolbarButton = this._renderToolbarButton.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): React$Element<*> {
        const props = {
            className: this.props.className,
            onMouseOut: this._onMouseOut,
            onMouseOver: this._onMouseOver
        };

        return (
            <StatelessToolbar { ...props }>
                {
                    [ ...this.props.toolbarButtons.entries() ]
                        .map(this._renderToolbarButton)
                }
                {
                    this.props.children
                }
            </StatelessToolbar>
        );
    }

    _onMouseOut: () => void;

    /**
     * Dispatches an action signalling that toolbar is no being hovered.
     *
     * @protected
     * @returns {void}
     */
    _onMouseOut() {
        this.props.dispatch(setToolbarHovered(false));
    }

    _onMouseOver: () => void;

    /**
     * Dispatches an action signalling that toolbar is now being hovered.
     *
     * @protected
     * @returns {void}
     */
    _onMouseOver() {
        this.props.dispatch(setToolbarHovered(true));
    }

    _renderToolbarButton: (Array<*>) => React$Element<*>;

    /**
     * Renders toolbar button. Method is passed to map function.
     *
     * @param {Array} keyValuePair - Key value pair containing button and its
     * key.
     * @private
     * @returns {ReactElement} A toolbar button.
     */
    _renderToolbarButton([ key, button ]): React$Element<*> {
        const { tooltipPosition } = this.props;

        if (button.component) {
            return (
                <button.component
                    key = { key }
                    toggled = { button.toggled }
                    tooltipPosition = { tooltipPosition } />
            );
        }

        const {
            childComponent: ChildComponent,
            onClick,
            onMount,
            onUnmount
        } = button;
        const onClickWithDispatch = (...args) =>
            onClick && onClick(this.props.dispatch, ...args);

        return (
            <ToolbarButton
                button = { button }
                key = { key }

                // TODO The following disables an eslint error alerting about a
                // known potential/theoretical performance pernalty:
                //
                // A bind call or arrow function in a JSX prop will create a
                // brand new function on every single render. This is bad for
                // performance, as it will result in the garbage collector being
                // invoked way more than is necessary. It may also cause
                // unnecessary re-renders if a brand new function is passed as a
                // prop to a component that uses reference equality check on the
                // prop to determine if it should update.
                //
                // I'm not addressing the potential/theoretical performance
                // penalty at the time of this writing because I don't know for
                // a fact that it's a practical performance penalty in the case.
                //
                // eslint-disable-next-line react/jsx-no-bind
                onClick = { onClickWithDispatch }
                onMount = { onMount }
                onUnmount = { onUnmount }
                tooltipPosition = { tooltipPosition }>
                { button.html || null }
                { ChildComponent ? <ChildComponent /> : null }
            </ToolbarButton>
        );
    }
}

export default connect()(Toolbar);
