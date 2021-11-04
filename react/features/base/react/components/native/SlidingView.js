// @flow

import React, { PureComponent, type Node } from 'react';
import {
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { BackButtonRegistry } from '../../../../mobile/back-button';
import { type StyleType } from '../../../styles';

import styles from './slidingviewstyles';

/**
 * The type of the React {@code Component} props of {@link SlidingView}.
 */
type Props = {

    /**
     * The children of {@code SlidingView}.
     */
    children: Node,

    /**
     * Callback to notify the containing {@code Component} that the view is
     * closing.
     */
    onHide: Function,

    /**
     * Position of the SlidingView: 'left', 'right', 'top', 'bottom'.
     * Later).
     */
    position: string,

    /**
     * Whether the {@code SlidingView} is to be displayed/rendered/shown or not.
     */
    show: boolean,

    /**
     * Style of the animated view.
     */
    style: StyleType
};

/**
 * The type of the React {@code Component} state of {@link SlidingView}.
 */
type State = {

    /**
     * Whether the sliding overlay should be displayed/rendered/shown.
     */
    showOverlay: boolean,

    /**
     * The native animation object.
     */
    sliderAnimation: Animated.Value,

    /**
     * Offset to move the view out of the screen.
     */
    positionOffset: number
};

/**
 * A generic animated slider view to be used for animated menus.
 */
export default class SlidingView extends PureComponent<Props, State> {
    /**
     * True if the component is mounted.
     */
    _mounted: boolean;

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, prevState: State) {
        return {
            showOverlay: props.show || prevState.showOverlay
        };
    }

    /**
     * Initializes a new {@code SlidingView} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
    componentDidMount() {
        BackButtonRegistry.addListener(this._onHardwareBackPress, true);

        this._mounted = true;
        this._setShow(this.props.show);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
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
    componentWillUnmount() {
        BackButtonRegistry.removeListener(this._onHardwareBackPress);

        this._mounted = false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
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
                    style = { this._getContentStyle() }>
                    { this.props.children }
                </Animated.View>
            </View>
        );
    }

    _getContentStyle: () => Array<Object>;

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

    _onHardwareBackPress: () => boolean;

    /**
     * Callback to handle the hardware back button.
     *
     * @returns {boolean}
     */
    _onHardwareBackPress() {
        const { onHide } = this.props;

        if (typeof onHide === 'function') {
            return onHide();
        }

        return false;
    }

    _onHide: () => void;

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

                onHide && onHide();
            });
    }

    _setShow: (boolean) => Promise<*>;

    /**
     * Shows/hides the slider menu.
     *
     * @param {boolean} show - If the slider view is to be made visible,
     * {@code true}; otherwise, {@code false}.
     * @private
     * @returns {Promise}
     */
    _setShow(show) {
        return new Promise(resolve => {
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
