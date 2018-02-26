// @flow

import React, { Component } from 'react';
import {
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import styles, { SIDEBAR_WIDTH } from './styles';

/**
 * The type of the React {@code Component} props of {@link SideBar}.
 */
type Props = {

    /**
     * The local participant's avatar
     */
    _avatar: string,

    /**
     * The children of the Component
     */
    children: React$Node,

    /**
     * Callback to notify the containing Component that the sidebar is
     * closing.
     */
    onHide: Function,

    /**
     * Sets the menu displayed or hidden.
     */
    show: boolean
}

/**
 * The type of the React {@code Component} state of {@link SideBar}.
 */
type State = {

    /**
     * Indicates whether the side overlay should be rendered or not.
     */
    showOverlay: boolean,

    /**
     * Indicates whether the side bar is visible or not.
     */
    showSideBar: boolean,

    /**
     * The native animation object.
     */
    sliderAnimation: Object
}

/**
 * A generic animated side bar to be used for left side menus
 */
export default class SideBar extends Component<Props, State> {
    _mounted: boolean;

    /**
     * Initializes a new {@code SideBar} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            showOverlay: false,
            showSideBar: false,
            sliderAnimation: new Animated.Value(-SIDEBAR_WIDTH)
        };

        this._getContainerStyle = this._getContainerStyle.bind(this);
        this._onHideMenu = this._onHideMenu.bind(this);
        this._setShow = this._setShow.bind(this);

        this._setShow(props.show);
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._mounted = true;
    }

    /**
     * Implements the Component's componentWillReceiveProps method.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(newProps: Props) {
        if (newProps.show !== this.props.show) {
            this._setShow(newProps.show);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Animated.View
                style = { this._getContainerStyle() } >
                <View style = { styles.sideMenuContent }>
                    {
                        this.props.children
                    }
                </View>
                <TouchableWithoutFeedback
                    onPress = { this._onHideMenu }
                    style = { styles.sideMenuShadowTouchable } >
                    <View style = { styles.sideMenuShadow } />
                </TouchableWithoutFeedback>
            </Animated.View>
        );
    }

    _getContainerStyle: () => Array<Object>

    /**
     * Assembles a style array for the container.
     *
     * @private
     * @returns {Array<Object>}
     */
    _getContainerStyle() {
        const { sliderAnimation } = this.state;
        const { height, width } = Dimensions.get('window');

        return [
            styles.sideMenuContainer,
            {
                left: sliderAnimation,
                width: this.state.showOverlay
                    ? Math.max(height, width) + SIDEBAR_WIDTH : SIDEBAR_WIDTH
            }
        ];
    }

    _onHideMenu: () => void;

    /**
     * Hides the menu.
     *
     * @private
     * @returns {void}
     */
    _onHideMenu() {
        this._setShow(false);

        const { onHide } = this.props;

        if (typeof onHide === 'function') {
            onHide();
        }
    }

    _setShow: (boolean) => void;

    /**
     * Sets the side menu visible or hidden.
     *
     * @param {boolean} show - The new expected visibility value.
     * @private
     * @returns {void}
     */
    _setShow(show) {
        if (this.state.showSideBar !== show) {
            if (show) {
                this.setState({
                    showOverlay: true
                });
            }

            Animated
                .timing(
                    this.state.sliderAnimation,
                    { toValue: show ? 0 : -SIDEBAR_WIDTH })
                .start(animationState => {
                    if (animationState.finished && !show) {
                        this.setState({
                            showOverlay: false
                        });
                    }
                });
        }

        if (this._mounted) {
            this.setState({
                showSideBar: show
            });
        }
    }
}
