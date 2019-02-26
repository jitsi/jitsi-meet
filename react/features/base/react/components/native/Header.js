// @flow

import React, { Component, type Node } from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';

import styles, { HEADER_PADDING, STATUSBAR_COLOR } from './styles';

/**
 * Compatibility header padding size for iOS 10 (and older) devices.
 */
const IOS10_PADDING = 20;

/**
 * The type of the React {@code Component} props of {@link Header}
 */
type Props = {

    /**
     * Children component(s).
     */
    children: Node,

    /**
     * The component's external style
     */
    style: Object
}

/**
 * A generic screen header component.
 */
export default class Header extends Component<Props> {

    /**
     * The style of button-like React {@code Component}s rendered in
     * {@code Header}.
     *
     * @returns {Object}
     */
    static get buttonStyle(): Object {
        return styles.headerButtonIcon;
    }

    /**
     * The style of a React {@code Component} rendering a {@code Header} as its
     * child.
     *
     * @returns {Object}
     */
    static get pageStyle(): Object {
        return styles.page;
    }

    /**
     * The style of text rendered in {@code Header}.
     *
     * @returns {Object}
     */
    static get textStyle(): Object {
        return styles.headerText;
    }

    /**
     * Initializes a new {@code Header} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._getIOS10CompatiblePadding
            = this._getIOS10CompatiblePadding.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View
                style = { [
                    styles.headerOverlay,
                    this._getIOS10CompatiblePadding()
                ] } >
                <StatusBar
                    backgroundColor = { STATUSBAR_COLOR }
                    barStyle = 'light-content'
                    translucent = { false } />
                <SafeAreaView>
                    <View
                        style = { [
                            styles.screenHeader,
                            this.props.style
                        ] }>
                        {
                            this.props.children
                        }
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    _getIOS10CompatiblePadding: () => Object;

    /**
     * Adds a padding for iOS 10 (and older) devices to avoid clipping with the
     * status bar.
     * Note: This is a workaround for iOS 10 (and older) devices only to fix
     * usability, but it doesn't take orientation into account, so unnecessary
     * padding is rendered in some cases.
     *
     * @private
     * @returns {Object}
     */
    _getIOS10CompatiblePadding() {
        if (Platform.OS === 'ios') {
            const majorVersionIOS = parseInt(Platform.Version, 10);

            if (majorVersionIOS <= 10) {
                return {
                    paddingTop: HEADER_PADDING + IOS10_PADDING
                };
            }
        }

        return null;
    }
}
