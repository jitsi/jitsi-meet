/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import Tooltip from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { TOOLTIP_TO_POPUP_POSITION } from '../constants';
import StatelessToolbarButton from './StatelessToolbarButton';

declare var APP: Object;

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
class ToolbarButton extends Component<*> {
    button: Object;

    _onClick: Function;

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

        // Bind methods to save the context
        this._onClick = this._onClick.bind(this);
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
    render(): React$Element<*> {
        const { button, t, tooltipPosition } = this.props;
        const props = {
            ...this.props,
            onClick: this._onClick
        };

        const buttonComponent = ( // eslint-disable-line no-extra-parens
            <Tooltip
                description = { button.tooltipText || t(button.tooltipKey) }
                position = { tooltipPosition }>
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
                <InlineDialog
                    content = {
                        <div className = 'button-popover-message'>
                            { t(dataAttr, dataInterpolate) }
                        </div>
                    }
                    isOpen = { Boolean(popupConfig) }
                    position = { position }>
                    { buttonComponent }
                </InlineDialog>
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
