import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import {
    getBreakoutRooms,
} from '../../../../../breakout-rooms/functions';

import Button from '../../../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants.web';
import {closeBreakoutRoom, removeBreakoutRoom } from '../../../../../breakout-rooms/actions';

export const CloseAllRoomsButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const removeAllRoom = (firstTime:boolean) => {
        const rooms = getBreakoutRooms(APP.store);
        const roomArr = Object.entries(rooms).filter((room)=>!room[1].isMainRoom);
        
        const rooms2Close = roomArr.filter((room)=>Object.keys(room[1].participants).length > 0);
        const n2Close = rooms2Close.length;
        if (n2Close === 0) {
          roomArr.forEach((room)=>dispatch(removeBreakoutRoom(room[1].jid)));
        }
        else {
          if (firstTime) {
            rooms2Close.forEach((room)=>dispatch(closeBreakoutRoom(room[1].id)));
          }
          setTimeout(()=>removeAllRoom(false), 100);
        }
    }

    const onCloseAll = useCallback(() => {
        removeAllRoom(true);
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.closeAll') }
            fullWidth = { true }
            labelKey = { 'breakoutRooms.actions.closeAll' }
            onClick = { onCloseAll }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};
