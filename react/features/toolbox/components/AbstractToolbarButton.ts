import React, { Component, ReactElement } from 'react';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractToolbarButton}.
 */
export interface IProps {

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     */
    accessibilityLabel: string;

    /**
     * The Icon of this {@code AbstractToolbarButton}.
     */
    icon: Object;

    /**
     * The style of the Icon of this {@code AbstractToolbarButton}.
     */
    iconStyle?: Object;

    /**
     * On click handler.
     */
    onClick: Function;

    /**
     * {@code AbstractToolbarButton} Styles.
     */
    style?: Array<string> | Object;

    /**
     * An optional modifier to render the button toggled.
     */
    toggled?: boolean;

    /**
     * The color underlying the button.
     */
    underlayColor?: any;
}

/**
 * Abstract (base) class for a button in {@link Toolbar}.
 *
 * @abstract
 */
export default class AbstractToolbarButton<P extends IProps, State=void> extends Component<P, State> {
    /**
     * Initializes a new {@code AbstractToolbarButton} instance.
     *
     * @param {Object} props - The React {@code Component} props to initialize
     * the new {@code AbstractToolbarButton} instance with.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Handles clicking/pressing this {@code AbstractToolbarButton} by
     * forwarding the event to the {@code onClick} prop of this instance if any.
     *
     * @protected
     * @returns {*} The result returned by the invocation of the {@code onClick}
     * prop of this instance if any.
     */
    _onClick(...args: any) {
        const { onClick } = this.props;

        return onClick?.(...args);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this._renderButton(this._renderIcon());
    }

    /**
     * Render a button element.
     *
     * @param {ReactElement | null} _el - The element to render inside the button.
     * @returns {ReactElement}
     */
    _renderButton(_el: ReactElement | null): React.ReactElement | null {
        return null;
    }

    /**
     * Render an icon element.
     *
     * @returns {ReactElement | null}
     */
    _renderIcon(): React.ReactElement | null {
        return null;
    }
}
