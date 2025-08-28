import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isLocalParticipantModerator, isParticipantModerator } from '../../../base/participants/functions';
import { showRoomParticipantMenu } from '../../../participants-pane/actions.native';
import ParticipantItem from '../../../participants-pane/components/native/ParticipantItem';
import { IRoom } from '../../types';

interface IProps {

    /**
     * Participant to be displayed.
     */
    item: any;

    /**
     * The room the participant is in.
     */
    room: IRoom;
}

const BreakoutRoomParticipantItem = ({ item, room }: IProps) => {
    const { defaultRemoteDisplayName = '' } = useSelector((state: IReduxState) => state['features/base/config']);
    const moderator = useSelector(isLocalParticipantModerator);
    const dispatch = useDispatch();
    const onPress = useCallback(() => {
        if (moderator) {
            dispatch(showRoomParticipantMenu(room, item.jid, item.displayName));
        }
    }, [ moderator, room, item ]);

    return (
        <ParticipantItem
            displayName = { item.displayName || defaultRemoteDisplayName }
            isModerator = { isParticipantModerator(item) }
            key = { item.jid }
            onPress = { onPress }
            participantID = { item.jid } />
    );
};

export default BreakoutRoomParticipantItem;
