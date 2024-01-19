import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { INVITE_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconAddUser } from '../../../base/icons/svg';
import {
    addPeopleFeatureControl,
    getParticipantCountWithFake,
    setShareDialogVisiblity
} from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { doInvitePeople } from '../../../invite/actions.native';
import { getInviteOthersControl } from '../../../share-room/functions';

import styles from './styles';


/**
 * Props type of the component.
 */
interface IProps extends WithTranslation {

    /**
     * Control for invite other button.
     */
    _inviteOthersControl: any;

    /**
     * Checks if add-people feature is enabled.
     */
    _isAddPeopleFeatureEnabled: boolean;

    /**
     * True if currently in a breakout room.
     */
    _isInBreakoutRoom: boolean;

    /**
     * True if the invite functions (dial out, invite, share...etc) are disabled.
     */
    _isInviteFunctionsDisabled: boolean;

    /**
     * True if it's a lonely meeting (participant count excluding fakes is 1).
     */
    _isLonelyMeeting: boolean;

    /**
     * The Redux Dispatch function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Implements the UI elements to be displayed in the lonely meeting experience.
 */
class LonelyMeetingExperience extends PureComponent<IProps> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _inviteOthersControl,
            _isInBreakoutRoom,
            _isInviteFunctionsDisabled,
            _isLonelyMeeting,
            t
        } = this.props;
        const { color, shareDialogVisible } = _inviteOthersControl;

        if (!_isLonelyMeeting) {
            return null;
        }

        return (
            <View style = { styles.lonelyMeetingContainer as ViewStyle }>
                <Text style = { styles.lonelyMessage }>
                    { t('lonelyMeetingExperience.youAreAlone') }
                </Text>
                { !_isInviteFunctionsDisabled && !_isInBreakoutRoom && (
                    <Button
                        accessibilityLabel = 'lonelyMeetingExperience.button'
                        disabled = { shareDialogVisible }
                        // eslint-disable-next-line react/jsx-no-bind
                        icon = { () => (
                            <Icon
                                color = { color }
                                size = { 20 }
                                src = { IconAddUser } />
                        ) }
                        labelKey = 'lonelyMeetingExperience.button'
                        onClick = { this._onPress }
                        type = { BUTTON_TYPES.PRIMARY } />
                ) }
            </View>
        );
    }

    /**
     * Callback for the onPress function of the button.
     *
     * @returns {void}
     */
    _onPress() {
        const { _isAddPeopleFeatureEnabled, dispatch } = this.props;

        setShareDialogVisiblity(_isAddPeopleFeatureEnabled, dispatch);

        dispatch(doInvitePeople());
    }
}

/**
 * Maps parts of the Redux state to the props of this Component.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { disableInviteFunctions } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const _inviteOthersControl = getInviteOthersControl(state);
    const flag = getFeatureFlag(state, INVITE_ENABLED, true);
    const _isAddPeopleFeatureEnabled = addPeopleFeatureControl(state);
    const _isInBreakoutRoom = isInBreakoutRoom(state);

    return {
        _isAddPeopleFeatureEnabled,
        _inviteOthersControl,
        _isInBreakoutRoom,
        _isInviteFunctionsDisabled: Boolean(!flag || disableInviteFunctions),
        _isLonelyMeeting: Boolean(conference && getParticipantCountWithFake(state) === 1)
    };
}

export default connect(_mapStateToProps)(translate(LonelyMeetingExperience));
