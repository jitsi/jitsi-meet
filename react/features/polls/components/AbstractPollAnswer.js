// @flow

import React, { useCallback, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { sendAnalytics, createPollEvent } from '../../analytics';
import { getLocalParticipant, getParticipantById } from '../../base/participants';
import { useBoundSelector } from '../../base/util/hooks';
import { registerVote, setVoteChanging } from '../actions';
import { COMMAND_ANSWER_POLL } from '../constants';
import type { Poll } from '../types';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {
    pollId: string,
};

/*
 * Props that will be passed by the AbstractPollAnswer to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    checkBoxStates: Function,
    creatorName: string,
    poll: Poll,
    setCheckbox: Function,
    skipAnswer: Function,
    skipChangeVote: Function,
    submitAnswer: Function,
    t: Function,
};

/**
 * Higher Order Component taking in a concrete PollAnswer component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollAnswer = (Component: AbstractComponent<AbstractProps>) => (props: InputProps) => {

    const { pollId } = props;

    const conference: Object = useSelector(state => state['features/base/conference'].conference);

    const poll: Poll = useSelector(state => state['features/polls'].polls[pollId]);

    const { id: localId } = useSelector(getLocalParticipant);

    const [ checkBoxStates, setCheckBoxState ] = useState(() => {
        if (poll.lastVote !== null) {
            return [ ...poll.lastVote ];
        }

        return new Array(poll.answers.length).fill(false);
    });
    const participant = useBoundSelector(getParticipantById, poll.senderId);

    const setCheckbox = useCallback((index, state) => {
        const newCheckBoxStates = [ ...checkBoxStates ];

        newCheckBoxStates[index] = state;
        setCheckBoxState(newCheckBoxStates);
        sendAnalytics(createPollEvent('vote.checked'));
    }, [ checkBoxStates ]);

    const dispatch = useDispatch();

    const localParticipant = useBoundSelector(getParticipantById, localId);
    const localName: string = localParticipant.name ? localParticipant.name : 'Fellow Jitster';

    const submitAnswer = useCallback(() => {
        conference.sendMessage({
            type: COMMAND_ANSWER_POLL,
            pollId,
            voterId: localId,
            voterName: localName,
            answers: checkBoxStates
        });

        sendAnalytics(createPollEvent('vote.sent'));
        dispatch(registerVote(pollId, checkBoxStates));

        return false;
    }, [ pollId, localId, localName, checkBoxStates, conference ]);

    const skipAnswer = useCallback(() => {
        dispatch(registerVote(pollId, null));
        sendAnalytics(createPollEvent('vote.skipped'));

    }, [ pollId ]);

    const skipChangeVote = useCallback(() => {
        dispatch(setVoteChanging(pollId, false));
    }, [ dispatch, pollId ]);

    const { t } = useTranslation();

    return (<Component
        checkBoxStates = { checkBoxStates }
        creatorName = { participant ? participant.name : '' }
        poll = { poll }
        setCheckbox = { setCheckbox }
        skipAnswer = { skipAnswer }
        skipChangeVote = { skipChangeVote }
        submitAnswer = { submitAnswer }
        t = { t } />);

};

export default AbstractPollAnswer;
