// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';

import { getConferenceName } from '../../../base/conference';
import { PictureInPictureButton } from '../../../mobile/picture-in-picture';
import { isToolboxVisible } from '../../../toolbox';

import styles, { NAVBAR_GRADIENT_COLORS } from './styles';

type Props = {

    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string,

    /**
     * True if the navigation bar should be visible.
     */
    _visible: boolean
};

/**
 * Implements a navigation bar component that is rendered on top of the
 * conference screen.
 */
class NavigationBar extends Component<Props> {
    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.navBarContainer }>
                <LinearGradient
                    colors = { NAVBAR_GRADIENT_COLORS }
                    pointerEvents = 'none'
                    style = { styles.gradient }>
                    <SafeAreaView>
                        <View style = { styles.gradientStretch } />
                    </SafeAreaView>
                </LinearGradient>
                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = { styles.navBarSafeView }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.navBarWrapper }>
                        <PictureInPictureButton
                            styles = { styles.navBarButton } />
                        <View
                            pointerEvents = 'box-none'
                            style = { styles.roomNameWrapper }>
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.roomName }>
                                { this.props._meetingName }
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _meetingName: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _meetingName: _.startCase(getConferenceName(state)),
        _visible: isToolboxVisible(state)
    };
}

// $FlowExpectedError
export default connect(_mapStateToProps)(NavigationBar);
