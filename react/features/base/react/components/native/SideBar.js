// @flow

import React, { Component, type Node } from 'react';
import {
    Animated,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import styles, { SIDEBAR_WIDTH } from './styles';

/**
 * The type of the React {@code Component} props of {@link SideBar}.
 */
type Props = {

    /**
     * The children of the Component
     */
    children: Node,

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
     * The native animation object.
     */
    sliderAnimation: Object
}

/**
 * A generic animated side bar to be used for left side menus
 */
export default class SideBar extends Component<Props, State> {
    /**
     * Initializes a new {@code SideBar} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            showOverlay: false,
            sliderAnimation: new Animated.Value(0)
        };

        this._onHideMenu = this._onHideMenu.bind(this);
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._setShow(this.props.show);
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
            <View
                pointerEvents = 'box-none'
                style = { styles.sideMenuContainer } >
                {
                    this.state.showOverlay
                        && <TouchableWithoutFeedback
                            onPress = { this._onHideMenu } >
                            <View style = { styles.sideMenuShadow } />
                        </TouchableWithoutFeedback>
                }
                <Animated.View style = { this._getContentStyle() }>
                    { this.props.children }
                </Animated.View>
            </View>
        );
    }

    _getContentStyle: () => Array<Object>;

    /**
     * Assembles a style array for the sidebar content.
     *
     * @private
     * @returns {Array<Object>}
     */
    _getContentStyle() {
        const { sliderAnimation } = this.state;
        const transformStyle
            = { transform: [ { translateX: sliderAnimation } ] };

        return [ styles.sideMenuContent, transformStyle ];
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

        onHide && onHide();
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
        if (show) {
            this.setState({ showOverlay: true });
        }

        Animated
            .timing(
                this.state.sliderAnimation,
                {
                    toValue: show ? SIDEBAR_WIDTH : 0,
                    useNativeDriver: true
                })
            .start(animationState => {
                if (animationState.finished && !show) {
                    this.setState({ showOverlay: false });
                }
            });
    }
}
