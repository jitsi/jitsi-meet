// @flow

import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipant } from '../../av-moderation/actions';

import { useButtonStyles } from './styled';

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
    const buttonClasses = useButtonStyles();

    const askToUnmute = useCallback(() => {
        dispatch(approveParticipant(id));
    }, [ dispatch, id ]);

    return (
        <button
            className = { clsx(buttonClasses.button, buttonClasses.quickActionButton) }
            onClick = { askToUnmute }>
            {t('participantsPane.actions.askUnmute')}
        </button>
    );
}
