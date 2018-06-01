// @flow

import React, { Component, type Node } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';

import styles, { SIDEBAR_WIDTH } from './styles';

/**
 * The type of the React {@code Component} props of {@link SideBar}.
 */
type Props = {

    /**
     * The children of {@code SideBar}.
     */
    children: Node,

    /**
     * Callback to notify the containing {@code Component} that the sidebar is
     * closing.
     */
    onHide: Function,

    /**
     * Whether the menu (of the {@code SideBar}?) is displayed/rendered/shown.
     */
    show: boolean
};

/**
 * The type of the React {@code Component} state of {@link SideBar}.
 */
type State = {

    /**
     * Whether the side overlay should be displayed/rendered/shown.
     */
    showOverlay: boolean,

    /**
     * The native animation object.
     */
    sliderAnimation: Animated.Value
};

/**
 * A generic animated side bar to be used for left-side, hamburger-style menus.
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

        // Bind event handlers so they are only bound once per instance.
        this._onHideMenu = this._onHideMenu.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._setShow(this.props.show);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps({ show }: Props) {
        (show === this.props.show) || this._setShow(show);
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
        return [
            styles.sideMenuContent,
            { transform: [ { translateX: this.state.sliderAnimation } ] }
        ];
    }

    _onHideMenu: () => void;

    /**
     * Hides the side menu.
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
     * Shows/hides the side menu.
     *
     * @param {boolean} show - If the side menu is to be made visible,
     * {@code true}; otherwise, {@code false}.
     * @private
     * @returns {void}
     */
    _setShow(show) {
        show && this.setState({ showOverlay: true });

        Animated
            .timing(
                /* value */ this.state.sliderAnimation,
                /* config */ {
                    toValue: show ? SIDEBAR_WIDTH : 0,
                    useNativeDriver: true
                })
            .start(({ finished }) => {
                finished && !show && this.setState({ showOverlay: false });

                // XXX Technically, the arrow function can further be simplified
                // by removing the {} and returning the boolean expression
                // above. Practically and unfortunately though, Flow freaks out
                // and states that Animated.timing doesn't exist!?
            });
    }
}
