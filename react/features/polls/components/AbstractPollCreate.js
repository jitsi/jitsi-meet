// @flow

import React, { useCallback, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { sendAnalytics, createPollEvent } from '../../analytics';
import { getParticipantDisplayName } from '../../base/participants';
import { COMMAND_NEW_POLL } from '../constants';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {
    setCreateMode: boolean => void,
};

/*
 * Props that will be passed by the AbstractPollCreate to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = InputProps & {
    answers: Array<string>,
    question: string,
    setQuestion: string => void,
    setAnswer: (number, string) => void,
    addAnswer: ?number => void,
    moveAnswer: (number, number) => void,
    removeAnswer: number => void,
    onSubmit: Function,
    isSubmitDisabled: boolean,
    t: Function,
};

/**
 * Higher Order Component taking in a concrete PollCreate component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollCreate = (Component: AbstractComponent<AbstractProps>) => (props: InputProps) => {

    const { setCreateMode } = props;

    const [ question, setQuestion ] = useState('');

    const [ answers, setAnswers ] = useState([ '', '' ]);

    const setAnswer = useCallback((i, answer) => {
        const newAnswers = [ ...answers ];

        newAnswers[i] = answer;
        setAnswers(newAnswers);
    });

    const addAnswer = useCallback((i: ?number) => {
        const newAnswers = [ ...answers ];

        sendAnalytics(createPollEvent('option.added'));
        newAnswers.splice(typeof i === 'number' ? i : answers.length, 0, '');
        setAnswers(newAnswers);
    });

    const moveAnswer = useCallback((i, j) => {
        const newAnswers = [ ...answers ];
        const answer = answers[i];

        sendAnalytics(createPollEvent('option.moved'));
        newAnswers.splice(i, 1);
        newAnswers.splice(j, 0, answer);
        setAnswers(newAnswers);
    });

    const removeAnswer = useCallback(i => {
        if (answers.length <= 2) {
            return;
        }
        const newAnswers = [ ...answers ];

        sendAnalytics(createPollEvent('option.removed'));
        newAnswers.splice(i, 1);
        setAnswers(newAnswers);
    });

    const conference = useSelector(state => state['features/base/conference'].conference);
    const myId = conference.myUserId();
    const myName = useSelector(state => getParticipantDisplayName(state, myId));

    const onSubmit = useCallback(ev => {
        if (ev) {
            ev.preventDefault();
        }

        const filteredAnswers = answers.filter(answer => answer.trim().length > 0);

        if (filteredAnswers.length < 2) {
            return;
        }

        conference.sendMessage({
            type: COMMAND_NEW_POLL,
            pollId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
            senderId: myId,
            senderName: myName,
            question,
            answers: filteredAnswers
        });
        sendAnalytics(createPollEvent('created'));

        setCreateMode(false);

    }, [ conference, question, answers ]);

    // Check if the poll create form can be submitted i.e. if the send button should be disabled.
    const isSubmitDisabled
        = question.trim().length <= 0 // If no question is provided
        || answers.filter(answer => answer.trim().length > 0).length < 2; // If not enough options are provided

    const { t } = useTranslation();

    return (<Component
        addAnswer = { addAnswer }
        answers = { answers }
        isSubmitDisabled = { isSubmitDisabled }
        moveAnswer = { moveAnswer }
        onSubmit = { onSubmit }
        question = { question }
        removeAnswer = { removeAnswer }
        setAnswer = { setAnswer }
        setCreateMode = { setCreateMode }
        setQuestion = { setQuestion }
        t = { t } />);

};

export default AbstractPollCreate;
