// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Container
} from '../../base/react';
import { FieldTextStateless } from '@atlaskit/field-text';
import { getLocalParticipant } from '../../base/participants';
import { vote, endPollSession } from '../actions';
import PollChoice from './PollChoice';

type Props = {

    /**
     * Choices available for voting in current poll.
     */
    choices: Object,

    /**
     * User current vote.
     */
    currentVote: ? string,

    /**
     * Redux.
     */
    dispatch: Function,

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
    questions: Object,
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
        this._voteButtonClicked = this._voteButtonClicked.bind(this);
        this._onEndVoteClicked = this._onEndVoteClicked.bind(this);
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
            <Container>
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

                <button
                    id = { 'end-poll-button' }
                    onClick = { this._onEndVoteClicked } />
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
                disabled = { false }
                editable = { false }
                id = { item }
                key = { id.toString() }
                selected = { false }
                text = { choice.text }
                voteHandler = { this._voteButtonClicked }
                votes = { numberOfVotes } />
        );
    }

    _voteButtonClicked: (string) => void;

    /**
     * Handle logic for voting for a specific option.
     *
     * @param {string} id - ID of selected item.
     * @returns {boolean}
     */
    _voteButtonClicked(id: string) {
        const { currentVote, dispatch } = this.props;

        if (currentVote !== id) {
            dispatch(vote(currentVote, id, this.props.userID));
        }
    }

    _onEndVoteClicked: () => boolean;

    /**
     * End Poll Session button handler.
     *
     * @returns {boolean}
     */
    _onEndVoteClicked() {
        this.props.dispatch(endPollSession());

        return true;
    }
}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux store state.
 * @returns {{}}
 */
function _mapStateToProps(state: Object) {
    const {
        currentPoll,
        polls,
        questions,
        choices,
        currentVote
    } = state['features/polls'];
    const userID = getLocalParticipant(state).id;

    return {
        poll: polls[currentPoll],
        userID,
        questions,
        choices,
        currentVote
    };
}

export default connect(_mapStateToProps)(VoteForm);
