import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { equals } from '../../../base/redux/functions';
import Input from '../../../base/ui/components/native/Input';
import {
    getBreakoutRooms,
    getCurrentRoomId,
    isAddBreakoutRoomButtonVisible,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../functions';

import AddBreakoutRoomButton from './AddBreakoutRoomButton';
import AutoAssignButton from './AutoAssignButton';
import { CollapsibleRoom } from './CollapsibleRoom';
import LeaveBreakoutRoomButton from './LeaveBreakoutRoomButton';
import styles from './styles';


const BreakoutRooms = () => {
    const currentRoomId = useSelector(getCurrentRoomId);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isBreakoutRoomsSupported = useSelector((state: IReduxState) =>
        state['features/base/conference'].conference?.getBreakoutRooms()?.isSupported());
    const keyExtractor = useCallback((e: undefined, i: number) => i.toString(), []);
    const [ searchString, setSearchString ] = useState('');
    const onSearchStringChange = useCallback((text: string) =>
        setSearchString(text), []);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
        .filter(room => room.id !== currentRoomId)
        .sort((p1, p2) => (p1?.name || '').localeCompare(p2?.name || ''));
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const { t } = useTranslation();

    return (
        <JitsiScreen
            safeAreaInsets = { [ 'bottom' ] }
            style = { styles.breakoutRoomsContainer }>
            <Input
                clearable = { true }
                customStyles = {{
                    container: styles.inputContainer,
                    input: styles.centerInput }}
                onChange = { onSearchStringChange }
                placeholder = { t('participantsPane.search') }
                value = { searchString } />

            { /* Fixes warning regarding nested lists */ }
            <FlatList

                /* eslint-disable react/jsx-no-bind */
                ListHeaderComponent = { () => (
                    <>
                        { showAutoAssign && <AutoAssignButton /> }
                        { inBreakoutRoom && <LeaveBreakoutRoomButton /> }
                        {
                            isBreakoutRoomsSupported
                            && rooms.map(room => (<CollapsibleRoom
                                key = { room.id }
                                room = { room }
                                roomId = { room.id }
                                searchString = { searchString } />))
                        }
                        { showAddBreakoutRoom && <AddBreakoutRoomButton /> }
                    </>
                ) }
                data = { [] as ReadonlyArray<undefined> }
                keyExtractor = { keyExtractor }
                renderItem = { null } />
        </JitsiScreen>
    );
};

export default BreakoutRooms;
