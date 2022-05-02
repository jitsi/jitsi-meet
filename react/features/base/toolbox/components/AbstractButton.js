// @flow

import React, { Component } from 'react';

import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { combineStyles } from '../../styles';

import type { Styles } from './AbstractToolboxItem';
import ToolboxItem from './ToolboxItem';

export type Props = {|

    /**
     * Function to be called after the click handler has been processed.
     */
    afterClick: ?Function,

    /**
     * The button's key.
     */
    buttonKey?: string,

    /**
     * Whether or not the button is displayed in a context menu.
     */
    contextMenu?: boolean,

    /**
     * An extra class name to be added at the end of the element's class name
     * in order to enable custom styling.
     */
    customClass?: string,

    /**
     * Extra styles which will be applied in conjunction with `styles` or
     * `toggledStyles` when the button is disabled;.
     */
    disabledStyles: ?Styles,

    /**
     * External handler for click action.
     */
    handleClick?: Function,

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string,

    /**
     * Whether to show the label or not.
     */
    showLabel: boolean,

    /**
     * Collection of styles for the button.
     */
    styles: ?Styles,

    /**
     * Collection of styles for the button, when in toggled state.
     */
    toggledStyles: ?Styles,

    /**
     * From which direction the tooltip should appear, relative to the button.
     */
    tooltipPosition: string,

    /**
     * Whether this button is visible or not.
     */
    visible: boolean
|};

declare var APP: Object;

/**
 * Default style for disabled buttons.
 */
export const defaultDisabledButtonStyles = {
    iconStyle: {
        opacity: 0.5
    },
    labelStyle: {
        opacity: 0.5
    },
    style: undefined,
    underlayColor: undefined
};

/**
 * An abstract implementation of a button.
 */
export default class AbstractButton<P: Props, S: *> extends Component<P, S> {
    static defaultProps = {
        afterClick: undefined,
        disabledStyles: defaultDisabledButtonStyles,
        showLabel: false,
        styles: undefined,
        toggledStyles: undefined,
        tooltipPosition: 'top',
        visible: true
    };

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     *
     * @abstract
     */
    accessibilityLabel: string;

    /**
     * The icon of this button.
     *
     * @abstract
     */
    icon: Object;

    /**
     * The text associated with this button. When `showLabel` is set to
     * {@code true}, it will be displayed alongside the icon.
     *
     * @abstract
     */
    label: string;

    /**
     * The label for this button, when toggled.
     */
    toggledLabel: string;

    /**
     * The icon of this button, when toggled.
     *
     * @abstract
     */
    toggledIcon: Object;

    /**
     * The text to display in the tooltip. Used only on web.
     *
     * @abstract
     */
    tooltip: ?string;

    /**
     * Initializes a new {@code AbstractButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code AbstractButton} instance with.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle a key being down.
     *
     * @protected
     * @returns {void}
     */
    _onKeyDown() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to be implemented by subclasses, which may return a
     * new React Element to be appended at the end of the button.
     *
     * @protected
     * @returns {ReactElement|null}
     */
    _getElementAfter() {
        return null;
    }

    /**
     * Gets the current icon, taking the toggled state into account. If no
     * toggled icon is provided, the regular icon will also be used in the
     * toggled state.
     *
     * @private
     * @returns {string}
     */
    _getIcon() {
        return (
            this._isToggled() ? this.toggledIcon : this.icon
        ) || this.icon;
    }

    /**
     * Gets the current label, taking the toggled state into account. If no
     * toggled label is provided, the regular label will also be used in the
     * toggled state.
     *
     * @private
     * @returns {string}
     */
    _getLabel() {
        return (this._isToggled() ? this.toggledLabel : this.label)
            || this.label;
    }

    /**
     * Gets the current styles, taking the toggled state into account. If no
     * toggled styles are provided, the regular styles will also be used in the
     * toggled state.
     *
     * @private
     * @returns {?Styles}
     */
    _getStyles(): ?Styles {
        const { disabledStyles, styles, toggledStyles } = this.props;
        const buttonStyles
            = (this._isToggled() ? toggledStyles : styles) || styles;

        if (this._isDisabled() && buttonStyles && disabledStyles) {
            return {
                iconStyle: combineStyles(
                    buttonStyles.iconStyle, disabledStyles.iconStyle),
                labelStyle: combineStyles(
                    buttonStyles.labelStyle, disabledStyles.labelStyle),
                style: combineStyles(
                    buttonStyles.style, disabledStyles.style),
                underlayColor:
                    disabledStyles.underlayColor || buttonStyles.underlayColor
            };
        }

        return buttonStyles;
    }

    /**
     * Get the tooltip to display when hovering over the button.
     *
     * @private
     * @returns {string}
     */
    _getTooltip() {
        return this.tooltip || '';
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if this button is toggled or not or
     * undefined if the button is not toggleable.
     *
     * @protected
     * @returns {?boolean}
     */
    _isToggled() {
        return undefined;
    }

    _onClick: (*) => void;

    /**
     * Handles clicking / pressing the button.
     *
     * @param {Object} e - Event.
     * @private
     * @returns {void}
     */
    _onClick(e) {
        const { afterClick, handleClick, notifyMode, buttonKey } = this.props;

        if (typeof APP !== 'undefined' && notifyMode) {
            APP.API.notifyToolbarButtonClicked(
                buttonKey, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }

        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            if (handleClick) {
                handleClick();
            }

            this._handleClick();
        }

        afterClick && afterClick(e);

        // blur after click to release focus from button to allow PTT.
        e?.currentTarget?.blur && e.currentTarget.blur();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render(): React$Node {
        const props = {
            ...this.props,
            accessibilityLabel: this.accessibilityLabel,
            elementAfter: this._getElementAfter(),
            icon: this._getIcon(),
            label: this._getLabel(),
            styles: this._getStyles(),
            toggled: this._isToggled(),
            tooltip: this._getTooltip()
        };

        return (
            <ToolboxItem
                disabled = { this._isDisabled() }
                onClick = { this._onClick }
                onKeyDown = { this._onKeyDown }
                { ...props } />
        );
    }
}
