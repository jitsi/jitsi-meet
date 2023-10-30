import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle, View } from 'react-native';
import { connect, useDispatch } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconAddUser } from '../../../base/icons/svg';
import {
    addPeopleFeatureControl,
    getParticipantById,
    isScreenShareParticipant,
    setShareDialogVisiblity
} from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import {
    getBreakoutRooms,
    getCurrentRoomId
} from '../../../breakout-rooms/functions';
import { doInvitePeople } from '../../../invite/actions.native';
import { getInviteOthersControl } from '../../../share-room/functions';
import { getSortedParticipantIds, shouldRenderInviteButton } from '../../functions';

import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';


interface IProps {
    currentRoom?: {
        jid: string;
        name: string;
    };
    inviteOthersControl?: {
        color: string | undefined;
        shareDialogVisible: boolean | undefined;
    };
    isAddPeopleFeatureEnabled?: boolean | undefined;
    participantsCount?: number;
    searchString: string;
    setSearchString: (newValue: string) => void;
    showInviteButton?: boolean;
    sortedParticipantIds?: Array<string>;
    visitorsCount?: number | undefined;
}

const MeetingParticipantList = ({
    currentRoom,
    inviteOthersControl,
    isAddPeopleFeatureEnabled,
    participantsCount,
    showInviteButton,
    searchString,
    setSearchString,
    sortedParticipantIds = [],
    visitorsCount
}: IProps) => {
    const { t } = useTranslation();

    const dispatch = useDispatch();
    const onInvite = useCallback(() => {
        setShareDialogVisiblity(isAddPeopleFeatureEnabled, dispatch);
        dispatch(doInvitePeople());
    }, [ dispatch ]);
    const onSearchStringChange = useCallback((text: string) =>
        setSearchString(text), []);
    const title = currentRoom?.name
        ? `${currentRoom.name} (${participantsCount})`
        : t('participantsPane.headings.participantsList',
            { count: participantsCount });
    const { color, shareDialogVisible } = inviteOthersControl;
    const visitorsLabelText = visitorsCount > 0
        ? t('participantsPane.headings.visitors', { count: visitorsCount })
        : undefined;

    return (
        <View style = { styles.meetingListContainer }>
            {
                visitorsCount > 0
                && <Text style = { styles.visitorsLabel }>
                    { visitorsLabelText }
                </Text>
            }
            <Text
                style = { styles.meetingListDescription as TextStyle }>
                { title }
            </Text>
            {
                showInviteButton
                && <Button
                    accessibilityLabel = 'participantsPane.actions.invite'
                    disabled = { shareDialogVisible }

                    // eslint-disable-next-line react/jsx-no-bind, no-confusing-arrow
                    icon = { () => (
                        <Icon
                            color = { color }
                            size = { 20 }
                            src = { IconAddUser } />
                    ) }
                    labelKey = 'participantsPane.actions.invite'
                    onClick = { onInvite }
                    style = { styles.inviteButton }
                    type = { BUTTON_TYPES.PRIMARY } />
            }
            <Input
                clearable = { true }
                customStyles = {{
                    container: styles.inputContainer,
                    input: styles.centerInput }}
                onChange = { onSearchStringChange }
                placeholder = { t('participantsPane.search') }
                value = { searchString } />
            <>
                { sortedParticipantIds.map((id: string) => (
                    <MeetingParticipantItem
                        key = { id }
                        participantID = { id }
                        searchString = { searchString } />
                )) }
            </>
        </View>
    );
};

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);

    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        return !isScreenShareParticipant(participant);
    })

    const currentRoomId = getCurrentRoomId(state);
    const currentRoom = getBreakoutRooms(state)[currentRoomId];
    const inviteOthersControl = getInviteOthersControl(state);
    const isAddPeopleFeatureEnabled = addPeopleFeatureControl(state);
    const participantsCount = sortedParticipantIds.length;
    const showInviteButton = shouldRenderInviteButton(state);
    const visitorsCount = state['features/visitors'].count || 0;

    return {
        currentRoom,
        inviteOthersControl,
        isAddPeopleFeatureEnabled,
        participantsCount,
        showInviteButton,
        sortedParticipantIds,
        visitorsCount
    };
}

export default connect(_mapStateToProps)(MeetingParticipantList);
