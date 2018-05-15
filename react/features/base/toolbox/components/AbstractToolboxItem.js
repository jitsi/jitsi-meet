// @flow

import { Component } from 'react';

export type Styles = {

    /**
     * Style for the item's icon.
     */
    iconStyle: Object,

    /**
     * Style for te item's label.
     */
    labelStyle: Object,

    /**
     * Style for the item itself.
     */
    style: Object,

    /**
     * Color for the item underlay (shows when clicked).
     */
    underlayColor: string
};

export type Props = {

    /**
     * A succinct description of what the item does. Used by accessibility
     * tools and torture tests.
     */
    accessibilityLabel: string,

    /**
     * Whether this item is disabled or not. When disabled, clicking an the item
     * has no effect, and it may reflect on its style.
     */
    disabled: boolean,

    /**
     * The name of the icon of this {@code ToolboxItem}.
     */
    iconName: string,

    /**
     * The text associated with this item. When `showLabel` is set to
     * {@code true}, it will be displayed alongside the icon.
     */
    label: string,

    /**
     * On click handler.
     */
    onClick: Function,

    /**
     * Whether to show the label or not.
     */
    showLabel: boolean,

    /**
     * Collection of styles for the item. Used only on native.
     */
    styles: ?Styles,

    /**
     * Invoked to obtain translated strings.
     */
    t: ?Function,

    /**
     * The text to display in the tooltip. Used only on web.
     */
    tooltip: string,

    /**
     * From which direction the tooltip should appear, relative to the
     * item. Used only on web.
     */
    tooltipPosition: string,

    /**
     * Whether this item is visible or not.
     */
    visible: boolean
};

/**
 * Abstract (base) class for an item in {@link Toolbox}. The item can be located
 * anywhere in the {@link Toolbox}, it will morph its shape to accommodate it.
 *
 * @abstract
 */
export default class AbstractToolboxItem<P : Props> extends Component<P> {
    /**
     * Default values for {@code AbstractToolboxItem} component's properties.
     *
     * @static
     */
    static defaultProps = {
        disabled: false,
        label: '',
        showLabel: false,
        t: undefined,
        tooltip: '',
        tooltipPosition: 'top',
        visible: true
    };

    /**
     * Initializes a new {@code AbstractToolboxItem} instance.
     *
     * @param {Object} props - The React {@code Component} props to initialize
     * the new {@code AbstractToolboxItem} instance with.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Helper property to get the item label. If a translation function was
     * provided then it will be translated using it.
     *
     * @protected
     * @returns {?string}
     */
    get label(): ?string {
        return this._maybeTranslateAttribute(this.props.label);
    }

    /**
     * Helper property to get the item tooltip. If a translation function was
     * provided then it will be translated using it.
     *
     * @protected
     * @returns {?string}
     */
    get tooltip(): ?string {
        return this._maybeTranslateAttribute(this.props.tooltip);
    }

    /**
     * Utility function to translate the given string, if a translation
     * function is available.
     *
     * @param {string} text - What needs translating.
     * @private
     * @returns {string}
     */
    _maybeTranslateAttribute(text) {
        const { t } = this.props;

        return typeof t === 'function' ? t(text) : text;
    }

    _onClick: (*) => void;

    /**
     * Handles clicking/pressing this {@code AbstractToolboxItem} by
     * forwarding the event to the {@code onClick} prop of this instance if any.
     *
     * @protected
     * @returns {void}
     */
    _onClick(...args) {
        const { disabled, onClick } = this.props;

        disabled || (onClick && onClick(...args));
    }

    /**
     * Handles rendering of the actual item.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderItem() {
        // To be implemented by a subclass.
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this.props.visible ? this._renderItem() : null;
    }
}
