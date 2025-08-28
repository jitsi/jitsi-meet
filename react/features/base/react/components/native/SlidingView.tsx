import React, { PureComponent, ReactNode } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    TouchableWithoutFeedback,
    View,
    ViewStyle
} from 'react-native';

import { StyleType } from '../../../styles/functions.any';

import styles from './slidingviewstyles';

/**
 * The type of the React {@code Component} props of {@link SlidingView}.
 */
interface IProps {

    /**
     * The children of {@code SlidingView}.
     */
    children: ReactNode;

    /**
     * Callback to notify the containing {@code Component} that the view is
     * closing.
     */
    onHide: Function;

    /**
     * Position of the SlidingView: 'left', 'right', 'top', 'bottom'.
     * Later).
     */
    position: string;

    /**
     * Whether the {@code SlidingView} is to be displayed/rendered/shown or not.
     */
    show: boolean;

    /**
     * Style of the animated view.
     */
    style?: StyleType;
}

/**
 * The type of the React {@code Component} state of {@link SlidingView}.
 */
interface IState {

    /**
     * Offset to move the view out of the screen.
     */
    positionOffset: number;

    /**
     * Whether the sliding overlay should be displayed/rendered/shown.
     */
    showOverlay: boolean;

    /**
     * The native animation object.
     */
    sliderAnimation: Animated.Value;
}

/**
 * A generic animated slider view to be used for animated menus.
 */
export default class SlidingView extends PureComponent<IProps, IState> {
    /**
     * Initializes hardwareBackPress subscription.
     */
    _hardwareBackPressSubscription: any;

    /**
     * True if the component is mounted.
     */
    _mounted: boolean;

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, prevState: IState) {
        return {
            showOverlay: props.show || prevState.showOverlay
        };
    }

    /**
     * Initializes a new {@code SlidingView} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        const { height, width } = Dimensions.get('window');
        const { position } = props;

        let positionOffset = height;

        if (position === 'left' || position === 'right') {
            positionOffset = width;
        }

        this.state = {
            showOverlay: false,
            sliderAnimation: new Animated.Value(0),
            positionOffset
        };

        // Bind event handlers so they are only bound once per instance.
        this._onHardwareBackPress = this._onHardwareBackPress.bind(this);
        this._onHide = this._onHide.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this._hardwareBackPressSubscription = BackHandler.addEventListener('hardwareBackPress', this._onHardwareBackPress);

        this._mounted = true;
        this._setShow(this.props.show);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const { show } = this.props;

        if (prevProps.show !== show) {
            this._setShow(show);
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._hardwareBackPressSubscription?.remove();

        this._mounted = false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const { showOverlay } = this.state;

        if (!showOverlay) {
            return null;
        }

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.sliderViewContainer } >
                <TouchableWithoutFeedback
                    onPress = { this._onHide } >
                    <View style = { styles.sliderViewShadow } />
                </TouchableWithoutFeedback>
                <Animated.View
                    pointerEvents = 'box-none'
                    style = { this._getContentStyle() as ViewStyle }>
                    { this.props.children }
                </Animated.View>
            </View>
        );
    }

    /**
     * Assembles a style array for the SlideView content.
     *
     * @private
     * @returns {Array<Object>}
     */
    _getContentStyle() {
        const style = {
            ...this.props.style,
            ...styles.sliderViewContent
        };
        const { positionOffset } = this.state;

        switch (this.props.position) {
        case 'bottom':
            Object.assign(style, {
                bottom: -positionOffset,
                left: 0,
                right: 0,
                top: positionOffset
            }, {
                transform: [ { translateY: this.state.sliderAnimation } ]
            });
            break;
        case 'left':
            Object.assign(style, {
                bottom: 0,
                left: -positionOffset,
                right: positionOffset,
                top: 0
            }, {
                transform: [ { translateX: this.state.sliderAnimation } ]
            });
            break;
        }

        return style;
    }

    /**
     * Callback to handle the hardware back button.
     *
     * @returns {boolean}
     */
    _onHardwareBackPress() {
        this._onHide();

        return true;
    }

    /**
     * Hides the slider.
     *
     * @private
     * @returns {void}
     */
    _onHide() {
        this._setShow(false)
            .then(() => {
                const { onHide } = this.props;

                onHide?.();
            });
    }

    /**
     * Shows/hides the slider menu.
     *
     * @param {boolean} show - If the slider view is to be made visible,
     * {@code true}; otherwise, {@code false}.
     * @private
     * @returns {Promise}
     */
    _setShow(show: boolean) {
        return new Promise<void>(resolve => {
            if (!this._mounted) {
                resolve();

                return;
            }

            const { positionOffset } = this.state;
            const { position } = this.props;
            let toValue = positionOffset;

            if (position === 'bottom' || position === 'right') {
                toValue = -positionOffset;
            }

            Animated
                .timing(
                    /* value */ this.state.sliderAnimation,
                    /* config */ {
                        duration: 200,
                        toValue: show ? toValue : 0,
                        useNativeDriver: true
                    })
                .start(({ finished }) => {
                    finished && this._mounted && !show
                        && this.setState({ showOverlay: false }, () => {
                            this.forceUpdate();
                        });
                    resolve();
                });
        });
    }
}
