// @flow

import React, { PureComponent } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { getFeatureFlag, INVITE_ENABLED } from '../../../base/flags';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { translate } from '../../../base/i18n';
import { getParticipantCount } from '../../../base/participants';
import { isAddPeopleEnabled, isDialOutEnabled, setAddPeopleDialogVisible } from '../../../invite';
import { beginShareRoom } from '../../../share-room';

import styles from './styles';
import { Icon, IconAddPeople } from '../../../base/icons';

/**
 * Props type of the component.
 */
type Props = {

    /**
     * True if any of the invite functions are enabled.
     */
    _inviteEnabled: boolean,

    /**
     * True if it's a lonely meeting (participant count excluding fakes is 1).
     */
    _isLonelyMeeting: boolean,

    /**
     * Color schemed styles of the component.
     */
    _styles: StyleType,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements the UI elements to be displayed in the lonely meeting experience.
 */
class LonelyMeetingExperience extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _isLonelyMeeting, _styles, t } = this.props;

        if (!_isLonelyMeeting) {
            return null;
        }

        return (
            <View style = { styles.lonelyMeetingContainer }>
                <Text
                    style = { [
                        styles.lonelyMessage,
                        _styles.lonelyMessage
                    ] }>
                    { t('lonelyMeetingExperience.youAreAlone') }
                </Text>
                <TouchableOpacity
                    onPress = { this._onPress }
                    style = { [
                        styles.lonelyButton,
                        _styles.lonelyButton
                    ] }>
                    <Icon
                        size = { 24 }
                        src = { IconAddPeople }
                        style = { styles.lonelyButtonComponents } />
                    <Text
                        style = { [
                            styles.lonelyButtonComponents,
                            _styles.lonelyMessage
                        ] }>
                        { t('lonelyMeetingExperience.button') }
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    _onPress: () => void;

    /**
     * Callback for the onPress function of the button.
     *
     * @returns {void}
     */
    _onPress() {
        const { _inviteEnabled, dispatch } = this.props;

        if (_inviteEnabled) {
            dispatch(setAddPeopleDialogVisible(true));
        } else {
            dispatch(beginShareRoom());
        }
    }
}

/**
 * Maps parts of the Redux state to the props of this Component.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): $Shape<Props> {
    const _inviteEnabled = getFeatureFlag(state, INVITE_ENABLED, true)
        && (isAddPeopleEnabled(state) || isDialOutEnabled(state));

    return {
        _inviteEnabled,
        _isLonelyMeeting: getParticipantCount(state) === 1,
        _styles: ColorSchemeRegistry.get(state, 'Conference')
    };
}

export default connect(_mapStateToProps)(translate(LonelyMeetingExperience));
