import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TextStyle, View } from 'react-native';
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
import { iAmVisitor } from '../../../visitors/functions';
import { getSortedParticipantIds, shouldRenderInviteButton } from '../../functions';

import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';

interface IProps {
    currentRoom?: {
        jid: string;
        name: string;
    };
    iconColor: string;
    isAddPeopleFeatureEnabled?: boolean | undefined;
    isShareDialogVisible: boolean;
    participantsCount?: number;
    showInviteButton?: boolean;
    sortedParticipantIds?: Array<string>;
    visitorsCount?: number | undefined;
}


const MeetingParticipantList = ({
    currentRoom,
    iconColor,
    isAddPeopleFeatureEnabled,
    isShareDialogVisible,
    participantsCount,
    showInviteButton,
    sortedParticipantIds = [],
    visitorsCount
}: IProps): any => {
    const { t } = useTranslation();

    const [ searchString, setSearchString ] = useState('');

    const dispatch = useDispatch();

    const keyExtractor = useCallback((e: undefined, i: number) => i.toString(), []);
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
    const visitorsLabelText = visitorsCount && visitorsCount > 0
        ? t('participantsPane.headings.visitors', { count: visitorsCount })
        : undefined;

    const renderParticipant = ({ item }: any) => (
        <MeetingParticipantItem
            key = { item }
            participantID = { item }
            searchString = { searchString } />
    );

    return (
        <View style = { styles.meetingListContainer }>
            <Text style = { styles.visitorsLabel as TextStyle }>
                { visitorsLabelText }
            </Text>
            <Text
                style = { styles.meetingListDescription as TextStyle }>
                { title }
            </Text>
            {
                showInviteButton
                && <Button
                    accessibilityLabel = 'participantsPane.actions.invite'
                    disabled = { isShareDialogVisible }

                    // eslint-disable-next-line react/jsx-no-bind, no-confusing-arrow
                    icon = { () => (
                        <Icon
                            color = { iconColor }
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
            <FlatList
                data = { sortedParticipantIds as Array<any> }
                keyExtractor = { keyExtractor }

                /* eslint-disable react/jsx-no-bind */
                renderItem = { renderParticipant }
                windowSize = { 2 } />
        </View>
    );
};

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);

    const _iAmVisitor = iAmVisitor(state);

    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        if (_iAmVisitor && participant?.local) {
            return false;
        }

        return !isScreenShareParticipant(participant);
    });

    const currentRoomId = getCurrentRoomId(state);
    const currentRoom = getBreakoutRooms(state)[currentRoomId];
    const inviteOthersControl = getInviteOthersControl(state);
    const { color, shareDialogVisible } = inviteOthersControl;
    const isAddPeopleFeatureEnabled = addPeopleFeatureControl(state);
    const participantsCount = sortedParticipantIds.length;
    const showInviteButton = shouldRenderInviteButton(state);
    const visitorsCount = state['features/visitors']?.count || 0;

    return {
        currentRoom,
        iconColor: color,
        inviteOthersControl,
        isAddPeopleFeatureEnabled,
        isShareDialogVisible: shareDialogVisible,
        participantsCount,
        showInviteButton,
        sortedParticipantIds,
        visitorsCount
    };
}

export default connect(_mapStateToProps)(MeetingParticipantList);
