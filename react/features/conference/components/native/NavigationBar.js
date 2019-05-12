// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { getConferenceName } from '../../../base/conference';
import { connect } from '../../../base/redux';
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

        return [
            <LinearGradient
                colors = { NAVBAR_GRADIENT_COLORS }
                key = { 1 }
                pointerEvents = 'none'
                style = { styles.gradient }>
                <SafeAreaView>
                    <View style = { styles.gradientStretch } />
                </SafeAreaView>
            </LinearGradient>,
            <View
                key = { 2 }
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
        ];
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

export default connect(_mapStateToProps)(NavigationBar);
