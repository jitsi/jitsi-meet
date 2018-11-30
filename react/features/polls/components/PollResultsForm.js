// @flow

import React, { Component } from 'react';
import {
    Container
} from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import PollChoice from './PollChoice';

type Props = {

    /**
     * Object containing all polls by ID.
     */
    polls: Object,

    /**
     * Object containing all choices by ID.
     */
    choices: Object,

    /**
     * Object containing all questions by ID.
     */
    questions: Object
};

/**
 * Result view form.
 */
class PollResultsForm extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderPoll = this._renderPoll.bind(this);
        this._renderPollChoice = this._renderPollChoice.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { polls } = this.props;
        const renderedPolls = Object.keys(polls).map(this._renderPoll);

        return (
            <div>
                { renderedPolls }
            </div>
        );
    }

    _renderPoll: (string, number) => React$Node;

    /**
     * Render a given Poll results.
     *
     * @param {string} id - ID of the poll.
     * @param {number} num - Number of item in list.
     * @returns {React$Node}
     */
    _renderPoll(id: string, num: number) {
        const poll = this.props.polls[id];
        const question = this.props.questions[poll.question];
        const renderedChoices = poll.choices.map(this._renderPollChoice);

        return (
            <Container
                key = { num.toString() } >
                <FieldTextStateless
                    autoFocus = { true }
                    disabled = { true }
                    id = { 'poll-question' }
                    type = 'text'
                    value = { question.text } />

                <div>
                    <ul
                        id = { 'poll-items-list' } >
                        { renderedChoices }
                    </ul>
                </div>
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
        const { choices } = this.props;
        const choice = choices[item];
        const numberOfVotes = choice.votes.length;

        return (
            <PollChoice
                disabled = { true }
                editable = { false }
                id = { item }
                key = { id.toString() }
                selected = { false }
                text = { choice.text }
                votes = { numberOfVotes } />
        );
    }

}

export default PollResultsForm;
