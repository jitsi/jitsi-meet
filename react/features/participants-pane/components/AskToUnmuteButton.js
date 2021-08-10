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
     * Participant id.
     */
    id: string
}

/**
 * Component used to display the `ask to unmute` button.
 *
 * @param {Object} participant - Participant reference.
 * @returns {React$Element<'button'>}
 */
export default function AskToUnmuteButton({ id, askUnmuteText }: Props) {
    const dispatch = useDispatch();
    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(id));
    }, [ dispatch, id ]);

    return (
        <QuickActionButton
            onClick = { askToUnmute }
            primary = { true }
            theme = {{
                panePadding: 16
            }}>
            { askUnmuteText }
        </QuickActionButton>
    );
}
