// @flow

import React, { Component } from 'react';
import { PanResponder, View } from 'react-native';

const moveThresholdDismissesTouch = 2;
const tapTimeoutMS = 400;

type Props = {
    children: Object,
    onGesture: Function,
    style: Object
};

/**
 * An empty container that captures gestures such as pinch&zoom, touch or move.
 */
export default class GestureResponderView extends Component<Props> {
    /**
     * The gesture handler object.
     */
    gestureHandlers: PanResponder;

    /**
     * The initial distance of the fingers on pinch start.
     */
    initialDistance: number;

    /**
     * The initial position of the finger on touch start.
     */
    initialPosition: {
        x: number,
        y: number
    };

    /**
     * Time of the last tap.
     */
    lastTap: number;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onGesture = this._onGesture.bind(this);
        this._onMoveShouldSetPanResponder
            = this._onMoveShouldSetPanResponder.bind(this);
        this._onPanResponderGrant = this._onPanResponderGrant.bind(this);
        this._onPanResponderMove = this._onPanResponderMove.bind(this);
        this._onPanResponderRelease = this._onPanResponderRelease.bind(this);
    }

    /**
     * Implements React Component's componentWillMount function.
     *
     * @inheritdoc
     */
    componentWillMount() {
        this.gestureHandlers = PanResponder.create({
            onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder,
            onPanResponderGrant: this._onPanResponderGrant,
            onPanResponderMove: this._onPanResponderMove,
            onPanResponderRelease: this._onPanResponderRelease,
            onPanResponderTerminationRequest: () => true,
            onShouldBlockNativeResponder: () => false,
            onStartShouldSetPanResponder: () => true
        });
    }

    /**
     * Renders the empty component that captures the gestures.
     *
     * @inheritdoc
     */
    render() {
        const { children, style } = this.props;

        return (
            <View
                style = { style }
                { ...this.gestureHandlers.panHandlers }>
                {
                    children
                }
            </View>
        );
    }

    _didMove: Object => boolean

    /**
     * Determines if there was large enough movement to be handled.
     *
     * @param {Object} gestureState - The gesture state.
     * @returns {boolean}
     */
    _didMove(gestureState) {
        return Math.abs(gestureState.dx) > moveThresholdDismissesTouch
                || Math.abs(gestureState.dy) > moveThresholdDismissesTouch;
    }

    _getTouchDistance: Object => number;

    /**
     * Calculates the touch distance on a pinch event.
     *
     * @private
     * @param {Object} evt - The touch event.
     * @returns {number}
     */
    _getTouchDistance(evt) {
        const { touches } = evt.nativeEvent;
        const dx = Math.abs(touches[0].pageX - touches[1].pageX);
        const dy = Math.abs(touches[0].pageY - touches[1].pageY);

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }

    _getTouchPosition: Object => Object

    /**
     * Calculates the position of the touch event.
     *
     * @private
     * @param {Object} evt - The touch event.
     * @returns {Object}
     */
    _getTouchPosition(evt) {
        const { touches } = evt.nativeEvent;

        return {
            x: touches[0].pageX,
            y: touches[0].pageY
        };
    }

    _onGesture: (string, ?Object | number) => void

    /**
     * Constructs a gesture event and sends it to the callback.
     *
     * Currently supported gestures:
     *  - Scale (punch&zoom-type scale).
     *  - Move.
     *  - Press.
     *
     * @param {string} type - The type of the gesture.
     * @param {?Object | number} value - The value of the gesture, if any.
     * @returns {void}
     */
    _onGesture(type, value) {
        const { onGesture } = this.props;

        if (typeof onGesture === 'function') {
            onGesture({
                type,
                value
            });
        }

        this.lastTap = 0;
    }

    _onMoveShouldSetPanResponder: (Object, Object) => boolean

    /**
     * Function to decide if the responder should respond to a move event
     * or not.
     *
     * @private
     * @param {Object} evt - The event.
     * @param {Object} gestureState - Gesture state.
     * @returns {boolean}
     */
    _onMoveShouldSetPanResponder(evt, gestureState) {
        return this._didMove(gestureState)
                || gestureState.numberActiveTouches === 2;
    }

    _onPanResponderGrant: (Object, Object) => void

    /**
     * Calculates the initial touch distance.
     *
     * @private
     * @param {Object} evt - Touch event.
     * @param {Object} gestureState - Gesture state.
     * @returns {void}
     */
    _onPanResponderGrant(evt, gestureState) {
        console.log('ZB: _onPanResponderGrant');
        if (gestureState.numberActiveTouches === 2) {
            this.initialDistance = this._getTouchDistance(evt);
        } else if (gestureState.numberActiveTouches === 1) {
            this.initialPosition = this._getTouchPosition(evt);
            this.lastTap = Date.now();
        }
    }

    _onPanResponderMove: (Object, Object) => void

    /**
     * Handles the PanResponder move (touch move) event.
     *
     * @private
     * @param {Object} evt - Touch event.
     * @param {Object} gestureState - Gesture state.
     * @returns {void}
     */
    _onPanResponderMove(evt, gestureState) {
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
                && isNaN(this.initialDistance)
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

    _onPanResponderRelease: () => void

    /**
     * Handles the PanResponder gesture end event.
     *
     * @private
     * @returns {void}
     */
    _onPanResponderRelease() {
        if (this.lastTap) {
            if (Date.now() - this.lastTap < tapTimeoutMS) {
                this._onGesture('press');
            }
        }
        delete this.initialDistance;
        delete this.initialPosition;
    }
}
