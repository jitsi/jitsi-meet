// @flow

import React, { useCallback } from 'react';
import type { AbstractComponent, ChildrenArray } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { openDialog } from '../../base/dialog';

import { PollResults, PollResultsDialog } from '.';


/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {
    pollId: number
};

/**
 * The type of the React {@code Component} props of {@link AbstractPollResultsMessage}.
 */
export type AbstractProps = {
    children: ChildrenArray<any>,
    detailsText: string,
    noticeText: string,
    showDetails: Function
};

/**
 * Higher Order Component taking in a concrete PollResultsMessage component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollResultsMessage = (Component: AbstractComponent<AbstractProps>) => ({ pollId }: InputProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const showDetails = useCallback(() => {
        dispatch(openDialog(PollResultsDialog, { pollId }));
    }, [ pollId ]);

    return (
        <Component
            detailsText = { t('polls.chat.details') }
            noticeText = { t('polls.chat.notice') }
            showDetails = { showDetails }>
            <PollResults
                pollId = { pollId }
                showDetails = { false } />
        </Component>);
};

export default AbstractPollResultsMessage;
