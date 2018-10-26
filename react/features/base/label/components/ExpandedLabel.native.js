// @flow

import React, { Component } from 'react';
import { Animated, Text, View } from 'react-native';

import styles, { DEFAULT_COLOR, LABEL_MARGIN, LABEL_SIZE } from './styles';

export type Props = {

    /**
     * The position of the parent element (from right to left) to display the
     * arrow.
     */
    parentPosition: number
};

type State = {

    /**
     * The opacity animation Object.
     */
    opacityAnimation: Object,

    /**
     * A boolean to descide to show or not show the arrow. This is required as
     * we can't easily animate this transformed Component so we render it once
     * the animation is done.
     */
    showArrow: boolean
};

/**
 * Offset to the arrow to be rendered in the right position.
 */
const ARROW_OFFSET = 0;

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code Label}.
 */
export default class ExpandedLabel<P: Props> extends Component<P, State> {
    /**
     * Instantiates a new {@code ExpandedLabel} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            opacityAnimation: new Animated.Value(0),
            showArrow: false
        };
    }

    /**
     * Implements React {@code Component}'s componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        Animated.decay(this.state.opacityAnimation, {
            toValue: 1,
            velocity: 1,
            useNativeDriver: true
        }).start(({ finished }) => {
            finished && this.setState({
                showArrow: true
            });
        });
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const arrowPosition
            = this.props.parentPosition - LABEL_MARGIN - (LABEL_SIZE / 2);

        return (
            <Animated.View
                style = { [
                    styles.expandedLabelWrapper,
                    {
                        opacity: this.state.opacityAnimation
                    }
                ] } >
                <View
                    style = { [
                        styles.expandedLabelArrow,
                        {
                            backgroundColor: this._getColor() || DEFAULT_COLOR,
                            marginRight: arrowPosition + ARROW_OFFSET
                        }
                    ] } />
                <View
                    style = { [
                        styles.expandedLabelContainer,
                        {
                            backgroundColor: this._getColor() || DEFAULT_COLOR
                        }
                    ] }>
                    <Text style = { styles.expandedLabelText }>
                        { this._getLabel() }
                    </Text>
                </View>
            </Animated.View>
        );
    }

    /**
     * Returns the label that needs to be rendered in the box. To be implemented
     * by its overriding classes.
     *
     * @returns {string}
     */
    _getLabel: () => string

    _getColor: () => string

    /**
     * Defines the color of the expanded label. This function returns a default
     * value if implementing classes don't override it, but the goal is to have
     * expanded labels matching to circular labels in color.
     * If implementing classes return a falsy value, it also uses the default
     * color.
     *
     * @returns {string}
     */
    _getColor() {
        return DEFAULT_COLOR;
    }
}
