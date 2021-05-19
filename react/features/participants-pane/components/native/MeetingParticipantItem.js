// @flow

import React from 'react';

import ParticipantItem from './ParticipantItem';


type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantItem = ({ participant: p }: Props) => (
    <ParticipantItem
        participant = { p } />
);
