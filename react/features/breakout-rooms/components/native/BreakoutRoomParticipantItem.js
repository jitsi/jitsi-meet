// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import { isParticipantModerator } from '../../../base/participants';
import ParticipantItem from '../../../participants-pane/components/native/ParticipantItem';

type Props = {

    /**
     * Participant to be displayed.
     */
    item: Object
};

const BreakoutRoomParticipantItem = ({ item }: Props) => {
    const { defaultRemoteDisplayName } = useSelector(state => state['features/base/config']);

    return (
        <ParticipantItem
            displayName = { item.displayName || defaultRemoteDisplayName }
            isKnockingParticipant = { false }
            isModerator = { isParticipantModerator(item) }
            key = { item.jid }
            participantID = { item.jid } />
    );
};

export default BreakoutRoomParticipantItem;
