// @flow

import React, { useCallback, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';


import { COMMAND_NEW_POLL } from '../constants';

/*
 * Props that will be passed by the AbstractPollCreateDialog to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    question: string, setQuestion: string => void,
    answers: Array<string>,
    setAnswer: (number, string) => void,
    addAnswer: ?number => void,
    moveAnswer: (number, number) => void,
    removeAnswer: number => void,
    onSubmit: Function,
    t: Function,
};

/*
 * Higher Order Component taking in a concrete PollCreateDialog component and
 * augmenting it with state/behavior common to both web and native implementations.
 */
const AbstractPollCreateDialog = (Component: AbstractComponent<AbstractProps>) => (props: any) => {
    const [ question, setQuestion ] = useState('');

    const [ answers, setAnswers ] = useState([ '' ]);

    const setAnswer = useCallback((i, answer) => {
        const newAnswers = [ ...answers ];

        newAnswers[i] = answer;
        setAnswers(newAnswers);
    });

    const addAnswer = useCallback(i => {
        const newAnswers = [ ...answers ];

        newAnswers.splice(i === undefined ? answers.length : i, 0, '');
        setAnswers(newAnswers);
    });

    const moveAnswer = useCallback((i, j) => {
        const newAnswers = [ ...answers ];

        const answer = answers[i];

        newAnswers.splice(i, 1);
        newAnswers.splice(j, 0, answer);
        setAnswers(newAnswers);
    });

    const removeAnswer = useCallback(i => {
        if (answers.length === 1) {
            return;
        }
        const newAnswers = [ ...answers ];

        newAnswers.splice(i, 1);
        setAnswers(newAnswers);
    });

    const conference = useSelector(state => state['features/base/conference'].conference);

    const onSubmit = useCallback(() => {
        const filteredAnswers = answers.filter(answer => answer.trim().length > 0);

        if (filteredAnswers.length === 0) {
            return false;
        }

        conference.sendMessage({
            type: COMMAND_NEW_POLL,
            pollId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
            senderId: conference.myUserId(),
            question,
            answers: filteredAnswers
        });

        return true;
    }, [ conference, question, answers ]);

    const { t } = useTranslation();

    return (<Component
        { ...props }
        addAnswer = { addAnswer }
        answers = { answers }
        moveAnswer = { moveAnswer }
        onSubmit = { onSubmit }
        question = { question }
        removeAnswer = { removeAnswer }
        setAnswer = { setAnswer }
        setQuestion = { setQuestion }
        t = { t } />);
};

export default AbstractPollCreateDialog;
