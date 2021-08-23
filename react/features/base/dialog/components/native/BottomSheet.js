// @flow

import React, { PureComponent, type Node } from 'react';
import { PanResponder, SafeAreaView, ScrollView, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { SlidingView } from '../../../react';
import { connect } from '../../../redux';
import { StyleType } from '../../../styles';

import { bottomSheetStyles as styles } from './styles';

/**
 * Minimal distance that needs to be moved by the finger to consider it a swipe.
 */
const GESTURE_DISTANCE_THRESHOLD = 5;

/**
 * The minimal speed needed to be achieved by the finger to consider it as a swipe.
 */
const GESTURE_SPEED_THRESHOLD = 0.2;

/**
 * The type of {@code BottomSheet}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * The height of the screen.
     */
    _height: number,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * Whether to add padding to scroll view.
     */
    addScrollViewPadding?: boolean,

    /**
     * The children to be displayed within this component.
     */
    children: Node,

    /**
     * Handler for the cancel event, which happens when the user dismisses
     * the sheet.
     */
    onCancel: ?Function,

    /**
     * Callback to be attached to the custom swipe event of the BottomSheet.
     */
    onSwipe?: Function,

    /**
     * Function to render a bottom sheet header element, if necessary.
     */
    renderHeader: ?Function,

    /**
     * Function to render a bottom sheet footer element, if necessary.
     */
    renderFooter: ?Function,

    /**
     * Whether to show sliding view or not.
     */
    showSlidingView?: boolean,

    /**
     * The component's external style
     */
    style: Object
};

/**
 * A component emulating Android's BottomSheet.
 */
class BottomSheet extends PureComponent<Props> {
    panResponder: Object;

    /**
     * Default values for {@code BottomSheet} component's properties.
     *
     * @static
     */
    static defaultProps = {
        addScrollViewPadding: true,
        showSlidingView: true
    };

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: this._onShouldSetResponder.bind(this),
            onMoveShouldSetPanResponder: this._onShouldSetResponder.bind(this),
            onPanResponderRelease: this._onGestureEnd.bind(this)
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _height,
            _styles,
            addScrollViewPadding,
            renderHeader,
            renderFooter,
            showSlidingView,
            style
        } = this.props;

        return (
            <SlidingView
                accessibilityRole = 'menu'
                accessibilityViewIsModal = { true }
                onHide = { this.props.onCancel }
                position = 'bottom'
                show = { showSlidingView }>
                <View
                    pointerEvents = 'box-none'
                    style = { styles.sheetContainer }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.sheetAreaCover } />
                    { renderHeader && renderHeader() }
                    <SafeAreaView
                        style = { [
                            styles.sheetItemContainer,
                            renderHeader
                                ? _styles.sheetHeader
                                : _styles.sheet,
                            style,
                            {
                                maxHeight: _height - 100
                            }
                        ] }
                        { ...this.panResponder.panHandlers }>
                        <ScrollView
                            bounces = { false }
                            showsVerticalScrollIndicator = { false }
                            style = { addScrollViewPadding && styles.scrollView } >
                            { this.props.children }
                        </ScrollView>
                        { renderFooter && renderFooter() }
                    </SafeAreaView>
                </View>
            </SlidingView>
        );
    }

    /**
     * Callback to handle a gesture end event.
     *
     * @param {Object} evt - The native gesture event.
     * @param {Object} gestureState - The gesture state.
     * @returns {void}
     */
    _onGestureEnd(evt, gestureState) {
        const verticalSwipe = Math.abs(gestureState.vy) > Math.abs(gestureState.vx)
            && Math.abs(gestureState.vy) > GESTURE_SPEED_THRESHOLD;

        if (verticalSwipe) {
            const direction = gestureState.vy > 0 ? 'down' : 'up';
            const { onCancel, onSwipe } = this.props;
            let isSwipeHandled = false;

            if (onSwipe) {
                isSwipeHandled = onSwipe(direction);
            }

            if (direction === 'down' && !isSwipeHandled) {
                // Swipe down is a special gesture that can be used to close the
                // BottomSheet, so if the swipe is not handled by the parent
                // component, we consider it as a request to close.
                onCancel && onCancel();
            }
        }
    }

    /**
     * Returns true if the pan responder should activate, false otherwise.
     *
     * @param {Object} evt - The native gesture event.
     * @param {Object} gestureState - The gesture state.
     * @returns {boolean}
     */
    _onShouldSetResponder({ nativeEvent }, gestureState) {
        return nativeEvent.touches.length === 1
            && Math.abs(gestureState.dx) > GESTURE_DISTANCE_THRESHOLD
            && Math.abs(gestureState.dy) > GESTURE_DISTANCE_THRESHOLD;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _styles: StyleType
 * }}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _height: state['features/base/responsive-ui'].clientHeight
    };
}

export default connect(_mapStateToProps)(BottomSheet);
