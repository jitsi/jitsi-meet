import { filter, size } from 'lodash-es';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { getLocalParticipant, getRemoteParticipants } from '../../base/participants/functions';
import { toState } from '../../base/redux/functions';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { triggerRemoveAllRooms } from '../../breakout-room-autosetup/actions';
import { getBreakoutRooms, getRoomsInfo } from '../../breakout-rooms/functions';
import logger from '../../breakout-rooms/logger';
import { getSortedParticipantIds } from '../../participants-pane/functions';
import { getVisitorsList } from '../../visitors/functions';
import { triggerBreakoutRoom } from '../actions';
import { getAllParticipants, getPresetBreakoutRoomData } from '../functions';

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginTop: theme.spacing(3)
        }
    };
});

export const LoadPresetBreakoutRoomButton = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const presetBreakoutRoomData = useSelector((state: IReduxState) => getPresetBreakoutRoomData(state));
    const rooms = useSelector((state: IReduxState) => getBreakoutRooms(state));
    const visitorsList = useSelector((state: IReduxState) => getVisitorsList(state));
    const sortedParticipantIds = useSelector((state: IReduxState) => getSortedParticipantIds(state));
    const remoteParticipants = useSelector((state: IReduxState) => getRemoteParticipants(state));
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const { availableToSetup } = useSelector((state: IReduxState) => toState(state)['features/breakout-room-presetup']);
    const { rooms: roomsInfo } = useSelector((state: IReduxState) => getRoomsInfo(state));
    const allParticipants = useSelector((state: IReduxState) => getAllParticipants(state));

    const onBtnClick = useCallback(() => {
        if (Object.values(availableToSetup).some(value => !!value)) {
            return;
        }

        const subRooms = filter(rooms, room => !room.isMainRoom);

        logger.debug('[GTS] LoadPresetBreakoutRoomButton click', {
            presetBreakoutRoomData,
            rooms,
            roomsInfo,
            subRooms,
            visitorsList,
            sortedParticipantIds,
            remoteParticipants,
            localParticipant,
            allParticipants,
        });

        if (size(subRooms) > 0) {
            if (!confirm(t('presetBreakoutRooms.confirm.prompt'))) {
                return;
            }

            return dispatch(triggerRemoveAllRooms());
        }

        dispatch(triggerBreakoutRoom());
    }, [
        availableToSetup,
        rooms,
        presetBreakoutRoomData,
        roomsInfo,
        visitorsList,
        sortedParticipantIds,
        remoteParticipants,
        localParticipant,
        allParticipants,
    ]);

    return (
        <Button
            accessibilityLabel = { t('presetBreakoutRooms.actions.load') }
            className = { classes.button }
            fullWidth = { true }
            labelKey = 'presetBreakoutRooms.actions.load'
            onClick = { onBtnClick }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default LoadPresetBreakoutRoomButton;
