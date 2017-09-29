/* @flow */

import AKInlineDialog from '@atlaskit/inline-dialog';
import { Tooltip } from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { TOOLTIP_TO_POPUP_POSITION } from '../constants';
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
        button: PropTypes.object.isRequired,

        /**
         * Handler for component mount.
         */
        onMount: PropTypes.func,

        /**
         * Handler for component unmount.
         */
        onUnmount: PropTypes.func,

        /**
         * Translation helper function.
         */
        t: PropTypes.func,

        /**
         * Indicates the position of the tooltip.
         */
        tooltipPosition: PropTypes.oneOf([ 'bottom', 'left', 'right', 'top' ])
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
        const props = {
            ...this.props,
            onClick: this._onClick
        };

        const buttonComponent = ( // eslint-disable-line no-extra-parens
            <Tooltip
                description = { button.tooltipText || t(button.tooltipKey) }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }
                position = { tooltipPosition }
                visible = { this.state.showTooltip }>
                <StatelessToolbarButton { ...props }>
                    { this.props.children }
                </StatelessToolbarButton>
            </Tooltip>
        );
        let children = buttonComponent;

        const popupConfig = this._getPopupDisplayConfiguration();

        if (popupConfig) {
            const { dataAttr, dataInterpolate, position } = popupConfig;

            children = ( // eslint-disable-line no-extra-parens
                <AKInlineDialog
                    content = { t(dataAttr, dataInterpolate) }
                    isOpen = { Boolean(popupConfig) }
                    position = { position }>
                    { buttonComponent }
                </AKInlineDialog>
            );
        }

        return (
            <div className = { `toolbar-button-wrapper ${button.id}-wrapper` }>
                { children }
            </div>
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
     * Parses the props and state to find any popup that should be displayed
     * and returns an object describing how the popup should display.
     *
     * @private
     * @returns {Object|null}
     */
    _getPopupDisplayConfiguration() {
        const { button, tooltipPosition } = this.props;
        const { popups, popupDisplay } = button;

        if (!popups || !popupDisplay) {
            return null;
        }

        const { popupID } = popupDisplay;
        const currentPopup = popups.find(popup => popup.id === popupID);

        return Object.assign(
            {},
            currentPopup || {},
            {
                position: TOOLTIP_TO_POPUP_POSITION[tooltipPosition]
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
