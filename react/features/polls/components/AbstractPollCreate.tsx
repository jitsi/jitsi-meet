/* eslint-disable arrow-body-style */

import React, { ComponentType, FormEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createPollEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { getLocalParticipant } from '../../base/participants/functions';
import { savePoll } from '../actions';
import { hasIdenticalAnswers } from '../functions';
import { IAnswerData, IPoll } from '../types';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {
    setCreateMode: (mode: boolean) => void;
};

/*
 * Props that will be passed by the AbstractPollCreate to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = InputProps & {
    addAnswer: (index?: number) => void;
    answers: Array<IAnswerData>;
    editingPoll: IPoll | undefined;
    editingPollId: string | undefined;
    isSubmitDisabled: boolean;
    onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
    question: string;
    removeAnswer: (index: number) => void;
    setAnswer: (index: number, value: IAnswerData) => void;
    setQuestion: (question: string) => void;
    t: Function;
};

/**
 * Higher Order Component taking in a concrete PollCreate component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */


const AbstractPollCreate = (Component: ComponentType<AbstractProps>) => (props: InputProps) => {

    const { setCreateMode } = props;

    const pollState = useSelector((state: IReduxState) => state['features/polls'].polls);

    const editingPoll: [ string, IPoll ] | null = useMemo(() => {
        if (!pollState) {
            return null;
        }

        for (const key in pollState) {
            if (pollState.hasOwnProperty(key) && pollState[key].editing) {
                return [ key, pollState[key] ];
            }
        }

        return null;
    }, [ pollState ]);

    const answerResults = useMemo(() => {
        return editingPoll
            ? editingPoll[1].answers
            : [
                {
                    name: '',
                    voters: []
                },
                {
                    name: '',
                    voters: []
                } ];
    }, [ editingPoll ]);

    const questionResult = useMemo(() => {
        return editingPoll ? editingPoll[1].question : '';
    }, [ editingPoll ]);

    const [ question, setQuestion ] = useState(questionResult);

    const [ answers, setAnswers ] = useState(answerResults);

    const setAnswer = useCallback((i: number, answer: IAnswerData) => {
        setAnswers(currentAnswers => {
            const newAnswers = [ ...currentAnswers ];

            newAnswers[i] = answer;

            return newAnswers;
        });
    }, [ answers ]);

    const addAnswer = useCallback((i?: number) => {
        const newAnswers: Array<IAnswerData> = [ ...answers ];

        sendAnalytics(createPollEvent('option.added'));
        newAnswers.splice(typeof i === 'number'
            ? i : answers.length, 0, {
            name: '',
            voters: []
        });
        setAnswers(newAnswers);
    }, [ answers ]);

    const removeAnswer = useCallback(i => {
        if (answers.length <= 2) {
            return;
        }
        const newAnswers = [ ...answers ];

        sendAnalytics(createPollEvent('option.removed'));
        newAnswers.splice(i, 1);
        setAnswers(newAnswers);
    }, [ answers ]);

    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);

    const dispatch = useDispatch();

    const pollId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);

    const localParticipant = useSelector(getLocalParticipant);

    const onSubmit = useCallback(ev => {
        if (ev) {
            ev.preventDefault();
        }

        const filteredAnswers = answers.filter(answer => answer.name.trim().length > 0);

        if (filteredAnswers.length < 2) {
            return;
        }

        const poll = {
            changingVote: false,
            senderId: localParticipant?.id,
            showResults: false,
            lastVote: null,
            question,
            answers: filteredAnswers,
            saved: true,
            editing: false
        };

        if (editingPoll) {
            dispatch(savePoll(editingPoll[0], poll));
        } else {
            dispatch(savePoll(pollId, poll));
        }

        sendAnalytics(createPollEvent('created'));

        setCreateMode(false);

    }, [ conference, question, answers ]);

    // Check if the poll create form can be submitted i.e. if the send button should be disabled.
    const isSubmitDisabled
        = question.trim().length <= 0 // If no question is provided
        || answers.filter(answer => answer.name.trim().length > 0).length < 2 // If not enough options are provided
        || hasIdenticalAnswers(answers); // If duplicate options are provided

    const { t } = useTranslation();

    return (<Component
        addAnswer = { addAnswer }
        answers = { answers }
        editingPoll = { editingPoll?.[1] }
        editingPollId = { editingPoll?.[0] }
        isSubmitDisabled = { isSubmitDisabled }
        onSubmit = { onSubmit }
        question = { question }
        removeAnswer = { removeAnswer }
        setAnswer = { setAnswer }
        setCreateMode = { setCreateMode }
        setQuestion = { setQuestion }
        t = { t } />);

};

export default AbstractPollCreate;
