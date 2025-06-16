import React, { Component } from 'react';
import { PanResponder, PixelRatio, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { ASPECT_RATIO_WIDE } from '../../../responsive-ui/constants';
import { storeVideoTransform } from '../../actions';

import styles from './styles';


/**
 * The default/initial transform (= no transform).
 */
const DEFAULT_TRANSFORM = {
    scale: 1,
    translateX: 0,
    translateY: 0
};

/**
 * The minimum scale (magnification) multiplier. 1 is equal to objectFit
 * = 'contain'.
 */
const MIN_SCALE = 1;

/*
 * The max distance from the edge of the screen where we let the user move the
 * view to. This is large enough now to let the user drag the view to a position
 * where no other displayed components cover it (such as filmstrip). If a
 * ViewPort (hint) support is added to the LargeVideo component then this
 * constant will not be necessary anymore.
 */
const MAX_OFFSET = 100;

/**
 * The max allowed scale (magnification) multiplier.
 */
const MAX_SCALE = 5;

/**
 * The threshold to allow the fingers move before we consider a gesture a
 * move instead of a touch.
 */
const MOVE_THRESHOLD_DISMISSES_TOUCH = 5;

/**
 * A tap timeout after which we consider a gesture a long tap and will not
 * trigger onPress (unless long tap gesture support is added in the future).
 */
const TAP_TIMEOUT_MS = 400;

/**
 * Type of a transform object this component is capable of handling.
 */
type Transform = {
    scale: number;
    translateX: number;
    translateY: number;
};

interface IProps {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol;

    /**
     * Action to dispatch when the component is unmounted.
     */
    _onUnmount: Function;

    /**
     * The stored transforms retrieved from Redux to be initially applied
     * to different streams.
     */
    _transforms: Object;

    /**
     * The children components of this view.
     */
    children: Object;

    /**
     * Transformation is only enabled when this flag is true.
     */
    enabled: boolean;

    /**
     * Function to invoke when a press event is detected.
     */
    onPress?: Function;

    /**
     * The id of the current stream that is displayed.
     */
    streamId: string;

    /**
     * Style of the top level transformable view.
     */
    style: Object;
}

interface IState {

    /**
     * The current (non-transformed) layout of the View.
     */
    layout: any;

    /**
     * The current transform that is applied.
     */
    transform: Transform;
}

/**
 * An container that captures gestures such as pinch&zoom, touch or move.
 */
class VideoTransform extends Component<IProps, IState> {
    /**
     * The gesture handler object.
     */
    gestureHandlers: any;

    /**
     * The initial distance of the fingers on pinch start.
     */
    initialDistance?: number;

    /**
     * The initial position of the finger on touch start.
     */
    initialPosition: {
        x: number;
        y: number;
    };

    /**
     * The actual move threshold that is calculated for this device/screen.
     */
    moveThreshold: number;

    /**
     * Time of the last tap.
     */
    lastTap: number;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            layout: null,
            transform:
                this._getSavedTransform(props.streamId) || DEFAULT_TRANSFORM
        };

        this._didMove = this._didMove.bind(this);
        this._getTransformStyle = this._getTransformStyle.bind(this);
        this._onGesture = this._onGesture.bind(this);
        this._onLayout = this._onLayout.bind(this);
        this._onMoveShouldSetPanResponder
            = this._onMoveShouldSetPanResponder.bind(this);
        this._onPanResponderGrant = this._onPanResponderGrant.bind(this);
        this._onPanResponderMove = this._onPanResponderMove.bind(this);
        this._onPanResponderRelease = this._onPanResponderRelease.bind(this);
        this._onStartShouldSetPanResponder
            = this._onStartShouldSetPanResponder.bind(this);

        // The move threshold should be adaptive to the pixel ratio of the
        // screen to avoid making it too sensitive or difficult to handle on
        // different pixel ratio screens.
        this.moveThreshold
            = PixelRatio.get() * MOVE_THRESHOLD_DISMISSES_TOUCH;

        this.gestureHandlers = PanResponder.create({
            onPanResponderGrant: this._onPanResponderGrant,
            onPanResponderMove: this._onPanResponderMove,
            onPanResponderRelease: this._onPanResponderRelease,
            onPanResponderTerminationRequest: () => true,
            onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder,
            onShouldBlockNativeResponder: () => false,
            onStartShouldSetPanResponder: this._onStartShouldSetPanResponder
        });
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (prevProps.streamId !== this.props.streamId) {
            this._storeTransform(prevProps.streamId, prevState.transform);
            this._restoreTransform(this.props.streamId);
        }
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._storeTransform(this.props.streamId, this.state.transform);
    }

    /**
     * Renders the empty component that captures the gestures.
     *
     * @inheritdoc
     */
    render() {
        const { _aspectRatio, children, style } = this.props;
        const isAspectRatioWide = _aspectRatio === ASPECT_RATIO_WIDE;

        const videoTransformedViewContainerStyles
            = isAspectRatioWide ? styles.videoTransformedViewContainerWide : styles.videoTransformedViewContainer;

        return (
            <View
                onLayout = { this._onLayout }
                pointerEvents = 'box-only'
                style = { [
                    videoTransformedViewContainerStyles,
                    style
                ] }
                { ...this.gestureHandlers.panHandlers }>
                <SafeAreaView
                    edges = { [ 'bottom', 'left' ] }
                    style = { [
                        styles.videoTranformedView,
                        this._getTransformStyle()
                    ] }>
                    { children }
                </SafeAreaView>
            </View>
        );
    }

    /**
     * Calculates the new transformation to be applied by merging the current
     * transform values with the newly received incremental values.
     *
     * @param {Transform} transform - The new transform object.
     * @private
     * @returns {Transform}
     */
    _calculateTransformIncrement(transform: Transform) {
        let {
            scale,
            translateX,
            translateY
        } = this.state.transform;
        const {
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY
        } = transform;

        // Note: We don't limit MIN_SCALE here yet, as we need to detect a scale
        // down gesture even if the scale is already at MIN_SCALE to let the
        // user return the screen to center with that gesture. Scale is limited
        // to MIN_SCALE right before it gets applied.
        scale = Math.min(scale * (newScale || 1), MAX_SCALE);

        translateX = translateX + ((newTranslateX || 0) / scale);
        translateY = translateY + ((newTranslateY || 0) / scale);

        return {
            scale,
            translateX,
            translateY
        };
    }

    /**
     * Determines if there was large enough movement to be handled.
     *
     * @param {Object} gestureState - The gesture state.
     * @returns {boolean}
     */
    _didMove({ dx, dy }: any) {
        return Math.abs(dx) > this.moveThreshold
                || Math.abs(dy) > this.moveThreshold;
    }

    /**
     * Returns the stored transform a stream should display with initially.
     *
     * @param {string} streamId - The id of the stream to match with a stored
     * transform.
     * @private
     * @returns {Object | null}
     */
    _getSavedTransform(streamId: string) {
        const { enabled, _transforms } = this.props;

        // @ts-ignore
        return (enabled && _transforms[streamId]) || null;
    }

    /**
     * Calculates the touch distance on a pinch event.
     *
     * @param {Object} evt - The touch event.
     * @private
     * @returns {number}
     */
    _getTouchDistance({ nativeEvent: { touches } }: any) {
        const dx = Math.abs(touches[0].pageX - touches[1].pageX);
        const dy = Math.abs(touches[0].pageY - touches[1].pageY);

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }

    /**
     * Calculates the position of the touch event.
     *
     * @param {Object} evt - The touch event.
     * @private
     * @returns {Object}
     */
    _getTouchPosition({ nativeEvent: { touches } }: any) {
        return {
            x: touches[0].pageX,
            y: touches[0].pageY
        };
    }

    /**
     * Generates a transform style object to be used on the component.
     *
     * @returns {{string: Array<{string: number}>}}
     */
    _getTransformStyle() {
        const { enabled } = this.props;

        if (!enabled) {
            return null;
        }

        const {
            scale,
            translateX,
            translateY
        } = this.state.transform;

        return {
            transform: [
                { scale },
                { translateX },
                { translateY }
            ]
        };
    }

    /**
     * Limits the move matrix and then applies the transformation to the
     * component (updates state).
     *
     * Note: Points A (top-left) and D (bottom-right) are opposite points of
     * the View rectangle.
     *
     * @param {Transform} transform - The transformation object.
     * @private
     * @returns {void}
     */
    _limitAndApplyTransformation(transform: Transform) {
        const { _aspectRatio } = this.props;
        const { layout } = this.state;

        const isAspectRatioWide = _aspectRatio === ASPECT_RATIO_WIDE;


        if (layout) {
            const { scale } = this.state.transform;
            const { scale: newScaleUnlimited } = transform;
            let {
                translateX: newTranslateX,
                translateY: newTranslateY
            } = transform;

            // Scale is only limited to MIN_SCALE here to detect downscale
            // gesture later.
            const newScale = Math.max(newScaleUnlimited, MIN_SCALE);

            // The A and D points of the original View (before transform).
            const originalLayout = {
                a: {
                    x: layout.x,
                    y: layout.y
                },
                d: {
                    x: layout.x + layout.width,
                    y: layout.y + layout.height
                }
            };

            // The center point (midpoint) of the transformed View.
            const transformedCenterPoint = {
                x: ((layout.x + layout.width) / 2) + (newTranslateX * newScale),
                y: ((layout.y + layout.height) / 2) + (newTranslateY * newScale)
            };

            // The size of the transformed View.
            const transformedSize = {
                height: layout.height * newScale,
                width: layout.width * newScale
            };

            // The A and D points of the transformed View.
            const transformedLayout = {
                a: {
                    x: transformedCenterPoint.x - (transformedSize.width / 2),
                    y: transformedCenterPoint.y - (transformedSize.height / 2)
                },
                d: {
                    x: transformedCenterPoint.x + (transformedSize.width / 2),
                    y: transformedCenterPoint.y + (transformedSize.height / 2)
                }
            };

            let _MAX_OFFSET = isAspectRatioWide ? 0 : MAX_OFFSET;

            if (newScaleUnlimited < scale) {
                // This is a negative scale event so we dynamically reduce the
                // MAX_OFFSET to get the screen back to the center on
                // downscaling.
                _MAX_OFFSET = Math.min(MAX_OFFSET, MAX_OFFSET * (newScale - 1));
            }

            // Correct move matrix if it goes out of the view
            // too much (_MAX_OFFSET).
            newTranslateX
                -= Math.max(
                    transformedLayout.a.x - originalLayout.a.x - _MAX_OFFSET,
                    0);
            newTranslateX
                += Math.max(
                    originalLayout.d.x - transformedLayout.d.x - _MAX_OFFSET,
                    0);
            newTranslateY
                -= Math.max(
                    transformedLayout.a.y - originalLayout.a.y - _MAX_OFFSET,
                    0);
            newTranslateY
                += Math.max(
                    originalLayout.d.y - transformedLayout.d.y - _MAX_OFFSET,
                    0);

            this.setState({
                transform: {
                    scale: newScale,
                    translateX: Math.round(newTranslateX),
                    translateY: Math.round(newTranslateY)
                }
            });
        }
    }

    /**
     * Handles gestures and converts them to transforms.
     *
     * Currently supported gestures:
     *  - scale (punch&zoom-type scale).
     *  - move
     *  - press.
     *
     * Note: This component supports onPress solely to overcome the problem of
     * not being able to register gestures via the PanResponder due to the fact
     * that the entire Conference component was a single touch responder
     * component in the past (see base/react/.../Container with an onPress
     * event) - and stock touch responder components seem to have exclusive
     * priority in handling touches in React.
     *
     * @param {string} type - The type of the gesture.
     * @param {?Object | number} value - The value of the gesture, if any.
     * @returns {void}
     */
    _onGesture(type: string, value?: any) {
        let transform;

        switch (type) {
        case 'move':
            transform = {
                ...DEFAULT_TRANSFORM,
                translateX: value.x,
                translateY: value.y
            };
            break;
        case 'scale':
            transform = {
                ...DEFAULT_TRANSFORM,
                scale: value
            };
            break;

        case 'press': {
            const { onPress } = this.props;

            typeof onPress === 'function' && onPress();
            break;
        }
        }

        if (transform) {
            this._limitAndApplyTransformation(
                this._calculateTransformIncrement(transform));
        }

        this.lastTap = 0;
    }

    /**
     * Callback for the onLayout of the component.
     *
     * @param {Object} event - The native props of the onLayout event.
     * @private
     * @returns {void}
     */
    _onLayout({ nativeEvent: { layout: { x, y, width, height } } }: any) {
        this.setState({
            layout: {
                x,
                y,
                width,
                height
            }
        });
    }

    /**
     * Function to decide whether the responder should respond to a move event.
     *
     * @param {Object} evt - The event.
     * @param {Object} gestureState - Gesture state.
     * @private
     * @returns {boolean}
     */
    _onMoveShouldSetPanResponder(evt: Object, gestureState: any) {
        return this.props.enabled
            && (this._didMove(gestureState)
                || gestureState.numberActiveTouches === 2);
    }

    /**
     * Calculates the initial touch distance.
     *
     * @param {Object} evt - Touch event.
     * @param {Object} gestureState - Gesture state.
     * @private
     * @returns {void}
     */
    _onPanResponderGrant(evt: Object, { numberActiveTouches }: any) {
        if (numberActiveTouches === 1) {
            this.initialPosition = this._getTouchPosition(evt);
            this.lastTap = Date.now();

        } else if (numberActiveTouches === 2) {
            this.initialDistance = this._getTouchDistance(evt);
        }
    }

    /**
     * Handles the PanResponder move (touch move) event.
     *
     * @param {Object} evt - Touch event.
     * @param {Object} gestureState - Gesture state.
     * @private
     * @returns {void}
     */
    _onPanResponderMove(evt: Object, gestureState: any) {
        if (gestureState.numberActiveTouches === 2) {
            // this is a zoom event
            if (
                this.initialDistance === undefined
                || isNaN(this.initialDistance)
            ) {
                // there is no initial distance because the user started
                // with only one finger. We calculate it now.
                this.initialDistance = this._getTouchDistance(evt);
            } else {
                const distance = this._getTouchDistance(evt);
                const scale = distance / (this.initialDistance || 1);

                this.initialDistance = distance;

                this._onGesture('scale', scale);
            }
        } else if (gestureState.numberActiveTouches === 1
                && (this.initialDistance === undefined
                || isNaN(this.initialDistance))
                && this._didMove(gestureState)) {
            // this is a move event
            const position = this._getTouchPosition(evt);
            const move = {
                x: position.x - this.initialPosition.x,
                y: position.y - this.initialPosition.y
            };

            this.initialPosition = position;

            this._onGesture('move', move);
        }
    }

    /**
     * Handles the PanResponder gesture end event.
     *
     * @private
     * @returns {void}
     */
    _onPanResponderRelease() {
        if (this.lastTap && Date.now() - this.lastTap < TAP_TIMEOUT_MS) {
            this._onGesture('press');
        }

        delete this.initialDistance;
        this.initialPosition = {
            x: 0,
            y: 0
        };
    }

    /**
     * Function to decide whether the responder should respond to a start
     * (touch) event.
     *
     * @private
     * @returns {boolean}
     */
    _onStartShouldSetPanResponder() {
        return typeof this.props.onPress === 'function';
    }

    /**
     * Restores the last applied transform when the component is mounted, or
     * a new stream is about to be rendered.
     *
     * @param {string} streamId - The stream id to restore transform for.
     * @private
     * @returns {void}
     */
    _restoreTransform(streamId: string) {
        const savedTransform = this._getSavedTransform(streamId);

        if (savedTransform) {
            this.setState({
                transform: savedTransform
            });
        }
    }

    /**
     * Stores/saves the a transform when the component is destroyed, or a
     * new stream is about to be rendered.
     *
     * @param {string} streamId - The stream id associated with the transform.
     * @param {Object} transform - The {@Transform} to save.
     * @private
     * @returns {void}
     */
    _storeTransform(streamId: string, transform: Transform) {
        const { _onUnmount, enabled } = this.props;

        if (enabled) {
            _onUnmount(streamId, transform);
        }
    }
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onUnmount: Function
 * }}
 */
function _mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        /**
         * Dispatches actions to store the last applied transform to a video.
         *
         * @param {string} streamId - The ID of the stream.
         * @param {Transform} transform - The last applied transform.
         * @private
         * @returns {void}
         */
        _onUnmount(streamId: string, transform: Transform) {
            dispatch(storeVideoTransform(streamId, transform));
        }
    };
}

/**
 * Maps (parts of) the redux state to the component's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _transforms: Object
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio,

        /**
         * The stored transforms retrieved from Redux to be initially applied to
         * different streams.
         *
         * @private
         * @type {Object}
         */
        _transforms: state['features/base/media'].video.transforms
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(VideoTransform);
