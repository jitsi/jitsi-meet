// @flow

import React, { Component } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';

import styles, { STATUSBAR_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@link ScreenHeader}
 */
type Props = {

    /**
     * Children component(s).
     */
    children: React$Node,

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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View
                style = { styles.headerOverlay } >
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

}
