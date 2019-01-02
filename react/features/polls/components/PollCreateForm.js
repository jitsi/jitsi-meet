// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Container
} from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import AddPollItem from './AddPollItem';
import v1 from 'uuid/v1';
import {
    startPoll
} from '../actions';
import { getUniquePollChoices } from '../functions';

import { getLocalParticipant } from '../../base/participants';
import PollChoice from './PollChoice';
import { translate } from '../../base/i18n';

type Props = {

    /**
     * Redux Store dispatch function.
     */
    dispatch: Function,

    /**
     * Current User ID.
     */
    userID: string,
};

type State = {

    /**
     * Available poll choices.
     */
    choices: Object,

    /**
     * New Poll Object
     */
    poll: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Poll question.
     */
    question: Object
};

/**
 * Form for creating a new Poll.
 */
class PollCreateForm extends Component<Props, State> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        const pollID = v1();
        const questionID = v1();

        this.state = {
            choices: {},
            poll: {
                id: pollID,
                question: questionID,
                choices: [],
                owner: this.props.userID
            },
            question: {
                id: questionID,
                text: ''
            }
        };

        this._addChoice = this._addChoice.bind(this);
        this._removeChoice = this._removeChoice.bind(this);
        this._renderPollChoice = this._renderPollChoice.bind(this);
        this._pollItemTextChange = this._pollItemTextChange.bind(this);
        this._onCreatePollClicked = this._onCreatePollClicked.bind(this);
        this._onQuestionTextChange = this._onQuestionTextChange.bind(this);
    }

    _addChoice: (void) => void;

    /**
     * Add new item to the list.
     *
     * @returns {void}
     */
    _addChoice() {
        const id = v1();

        this.setState({
            choices: {
                ...this.state.choices,
                [id]: {
                    id,
                    text: '',
                    votes: []
                }
            }
        });
    }

    _removeChoice: (number) => void;

    /**
     * Removes an item from list.
     *
     * @param {string} id - ID of item in list.
     * @returns {void}
     */
    _removeChoice(id: string) {
        const filteredChoices = Object.assign({}, this.state.choices);

        delete filteredChoices[id];

        this.setState({
            choices: filteredChoices
        });
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const choices = Object.keys(this.state.choices)
            .map(this._renderPollChoice);

        return (
            <Container
                id = { 'poll-create-form' } >
                <FieldTextStateless
                    autoFocus = { true }
                    id = { 'poll-question' }
                    onChange = { this._onQuestionTextChange }
                    placeholder = { 'Ask a question...' }
                    type = 'text' />

                <div>
                    <ul
                        id = { 'poll-items-list' } >
                        { choices }
                    </ul>
                </div>

                <AddPollItem
                    addItemHandler = { this._addChoice } />

                <button
                    className = { 'new-poll-button' }
                    onClick = { this._onCreatePollClicked }
                    text = { 'dialog.startPoll' } />
            </Container>
        );
    }

    _renderPollChoice: (string, number) => React$Node;

    /**
     * Renders choices' list item.
     *
     * @param {string} item - List item.
     * @param {string} id - Item key.
     * @returns {Component}
     */
    _renderPollChoice(item: string, id: number) {
        return (
            <PollChoice
                deleteHandler = { this._removeChoice }
                disabled = { true }
                editable = { true }
                id = { item }
                key = { id.toString() }
                selected = { false }
                text = { this.state.choices[item].text }
                textChangeHandler = { this._pollItemTextChange }
                votes = { 0 } />
        );
    }

    _pollItemTextChange: (string, string) => void;

    /**
     * Item text change handler.
     *
     * @param {string} id - ID of the item with change.
     * @param {string} text - New text.
     * @returns {void}
     */
    _pollItemTextChange(id: string, text: string) {
        const choice = this.state.choices[id];

        this.setState({
            choices: {
                ...this.state.choices,
                [id]: {
                    ...choice,
                    text
                }
            }
        });
    }

    _onCreatePollClicked: (Object) => boolean;

    /**
     * Click handler for creating a new poll.
     *
     * @param {Object} event - Button click event.
     * @returns {boolean}
     */
    _onCreatePollClicked(event: Object) {
        event.preventDefault();

        const { question, choices, poll } = this.state;
        const { dispatch } = this.props;
        const uniqueChoices = getUniquePollChoices(choices);

        if (!question.text.trim() || Object.keys(uniqueChoices).length < 2) {
            return false;
        }

        Object.keys(uniqueChoices).forEach(x => {
            poll.choices.push(x);
        });

        const payload = {
            poll,
            question,
            choices: uniqueChoices
        };

        console.log(payload);

        event.preventDefault();
        dispatch(startPoll(payload));
    }

    _onQuestionTextChange: (Object) => void;

    /**
     * Update the question text in local state.
     *
     * @param {event} event - Keyboard event.
     * @returns {void}
     */
    _onQuestionTextChange(event: Object) {
        const text: string = event.target.value;

        this.setState({
            question: {
                ...this.state.question,
                text
            }
        });
    }

}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux store state.
 * @returns {{}}
 */
function _mapStateToProps(state: Object) {
    const userID = getLocalParticipant(state).id;

    return {
        userID
    };
}

export default translate(connect(_mapStateToProps)(PollCreateForm));
