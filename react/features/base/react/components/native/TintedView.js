// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { ColorPalette } from '../../../styles';

/**
 * Base style for the {@code TintedView} component.
 */
const BASE_STYLE = {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
};

/**
 * {@code TintedView}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * The children components of this component.
     */
    children?: React$Node,

    /**
     * Color used as the background of the view. Defaults to
     */
    color: string,

    /**
     * Opacity for the
     */
    opacity: number,

    /**
     * Style to override the base style.
     */
    style: Object
};

/**
 * {@code TintedView}'s React {@code Component} state.
 */
type State = {

    /**
     * The style of {@code TintedView} which is a combination of its default
     * style, the consumer-specified style.
     */
    style: Object
};

/**
 * Implements a component aimed at covering another view and tinting it with
 * the given color and opacity.
 */
export default class TintedView extends Component<Props, State> {
    /**
     * Default values for the component's props.
     */
    static defaultProps = {
        color: ColorPalette.appBackground,
        opacity: 0.8,
        style: {}
    };

    /**
     * Initializes a new {@code TintedView} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this.componentWillReceiveProps(props);
    }

    /**
     * Notifies this mounted React {@code Component} that it will receive new
     * props. Forks (in Facebook/React speak) the prop {@code style} because its
     * value is to be combined with the default style.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React {@code Component} props
     * that this instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps: Object) {
        // style
        const prevColor = this.props && this.props.color;
        const prevOpacity = this.props && this.props.opacity;
        const prevStyle = this.props && this.props.style;

        const nextColor = nextProps && nextProps.color;
        const nextOpacity = nextProps && nextProps.opacity;
        const nextStyle = nextProps && nextProps.style;

        const assignState = !this.state;

        if (assignState
                || prevColor !== nextColor
                || prevOpacity !== nextOpacity
                || prevStyle !== nextStyle) {
            const nextState = {
                style: {
                    ...BASE_STYLE,
                    ...nextStyle,
                    backgroundColor: nextColor,
                    opacity: nextOpacity
                }
            };

            if (assignState) {
                // eslint-disable-next-line react/no-direct-mutation-state
                this.state = nextState;
            } else {
                this.setState(nextState);
            }
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // XXX Don't tint the children, tint the background only.
        return (
            <View style = { BASE_STYLE }>
                <View style = { this.state.style } />
                <View style = { BASE_STYLE }>
                    { this.props.children }
                </View>
            </View>
        );
    }
}
