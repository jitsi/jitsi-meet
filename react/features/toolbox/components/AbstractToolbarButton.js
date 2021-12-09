/* @flow */

import { Component } from 'react';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractToolbarButton}.
 */
export type Props = {

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     */
    accessibilityLabel: string,

    /**
     * The Icon of this {@code AbstractToolbarButton}.
     */
    icon: Object,

    /**
     * The style of the Icon of this {@code AbstractToolbarButton}.
     */
    iconStyle?: Object,

    /**
     * On click handler.
     */
    onClick: Function,

    /**
     * {@code AbstractToolbarButton} Styles.
     */
    style?: Array<string> | Object,

    /**
     * An optional modifier to render the button toggled.
     */
    toggled?: boolean,

    /**
     * The color underlaying the button.
     */
    underlayColor?: any
};

/**
 * Abstract (base) class for a button in {@link Toolbar}.
 *
 * @abstract
 */
export default class AbstractToolbarButton<P: Props, State=void> extends Component<P, State> {
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

    _onClick: (any) => any;

    /**
     * Handles clicking/pressing this {@code AbstractToolbarButton} by
     * forwarding the event to the {@code onClick} prop of this instance if any.
     *
     * @protected
     * @returns {*} The result returned by the invocation of the {@code onClick}
     * prop of this instance if any.
     */
    _onClick(...args) {
        const { onClick } = this.props;

        return onClick && onClick(...args);
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

    _renderButton: (React$Element<any> | null) => React$Element<any>;

    _renderIcon: () => React$Element<any> | null;
}
