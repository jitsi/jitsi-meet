// @flow

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isLocalParticipantModerator, isParticipantModerator } from '../../../../../base/participants';
import { showRoomParticipantMenu } from '../../../../actions.native';
import ParticipantItem from '../../../native/ParticipantItem';

type Props = {

    /**
     * Participant to be displayed.
     */
    item: Object,

    /**
     * The room the participant is in.
     */
    room: Object
};

const BreakoutRoomParticipantItem = ({ item, room }: Props) => {
    const { defaultRemoteDisplayName } = useSelector(state => state['features/base/config']);
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
