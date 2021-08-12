// @flow

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../av-moderation/actions';

import { QuickActionButton } from './web/styled';

type Props = {

    /**
     * The translated ask unmute text.
     */
    askUnmuteText: string,

    /**
     * Participant participantID.
     */
    participantID: string,

    /**
     * Whether or not the local participant's hand is raised.
     */
    raisedHand?: boolean
}

/**
 * Component used to display the `ask to unmute` button.
 *
 * @param {Object} participant - Participant reference.
 * @returns {React$Element<'button'>}
 */
export default function AskToUnmuteButton({ askUnmuteText, participantID, raisedHand }: Props) {
    const dispatch = useDispatch();
    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(participantID));
    }, [ dispatch, participantID ]);

    return (
        <QuickActionButton
            aria-label = { raisedHand ? askUnmuteText : `unmute-${participantID}` }
            onClick = { askToUnmute }
            primary = { true }
            theme = {{
                panePadding: 16
            }}>
            { askUnmuteText }
        </QuickActionButton>
    );
}
