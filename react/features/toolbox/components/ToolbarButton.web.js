/* @flow */

import { Tooltip } from '@atlaskit/tooltip';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { isButtonEnabled } from '../functions';

import StatelessToolbarButton from './StatelessToolbarButton';

declare var APP: Object;

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
class ToolbarButton extends Component {
    button: Object;
    _createRefToButton: Function;

    _onClick: Function;

    _onMouseOut: Function;

    _onMouseOver: Function;

    state: {

        /**
         * Whether or not the tooltip for the button should be displayed.
         *
         * @type {boolean}
         */
        showTooltip: boolean
    }

    /**
     * Toolbar button component's property types.
     *
     * @static
     */
    static propTypes = {
        ...StatelessToolbarButton.propTypes,

        /**
         * Object describing button.
         */
        button: React.PropTypes.object.isRequired,

        /**
         * Handler for component mount.
         */
        onMount: React.PropTypes.func,

        /**
         * Handler for component unmount.
         */
        onUnmount: React.PropTypes.func,

        /**
         * Translation helper function.
         */
        t: React.PropTypes.func,

        /**
         * Indicates the position of the tooltip.
         */
        tooltipPosition:
            React.PropTypes.oneOf([ 'bottom', 'left', 'right', 'top' ])
    };

    /**
     * Initializes new ToolbarButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this.state = {
            showTooltip: false
        };

        // Bind methods to save the context
        this._createRefToButton = this._createRefToButton.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    /**
     * Sets shortcut/tooltip
     * after mounting of the component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount(): void {
        this._setShortcut();

        if (this.props.onMount) {
            this.props.onMount();
        }
    }

    /**
     * Invokes on unmount handler if it was passed to the props.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount(): void {
        if (this.props.onUnmount) {
            this.props.onUnmount();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        const { button, t, tooltipPosition } = this.props;
        const popups = button.popups || [];

        const props = {
            ...this.props,
            onClick: this._onClick,
            createRefToButton: this._createRefToButton
        };

        return (
            <Tooltip
                description = { button.tooltipText || t(button.tooltipKey) }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }
                position = { tooltipPosition }
                visible = { this.state.showTooltip }>
                <StatelessToolbarButton { ...props }>
                    { this._renderPopups(popups) }
                </StatelessToolbarButton>
            </Tooltip>
        );
    }

    /**
     * Wrapper on on click handler props for current button.
     *
     * @param {Event} event - Click event object.
     * @returns {void}
     * @private
     */
    _onClick(event) {
        this.props.onClick(event);
        this.setState({ showTooltip: false });
    }

    /**
     * Creates reference to current toolbar button.
     *
     * @param {HTMLElement} element - HTMLElement representing the toolbar
     * button.
     * @returns {void}
     * @private
     */
    _createRefToButton(element: HTMLElement): void {
        this.button = element;
    }

    /**
     * If toolbar button should contain children elements
     * renders them.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderInnerElementsIfRequired(): ReactElement<*> | null {
        if (this.props.button.html) {
            return this.props.button.html;
        }

        return null;
    }

    /**
     * Renders popup element for toolbar button.
     *
     * @param {Array} popups - Array of popup objects.
     * @returns {Array}
     * @private
     */
    _renderPopups(popups: Array<*> = []): Array<*> {
        return popups.map(popup => {
            let gravity = 'n';

            if (popup.dataAttrPosition) {
                gravity = popup.dataAttrPosition;
            }

            const title = this.props.t(popup.dataAttr, popup.dataInterpolate);

            return (
                <div
                    className = { popup.className }
                    data-popup = { gravity }
                    id = { popup.id }
                    key = { popup.id }
                    title = { title } />
            );
        });
    }

    /**
     * Hides any displayed tooltip.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut(): void {
        this.setState({ showTooltip: false });
    }

    /**
     * Hides any displayed tooltip.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver(): void {
        const { button } = this.props;

        this.setState({
            showTooltip: isButtonEnabled(button.buttonName)
                && !button.unclickable
        });
    }

    /**
     * Sets shortcut and tooltip for current toolbar button.
     *
     * @private
     * @returns {void}
     */
    _setShortcut(): void {
        const { button } = this.props;

        if (button.shortcut && APP && APP.keyboardshortcut) {
            APP.keyboardshortcut.registerShortcut(
                button.shortcut,
                button.shortcutAttr,
                button.shortcutFunc,
                button.shortcutDescription
            );
        }
    }
}

export default translate(ToolbarButton);
