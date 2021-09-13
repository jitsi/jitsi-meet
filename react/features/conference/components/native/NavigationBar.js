// @flow

import React from 'react';
import { Text, View } from 'react-native';

import { getConferenceName } from '../../../base/conference';
import { getFeatureFlag, CONFERENCE_TIMER_ENABLED, MEETING_NAME_ENABLED } from '../../../base/flags';
import { connect } from '../../../base/redux';
import { PictureInPictureButton } from '../../../mobile/picture-in-picture';
import { isToolboxVisible } from '../../../toolbox/functions.native';
import ConferenceTimer from '../ConferenceTimer';

import Labels from './Labels';
import styles from './styles';


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
 *
 * @param {Props} props - The React props passed to this component.
 * @returns {React.Node}
 */
const NavigationBar = (props: Props) => {
    if (!props._visible) {
        return null;
    }

    return (
        <View
            pointerEvents = 'box-none'
            style = { styles.navBarWrapper }>
            <View style = { styles.pipButtonContainer }>
                <PictureInPictureButton
                    styles = { styles.pipButton } />
            </View>
            <View
                pointerEvents = 'box-none'
                style = { styles.roomNameWrapper }>
                {
                    props._meetingNameEnabled
                        && <View style = { styles.roomNameView }>
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.roomName }>
                                { props._meetingName }
                            </Text>
                        </View>
                }
                {
                    props._conferenceTimerEnabled
                            && <View style = { styles.roomTimerView }>
                                <ConferenceTimer textStyle = { styles.roomTimer } />
                            </View>
                }
                <Labels />
            </View>
        </View>
    );
};

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
