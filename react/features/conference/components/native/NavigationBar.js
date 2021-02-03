// @flow

import React, { Component } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { getConferenceName } from '../../../base/conference';
import { getFeatureFlag, CONFERENCE_TIMER_ENABLED, MEETING_NAME_ENABLED } from '../../../base/flags';
import { connect } from '../../../base/redux';
import { PictureInPictureButton } from '../../../mobile/picture-in-picture';
import { isToolboxVisible } from '../../../toolbox/functions.native';
import ConferenceTimer from '../ConferenceTimer';

import styles, { NAVBAR_GRADIENT_COLORS } from './styles';

type Props = {

    /**
     * Whether displaying the current conference timer is enabled or not.
     */
    _conferenceTimerEnabled: boolean,

    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string,

    /**
     * Whether displaying the current meeting name is enabled or not.
     */
    _meetingNameEnabled: boolean,

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
                    <View style = { styles.gradientStretchTop } />
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
                    {
                        this.props._meetingNameEnabled
                        && <Text
                            numberOfLines = { 1 }
                            style = { styles.roomName }>
                            { this.props._meetingName }
                        </Text>
                    }
                    {
                        this.props._conferenceTimerEnabled && <ConferenceTimer />
                    }
                </View>
            </View>
        ];
    }

}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { hideConferenceTimer, hideConferenceSubject } = state['features/base/config'];

    return {
        _conferenceTimerEnabled:
            getFeatureFlag(state, CONFERENCE_TIMER_ENABLED, true) && !hideConferenceTimer,
        _meetingName: getConferenceName(state),
        _meetingNameEnabled:
            getFeatureFlag(state, MEETING_NAME_ENABLED, true) && !hideConferenceSubject,
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(NavigationBar);
