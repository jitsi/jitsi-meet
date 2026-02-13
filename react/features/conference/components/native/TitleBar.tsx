import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import Icon from '../../../base/icons/components/Icon';
import { IconE2EE } from '../../../base/icons/svg';

import { IReduxState } from '../../../app/types';
import { getConferenceName } from '../../../base/conference/functions';
import {
    TOGGLE_CAMERA_BUTTON_ENABLED
} from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import PictureInPictureButton from '../../../mobile/picture-in-picture/components/PictureInPictureButton';
import ParticipantsPaneButton from '../../../participants-pane/components/native/ParticipantsPaneButton';
import { isParticipantsPaneEnabled } from '../../../participants-pane/functions';
import { isToolboxVisible } from '../../../toolbox/functions.native';

import styles from './styles';


interface IProps {

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     */
    _createOnPress: Function;

    /**
     * Whether participants feature is enabled or not.
     */
    _isParticipantsPaneEnabled: boolean;

    /**
     * Name of the meeting we're currently in.
     */
    _meetingName: string;

    /**
     * True if the navigation bar should be visible.
     */
    _visible: boolean;
}

/**
 * Implements a navigation bar component that is rendered on top of the
 * conference screen. Styled to match WhatsApp call UI.
 *
 * Layout: [Back Button] — [🔒 End-to-End Encrypted] — [Participants Button]
 *
 * @param {IProps} props - The React props passed to this component.
 * @returns {JSX.Element}
 */
const TitleBar = (props: IProps) => {
    const { _isParticipantsPaneEnabled, _visible } = props;

    if (!_visible) {
        return null;
    }

    return (
        <View
            style={styles.titleBarWrapper as ViewStyle}>

            {/* Left: Back / PiP button */}
            <View style={styles.titleBarLeftSection as ViewStyle}>
                <PictureInPictureButton styles={styles.pipButton} />
            </View>

            {/* Center: E2EE label — always visible, WhatsApp style */}
            <View style={styles.titleBarCenterSection as ViewStyle}>
                <Icon
                    color={'#FFFFFF'}
                    size={14}
                    src={IconE2EE} />
                <Text style={styles.e2eeLabelText as ViewStyle}>
                    End-to-End Encrypted
                </Text>
            </View>

            {/* Right: Participants/Invite button */}
            <View style={styles.titleBarRightSection as ViewStyle}>
                {
                    _isParticipantsPaneEnabled
                    && <ParticipantsPaneButton
                        styles={styles.titleBarButton} />
                }
            </View>
        </View>
    );
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _isParticipantsPaneEnabled: isParticipantsPaneEnabled(state),
        _meetingName: getConferenceName(state),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(TitleBar);

