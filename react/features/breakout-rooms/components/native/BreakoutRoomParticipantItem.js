// @flow

import React from 'react';

import { isParticipantModerator } from '../../../base/participants';
import ParticipantItem from '../../../participants-pane/components/native/ParticipantItem';

type Props = {

    /**
     * Participant to be displayed.
     */
    item: Object
}

const BreakoutRoomParticipantItem = ({ item }: Props) => (
    <ParticipantItem
        displayName = { item.displayName }
        isKnockingParticipant = { false }
        isModerator = { isParticipantModerator(item) }
        key = { item.jid }
        participantID = { item.jid } />
);

export default BreakoutRoomParticipantItem;
