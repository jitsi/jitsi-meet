/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconBurger } from '../../../base/icons/svg';
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { ANSWERS_LIMIT, CHAR_LIMIT } from '../../constants';
// @ts-ignore
import AbstractPollCreate from '../AbstractPollCreate';
// @ts-ignore
import type { AbstractProps } from '../AbstractPollCreate';

const useStyles = makeStyles()(theme => {
    return {
        buttonMargin: {
            marginRight: theme.spacing(2)
        }
    };
});

const PollCreate = ({
    addAnswer,
    answers,
    isSubmitDisabled,
    moveAnswer,
    onSubmit,
    question,
    removeAnswer,
    setAnswer,
    setCreateMode,
    setQuestion,
    t
}: AbstractProps) => {
    const { classes: styles } = useStyles();

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

    const [ grabbing, setGrabbing ] = useState(null);

    const interchangeHeights = (i: number, j: number) => {
        const h = answerInputs.current[i].scrollHeight;

        answerInputs.current[i].style.height = `${answerInputs.current[j].scrollHeight}px`;
        answerInputs.current[j].style.height = `${h}px`;
    };

    const onGrab = useCallback((i, ev) => {
        if (ev.button !== 0) {
            return;
        }
        setGrabbing(i);
        window.addEventListener('mouseup', () => {
            setGrabbing(_grabbing => {
                requestFocus(_grabbing);

                return null;
            });
        }, { once: true });
    }, []);

    const onMouseOver = useCallback(i => {
        if (grabbing !== null && grabbing !== i) {
            interchangeHeights(i, grabbing);
            moveAnswer(grabbing, i);
            setGrabbing(i);
        }
    }, []);

    const autogrow = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        const el = ev.target;

        el.style.height = '1px';
        el.style.height = `${el.scrollHeight + 2}px`;
    };

    /* eslint-disable react/jsx-no-bind */
    return (<form
        className = 'polls-pane-content'
        onSubmit = { onSubmit }>
        <div className = 'poll-create-container poll-container'>
            <div className = 'poll-create-header'>
                { t('polls.create.create') }
            </div>
            <div className = 'poll-question-field'>
                <span className = 'poll-create-label'>
                    { t('polls.create.pollQuestion') }
                </span>
                <textarea
                    autoFocus = { true }
                    className = 'expandable-input'
                    maxLength = { CHAR_LIMIT }
                    onChange = { ev => setQuestion(ev.target.value) }
                    onInput = { autogrow }
                    onKeyDown = { onQuestionKeyDown }
                    placeholder = { t('polls.create.questionPlaceholder') }
                    required = { true }
                    rows = { 1 }
                    value = { question } />
            </div>
            <ol className = 'poll-answer-field-list'>
                {answers.map((answer: any, i: number) =>
                    (<li
                        className = { `poll-answer-field${grabbing === i ? ' poll-dragged' : ''}` }
                        key = { i }
                        onMouseOver = { () => onMouseOver(i) }>
                        <span className = 'poll-create-label'>
                            { t('polls.create.pollOption', { index: i + 1 })}
                        </span>
                        <div className = 'poll-create-option-row'>
                            <textarea
                                className = 'expandable-input'
                                maxLength = { CHAR_LIMIT }
                                onChange = { ev => setAnswer(i, ev.target.value) }
                                onInput = { autogrow }
                                onKeyDown = { ev => onAnswerKeyDown(i, ev) }
                                placeholder = { t('polls.create.answerPlaceholder', { index: i + 1 }) }
                                ref = { r => registerFieldRef(i, r) }
                                required = { true }
                                rows = { 1 }
                                value = { answer } />
                            <button
                                className = 'poll-drag-handle'
                                onMouseDown = { ev => onGrab(i, ev) }
                                tabIndex = { -1 }
                                type = 'button'>
                                <Icon src = { IconBurger } />
                            </button>
                        </div>

                        { answers.length > 2
                        && <Tooltip content = { t('polls.create.removeOption') }>
                            <button
                                className = 'poll-remove-option-button'
                                onClick = { () => removeAnswer(i) }
                                type = 'button'>
                                { t('polls.create.removeOption') }
                            </button>
                        </Tooltip>}
                    </li>)
                )}
            </ol>
            <div className = 'poll-add-button'>
                <Button
                    accessibilityLabel = { t('polls.create.addOption') }
                    disabled = { answers.length >= ANSWERS_LIMIT }
                    fullWidth = { true }
                    labelKey = { 'polls.create.addOption' }
                    onClick = { () => {
                        addAnswer();
                        requestFocus(answers.length);
                    } }
                    type = { BUTTON_TYPES.SECONDARY } />
            </div>
        </div>
        <div className = 'poll-footer poll-create-footer'>
            <Button
                accessibilityLabel = { t('polls.create.cancel') }
                className = { styles.buttonMargin }
                fullWidth = { true }
                labelKey = { 'polls.create.cancel' }
                onClick = { () => setCreateMode(false) }
                type = { BUTTON_TYPES.SECONDARY } />
            <Button
                accessibilityLabel = { t('polls.create.send') }
                disabled = { isSubmitDisabled }
                fullWidth = { true }
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
