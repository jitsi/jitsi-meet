// @flow

import React, { PureComponent } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { getFeatureFlag, INVITE_ENABLED } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { Icon, IconAddPeople } from '../../../base/icons';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { doInvitePeople } from '../../../invite/actions.native';

import styles from './styles';

/**
 * Props type of the component.
 */
type Props = {

    /**
     * True if the invite functions (dial out, invite, share...etc) are disabled.
     */
    _isInviteFunctionsDiabled: boolean,

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
        const { _isInviteFunctionsDiabled, _isLonelyMeeting, _styles, t } = this.props;

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
                { !_isInviteFunctionsDiabled && (
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
                ) }
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
        this.props.dispatch(doInvitePeople());
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
    const { disableInviteFunctions } = state['features/base/config'];
    const flag = getFeatureFlag(state, INVITE_ENABLED, true);

    return {
        _isInviteFunctionsDiabled: !flag || disableInviteFunctions,
        _isLonelyMeeting: getParticipantCount(state) === 1,
        _styles: ColorSchemeRegistry.get(state, 'Conference')
    };
}

export default connect(_mapStateToProps)(translate(LonelyMeetingExperience));
