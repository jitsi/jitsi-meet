import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TextStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openSheet } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import { IconAddUser } from '../../../base/icons/svg';
import {
    addPeopleFeatureControl,
    getLocalParticipant,
    getParticipantCountWithFake,
    getRemoteParticipants,
    setShareDialogVisiblity
} from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import BreakoutRoomContextMenu
    from '../../../breakout-rooms/components/native/BreakoutRoomContextMenu';
import {
    getBreakoutRooms,
    getCurrentRoomId
} from '../../../breakout-rooms/functions';
import { doInvitePeople } from '../../../invite/actions.native';
import { getInviteOthersControl } from '../../../share-room/functions';
import {
    isCurrentRoomRenamable,
    participantMatchesSearch,
    shouldRenderInviteButton
} from '../../functions';
import { BREAKOUT_CONTEXT_MENU_ACTIONS } from '../../types';

import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';


const MeetingParticipantList = () => {
    const _isCurrentRoomRenamable = useSelector(isCurrentRoomRenamable);
    const currentRoomId = useSelector(getCurrentRoomId);
    const currentRoom = useSelector(getBreakoutRooms)[currentRoomId];
    const dispatch = useDispatch();
    const inviteOthersControl = useSelector(getInviteOthersControl);
    const isAddPeopleFeatureEnabled = useSelector(addPeopleFeatureControl);
    const keyExtractor
        = useCallback((e: undefined, i: number) => i.toString(), []);
    const localParticipant = useSelector(getLocalParticipant);
    const onInvite = useCallback(() => {
        setShareDialogVisiblity(isAddPeopleFeatureEnabled, dispatch);
        dispatch(doInvitePeople());
    }, [ dispatch ]);
    const openContextMenu = useCallback(() =>
        dispatch(openSheet(BreakoutRoomContextMenu, {
            room: currentRoom,
            actions: [ BREAKOUT_CONTEXT_MENU_ACTIONS.RENAME ]
        })), [ dispatch ]);
    const onLongPress = _isCurrentRoomRenamable ? openContextMenu : undefined;
    const [ searchString, setSearchString ] = useState('');
    const onSearchStringChange = useCallback((text: string) =>
        setSearchString(text), []);
    const participantsCount = useSelector(getParticipantCountWithFake);
    const remoteParticipants = useSelector(getRemoteParticipants);
    const renderParticipant = ({ item/* , index, separators */ }: any) => {
        const participant = item === localParticipant?.id
            ? localParticipant : remoteParticipants.get(item);

        if (participantMatchesSearch(participant, searchString)) {
            return (
                <MeetingParticipantItem
                    key = { item }
                    participant = { participant } />
            );
        }

        return null;
    };
    const showInviteButton = useSelector(shouldRenderInviteButton);
    const sortedRemoteParticipants = useSelector(
        (state: IReduxState) => state['features/filmstrip'].remoteParticipants);
    const { t } = useTranslation();
    const title = currentRoom?.name
        ? `${currentRoom.name} (${participantsCount})`
        : t('participantsPane.headings.participantsList',
            { count: participantsCount });
    const { color, shareDialogVisible } = inviteOthersControl;
    const visitorsCount = useSelector((state: IReduxState) => state['features/visitors'].count || 0);
    const visitorsLabelText = visitorsCount > 0
        ? t('participantsPane.headings.visitors', { count: visitorsCount })
        : undefined;

    return (
        <>
            {
                visitorsCount > 0
                && <Text style = { styles.visitorsLabel }>
                    { visitorsLabelText }
                </Text>
            }
            <Text style = { styles.meetingListDescription as TextStyle }>
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
            <FlatList
                data = { [ localParticipant?.id, ...sortedRemoteParticipants ] as Array<any> }
                keyExtractor = { keyExtractor }

                /* eslint-disable react/jsx-no-bind */
                renderItem = { renderParticipant }
                windowSize = { 2 } />
        </>
    );
};

export default MeetingParticipantList;
