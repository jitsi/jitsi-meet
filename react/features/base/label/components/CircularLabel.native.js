// @flow
import React from 'react';
import { Animated, Text } from 'react-native';

import Icon from '../../icons/components/Icon';
import { combineStyles, type StyleType } from '../../styles';

import AbstractCircularLabel, {
    type Props as AbstractProps
} from './AbstractCircularLabel';
import styles from './styles';

/**
 * Const for status string 'in progress'.
 */
const STATUS_IN_PROGRESS = 'in_progress';

/**
 * Const for status string 'off'.
 */
const STATUS_OFF = 'off';

type Props = AbstractProps & {

    /**
     * Status of the label. This prop adds some additional styles based on its
     * value. E.g. if status = off, it will render the label symbolising that
     * the thing it displays (e.g. recording) is off.
     */
    status: ('in_progress' | 'off' | 'on'),

    /**
     * Style of the label.
     */
    style?: ?StyleType
};

type State = {

    /**
     * An animation object handling the opacity changes of the in progress
     * label.
     */
    pulseAnimation: Object
}

/**
 * Renders a circular indicator to be used for status icons, such as recording
 * on, audio-only conference, video quality and similar.
 */
export default class CircularLabel extends AbstractCircularLabel<Props, State> {
    /**
     * A reference to the started animation of this label.
     */
    animationReference: Object;

    /**
     * Instantiates a new instance of {@code CircularLabel}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
    componentDidUpdate(prevProps: Props) {
        this._maybeToggleAnimation(prevProps, this.props);
    }

    /**
     * Implements React {@link Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { icon, label, status, style } = this.props;

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

        const labelComponent = icon
            ? (
                <Icon
                    src = { icon }
                    style = { styles.indicatorIcon } />
            ) : (
                <Text style = { styles.indicatorText }>
                    { label }
                </Text>
            );

        return (
            <Animated.View
                style = { [
                    combineStyles(styles.indicatorContainer, style),
                    extraStyle
                ] }>
                { labelComponent }
            </Animated.View>
        );
    }

    /**
     * Checks if the animation has to be started or stopped and acts
     * accordingly.
     *
     * @param {Props} oldProps - The previous values of the Props.
     * @param {Props} newProps - The new values of the Props.
     * @returns {void}
     */
    _maybeToggleAnimation(oldProps, newProps) {
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
