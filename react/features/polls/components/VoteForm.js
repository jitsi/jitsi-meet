// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Container
} from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import PollChoice from './PollChoice';

type Props = {

    /**
     * Choices available for voting in current poll.
     */
    choices: Object,

    /**
     * Redux.
     */
    dispatch: Function,

    /**
     * Function handler when vote button clicked.
     */
    onVoteClicked: Function,

    /**
     * Current Poll Object.
     */
    poll: Object,

    /**
     * Inform parent to submit.
     */
    submit: Function,

    /**
     * Current User ID.
     */
    userID: string,

    /**
     * Poll questions.
     */
    questions: Object
};

/**
 * Form for voting in a poll.
 */
class VoteForm extends Component<Props, *> {
    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderPollChoice = this._renderPollChoice.bind(this);
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { poll, questions } = this.props;
        const question = questions[poll.question];
        const renderedChoices = poll.choices.map(this._renderPollChoice);

        return (
            <Container
                className = { 'voteFormContainer' }>
                <FieldTextStateless
                    autoFocus = { true }
                    disabled = { true }
                    id = { 'pollQuestion' }
                    isLabelHidden = { true }
                    type = 'text'
                    value = { question.text } />

                <div
                    className = { 'pollChoicesListContainer' } >
                    <ul
                        id = { 'pollChoicesList' } >
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
        const { choices, userID, onVoteClicked } = this.props;
        const choice = choices[item];
        const numberOfVotes = choice.votes.length;
        const selected = choice.votes.findIndex(x => x === userID) > -1;

        return (
            <PollChoice
                disabled = { false }
                editable = { false }
                id = { item }
                key = { id.toString() }
                selected = { selected }
                text = { choice.text }
                voteHandler = { onVoteClicked }
                votes = { numberOfVotes } />
        );
    }
}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux store state.
 * @returns {{
 *      poll,
 *      questions,
 *      choices
 * }}
 */
function _mapStateToProps(state: Object) {
    const {
        choices,
        currentPoll,
        polls,
        questions
    } = state['features/polls'];

    return {
        poll: polls[currentPoll],
        questions,
        choices
    };
}

export default connect(_mapStateToProps)(VoteForm);
