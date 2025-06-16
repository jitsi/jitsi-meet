import React, { Component } from 'react';
import { Animated, Text, ViewStyle } from 'react-native';

import Icon from '../../../icons/components/Icon';
import { StyleType, combineStyles } from '../../../styles/functions.native';

import styles from './styles';

/**
 * Const for status string 'in progress'.
 */
const STATUS_IN_PROGRESS = 'in_progress';

/**
 * Const for status string 'off'.
 */
const STATUS_OFF = 'off';

interface IProps {

    /**
     * An SVG icon to be rendered as the content of the label.
     */
    icon?: Function;

    /**
     * Color for the icon.
     */
    iconColor?: string;

    /**
     * Status of the label. This prop adds some additional styles based on its
     * value. E.g. If status = off, it will render the label symbolising that
     * the thing it displays (e.g. Recording) is off.
     */
    status?: 'in_progress' | 'off' | 'on';

    /**
     * Style of the label.
     */
    style?: StyleType;

    /**
     * String or component that will be rendered as the label itself.
     */
    text?: string;

    /**
     * Custom styles for the text.
     */
    textStyle?: StyleType;

}

type State = {

    /**
     * An animation object handling the opacity changes of the in progress
     * label.
     */
    pulseAnimation: Animated.Value;
};

/**
 * Renders a circular indicator to be used for status icons, such as recording
 * on, audio-only conference, video quality and similar.
 */
export default class Label extends Component<IProps, State> {
    /**
     * A reference to the started animation of this label.
     */
    animationReference: Animated.CompositeAnimation;

    /**
     * Instantiates a new instance of {@code Label}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            pulseAnimation: new Animated.Value(0)
        };
    }

    /**
     * Implements {@code Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._maybeToggleAnimation({}, this.props);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        this._maybeToggleAnimation(prevProps, this.props);
    }

    /**
     * Implements React {@link Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { icon, text, status, style, iconColor, textStyle } = this.props;

        let extraStyle = null;

        switch (status) {
        case STATUS_IN_PROGRESS:
            extraStyle = {
                opacity: this.state.pulseAnimation
            };
            break;
        case STATUS_OFF:
            extraStyle = styles.labelOff;
            break;
        }

        return (
            <Animated.View
                style = { [
                    combineStyles(styles.labelContainer, style ?? {}),
                    extraStyle as ViewStyle
                ] }>
                { icon && <Icon
                    color = { iconColor }
                    size = '18'
                    src = { icon } /> }
                { text && <Text style = { [ styles.labelText, textStyle ] }>
                    { text }
                </Text>}
            </Animated.View>
        );
    }

    /**
     * Checks if the animation has to be started or stopped and acts
     * accordingly.
     *
     * @param {IProps} oldProps - The previous values of the Props.
     * @param {IProps} newProps - The new values of the Props.
     * @returns {void}
     */
    _maybeToggleAnimation(oldProps: Partial<IProps>, newProps: IProps) {
        const { status: oldStatus } = oldProps;
        const { status: newStatus } = newProps;
        const { pulseAnimation } = this.state;

        if (newStatus === STATUS_IN_PROGRESS
                && oldStatus !== STATUS_IN_PROGRESS) {
            // Animation must be started
            this.animationReference = Animated.loop(Animated.sequence([
                Animated.timing(pulseAnimation, {
                    delay: 500,
                    toValue: 1,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 0.3,
                    useNativeDriver: true
                })
            ]));

            this.animationReference.start();
        } else if (this.animationReference
                && newStatus !== STATUS_IN_PROGRESS
                && oldStatus === STATUS_IN_PROGRESS) {
            // Animation must be stopped
            this.animationReference.stop();
        }
    }
}
