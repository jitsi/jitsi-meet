// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../av-moderation/actions';

import { QuickActionButton } from './styled';

type Props = {

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
export default function({ id }: Props) {
    const dispatch = useDispatch();
    const { t } = useTranslation();

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
            {t('participantsPane.actions.askUnmute')}
        </QuickActionButton>
    );
}
