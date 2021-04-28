// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { AbstractPollCreateDialog, AbstractProps } from '../AbstractPollCreateDialog';

type Props = AbstractProps & {

    /**
     * The i18n translate function.
     */
    t: Function
};

const PollCreateDialog = (props: Props) => {
    const {
        question, setQuestion,
        answers, setAnswer, addAnswer, removeAnswer,
        onSubmit,
        t
    } = props;

    /*
     * This ref stores the Array of answer input fields, allowing us to focus on them.
     * This array is maintained by registerfieldRef and the useEffect below.
     */
    const answerInputs = useRef([]);
    const registerFieldRef = useCallback((i, r) => {
        if (r === null) {
            return;
        }
        answerInputs.current[i] = r.input;
    }, [ answerInputs ]);

    useEffect(() => {
        answerInputs.current = answerInputs.current.slice(0, answers.length);
    }, [ answers ]);

    /*
     * This state allows us to requestFocus asynchronously, without having to worry
     * about whether a newly created input field has been rendered yet or not.
     */
    const [ lastFocus, requestFocus ] = useState(null);

    useEffect(() => {
        if (lastFocus === null) {
            return;
        }
        const input = answerInputs.current[lastFocus];

        if (input === undefined) {
            return;
        }
        input.focus();
    }, [ lastFocus ]);

    // Called on keypress in answer fields
    const onAnswerKeyDown = useCallback((i, ev) => {
        if (ev.key === 'Enter') {
            addAnswer(i + 1);
            requestFocus(i + 1);
            ev.preventDefault();
        } else if (ev.key === 'Backspace' && ev.target.value === '') {
            removeAnswer(i);
            requestFocus(i - 1);
            ev.preventDefault();
        } else if (ev.key === 'ArrowDown') {
            requestFocus(i + 1);
        } else if (ev.key === 'ArrowUp') {
            requestFocus(i - 1);
        }
    }, [ addAnswer, removeAnswer ]);

    return (<Dialog
        okKey = { t('polls.create.Send') }
        onSubmit = { onSubmit }
        titleKey = 'polls.create.dialogTitle'
        width = 'small'>
        <div className = 'poll-question-field'>
            <FieldTextStateless
                autoFocus = { true }
                compact = { true }
                isLabelHidden = { true }
                // eslint-disable-next-line react/jsx-no-bind
                onChange = { ev => setQuestion(ev.target.value) }
                placeholder = { t('polls.create.questionPlaceholder') }
                shouldFitContainer = { true }
                type = 'text'
                value = { question } />
        </div>
        <ol className = 'poll-answer-fields'>
            {
            /* eslint-disable react/jsx-no-bind */
                answers.map((answer, i) => (<li key = { i }>
                    <FieldTextStateless
                        compact = { true }
                        isLabelHidden = { true }
                        onChange = { ev => setAnswer(i, ev.target.value) }
                        onKeyDown = { ev => onAnswerKeyDown(i, ev) }
                        placeholder = { t('polls.create.answerPlaceholder', { index: i + 1 }) }
                        ref = { r => registerFieldRef(i, r) }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { answer } />
                </li>))
            /* eslint-enable react/jsx-no-bind */
            }
        </ol>
    </Dialog>);
};

/*
 * We apply AbstractPollCreateDialog to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default translate(AbstractPollCreateDialog(PollCreateDialog));
