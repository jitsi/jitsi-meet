import React, { Component, ReactElement, ReactNode } from 'react';
import { WithTranslation } from 'react-i18next';
import { GestureResponderEvent } from 'react-native';

import { IStore } from '../../../app/types';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { combineStyles } from '../../styles/functions.any';

import { Styles } from './AbstractToolboxItem';
import ToolboxItem from './ToolboxItem';

export interface IProps extends WithTranslation {

    /**
     * Function to be called after the click handler has been processed.
     */
    afterClick?: Function;

    /**
     * The button's background color.
     */
    backgroundColor?: string;

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * Whether or not the button is displayed in a context menu.
     */
    contextMenu?: boolean;

    /**
     * An extra class name to be added at the end of the element's class name
     * in order to enable custom styling.
     */
    customClass?: string;

    /**
     * Extra styles which will be applied in conjunction with `styles` or
     * `toggledStyles` when the button is disabled;.
     */
    disabledStyles?: Styles;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * External handler for click action.
     */
    handleClick?: Function;

    /**
     * Whether the button open a menu or not.
     */
    isMenuButton?: boolean;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Whether to show the label or not.
     */
    showLabel?: boolean;

    /**
     * Collection of styles for the button.
     */
    styles?: Styles;

    /**
     * Collection of styles for the button, when in toggled state.
     */
    toggledStyles?: Styles;

    /**
     * From which direction the tooltip should appear, relative to the button.
     */
    tooltipPosition?: string;

    /**
     * Whether this button is visible or not.
     */
    visible?: boolean;
}

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
export default class AbstractButton<P extends IProps, S = any> extends Component<P, S> {
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
     * The button's background color.
     *
     * @abstract
     */
    backgroundColor?: string;

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     *
     * If `toggledAccessibilityLabel` is defined, this is used only when the
     * button is not toggled on.
     *
     * @abstract
     */
    accessibilityLabel: string;

    /**
     * This is the same as `accessibilityLabel`, replacing it when the button
     * is toggled on.
     *
     * @abstract
     */
    toggledAccessibilityLabel: string;

    labelProps: Object;

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
     * If `toggleTooltip` is defined, this is used only when the button is not
     * toggled on.
     *
     * @abstract
     */
    tooltip?: string;

    /**
     * The text to display in the tooltip when the button is toggled on.
     *
     * Used only on web.
     *
     * @abstract
     */
    toggledTooltip?: string;

    /**
     * Initializes a new {@code AbstractButton} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
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
    _getElementAfter(): ReactElement | null {
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
     * Gets the current accessibility label, taking the toggled state into
     * account. If no toggled label is provided, the regular accessibility label
     * will also be used in the toggled state.
     *
     * The accessibility label is not visible in the UI, it is meant to be
     * used by assistive technologies, mainly screen readers.
     *
     * @private
     * @returns {string}
     */
    _getAccessibilityLabel() {
        return (this._isToggled()
            ? this.toggledAccessibilityLabel
            : this.accessibilityLabel
        ) || this.accessibilityLabel;
    }

    /**
     * Gets the current styles, taking the toggled state into account. If no
     * toggled styles are provided, the regular styles will also be used in the
     * toggled state.
     *
     * @private
     * @returns {?Styles}
     */
    _getStyles(): Styles | undefined {
        const { disabledStyles, styles, toggledStyles } = this.props;
        const buttonStyles
            = (this._isToggled() ? toggledStyles : styles) || styles;

        if (this._isDisabled() && buttonStyles && disabledStyles) {
            return {
                iconStyle: combineStyles(
                    buttonStyles.iconStyle ?? {}, disabledStyles.iconStyle ?? {}),
                labelStyle: combineStyles(
                    buttonStyles.labelStyle ?? {}, disabledStyles.labelStyle ?? {}),
                style: combineStyles(
                    buttonStyles.style ?? {}, disabledStyles.style ?? {}),
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
        return (this._isToggled() ? this.toggledTooltip : this.tooltip)
            || this.tooltip
            || '';
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
    _isToggled(): boolean | undefined {
        return undefined;
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @param {Object} e - Event.
     * @private
     * @returns {void}
     */
    _onClick(e?: React.MouseEvent | GestureResponderEvent) {
        const { afterClick, buttonKey, handleClick, notifyMode } = this.props;

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

        afterClick?.(e);

        // blur after click to release focus from button to allow PTT.
        // @ts-ignore
        e?.currentTarget?.blur && e.currentTarget.blur();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render(): ReactNode {
        const props: any = {
            ...this.props,
            accessibilityLabel: this._getAccessibilityLabel(),
            elementAfter: this._getElementAfter(),
            icon: this._getIcon(),
            label: this._getLabel(),
            labelProps: this.labelProps,
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
