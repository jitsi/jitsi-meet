import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { ANSWERS_LIMIT, CHAR_LIMIT } from '../../constants';
import AbstractPollCreate, { AbstractProps } from '../AbstractPollCreate';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'relative'
        },
        createContainer: {
            padding: '0 24px',
            height: 'calc(100% - 88px)',
            overflowY: 'auto'
        },
        header: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: theme.palette.text01,
            margin: '24px 0 16px'
        },
        questionContainer: {
            paddingBottom: '24px',
            borderBottom: `1px solid ${theme.palette.ui03}`
        },
        answerList: {
            listStyleType: 'none',
            margin: 0,
            padding: 0
        },
        answer: {
            marginBottom: '24px'
        },
        removeOption: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.link01,
            marginTop: '8px',
            border: 0,
            background: 'transparent'
        },
        addButtonContainer: {
            display: 'flex'
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '24px',
            width: '100%',
            boxSizing: 'border-box'
        },
        buttonMargin: {
            marginRight: theme.spacing(3)
        }
    };
});

const PollCreate = ({
    addAnswer,
    answers,
    isSubmitDisabled,
    onSubmit,
    question,
    removeAnswer,
    setAnswer,
    setCreateMode,
    setQuestion,
    t
}: AbstractProps) => {
    const { classes } = useStyles();

    /*
     * This ref stores the Array of answer input fields, allowing us to focus on them.
     * This array is maintained by registerfieldRef and the useEffect below.
     */
    const answerInputs = useRef<Array<HTMLInputElement>>([]);
    const registerFieldRef = useCallback((i, r) => {
        if (r === null) {
            return;
        }
        answerInputs.current[i] = r;
    }, [ answerInputs ]);

    useEffect(() => {
        answerInputs.current = answerInputs.current.slice(0, answers.length);
    }, [ answers ]);

    /*
     * This state allows us to requestFocus asynchronously, without having to worry
     * about whether a newly created input field has been rendered yet or not.
     */
    const [ lastFocus, requestFocus ] = useState<number | null>(null);

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

    const checkModifiers = useCallback(ev => {
        // Composition events used to add accents to characters
        // despite their absence from standard US keyboards,
        // to build up logograms of many Asian languages
        // from their base components or categories and so on.
        if (ev.isComposing || ev.keyCode === 229) {
            // keyCode 229 means that user pressed some button,
            // but input method is still processing that.
            // This is a standard behavior for some input methods
            // like entering japanese or сhinese hieroglyphs.
            return true;
        }

        // Because this isn't done automatically on MacOS
        if (ev.key === 'Enter' && ev.metaKey) {
            ev.preventDefault();
            onSubmit();

            return;
        }
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) {
            return;
        }
    }, []);

    const onQuestionKeyDown = useCallback(ev => {
        if (checkModifiers(ev)) {
            return;
        }

        if (ev.key === 'Enter') {
            requestFocus(0);
            ev.preventDefault();
        }
    }, []);

    // Called on keypress in answer fields
    const onAnswerKeyDown = useCallback((i, ev) => {
        if (checkModifiers(ev)) {
            return;
        }

        if (ev.key === 'Enter') {
            // We add a new option input
            // only if we are on the last option input
            if (i === answers.length - 1) {
                addAnswer(i + 1);
            }
            requestFocus(i + 1);
            ev.preventDefault();
        } else if (ev.key === 'Backspace' && ev.target.value === '' && answers.length > 1) {
            removeAnswer(i);
            requestFocus(i > 0 ? i - 1 : 0);
            ev.preventDefault();
        } else if (ev.key === 'ArrowDown') {
            if (i === answers.length - 1) {
                addAnswer();
            }
            requestFocus(i + 1);
            ev.preventDefault();
        } else if (ev.key === 'ArrowUp') {
            if (i === 0) {
                addAnswer(0);
                requestFocus(0);
            } else {
                requestFocus(i - 1);
            }
            ev.preventDefault();
        }
    }, [ answers, addAnswer, removeAnswer, requestFocus ]);

    /* eslint-disable react/jsx-no-bind */
    return (<form
        className = { classes.container }
        onSubmit = { onSubmit }>
        <div className = { classes.createContainer }>
            <div className = { classes.header }>
                { t('polls.create.create') }
            </div>
            <div className = { classes.questionContainer }>
                <Input
                    autoFocus = { true }
                    id = 'polls-create-input'
                    label = { t('polls.create.pollQuestion') }
                    maxLength = { CHAR_LIMIT }
                    onChange = { setQuestion }
                    onKeyPress = { onQuestionKeyDown }
                    placeholder = { t('polls.create.questionPlaceholder') }
                    textarea = { true }
                    value = { question } />
            </div>
            <ol className = { classes.answerList }>
                {answers.map((answer: any, i: number) =>
                    (<li
                        className = { classes.answer }
                        key = { i }>
                        <Input
                            id = { `polls-answer-input-${i}` }
                            label = { t('polls.create.pollOption', { index: i + 1 }) }
                            maxLength = { CHAR_LIMIT }
                            onChange = { val => setAnswer(i, val) }
                            onKeyPress = { ev => onAnswerKeyDown(i, ev) }
                            placeholder = { t('polls.create.answerPlaceholder', { index: i + 1 }) }
                            ref = { r => registerFieldRef(i, r) }
                            textarea = { true }
                            value = { answer } />

                        { answers.length > 2
                        && <button
                            className = { classes.removeOption }
                            onClick = { () => removeAnswer(i) }
                            type = 'button'>
                            { t('polls.create.removeOption') }
                        </button>}
                    </li>)
                )}
            </ol>
            <div className = { classes.addButtonContainer }>
                <Button
                    accessibilityLabel = { t('polls.create.addOption') }
                    disabled = { answers.length >= ANSWERS_LIMIT }
                    labelKey = { 'polls.create.addOption' }
                    onClick = { () => {
                        addAnswer();
                        requestFocus(answers.length);
                    } }
                    type = { BUTTON_TYPES.SECONDARY } />
            </div>
        </div>
        <div className = { classes.footer }>
            <Button
                accessibilityLabel = { t('polls.create.cancel') }
                className = { classes.buttonMargin }
                labelKey = { 'polls.create.cancel' }
                onClick = { () => setCreateMode(false) }
                type = { BUTTON_TYPES.SECONDARY } />
            <Button
                accessibilityLabel = { t('polls.create.send') }
                disabled = { isSubmitDisabled }
                isSubmit = { true }
                labelKey = { 'polls.create.send' } />
        </div>
    </form>);
};

/*
 * We apply AbstractPollCreate to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollCreate(PollCreate);
