// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getLocalParticipant } from '../../base/participants';
import {
    Container
} from '../../base/react';

import PollChoice from './PollChoice';


type Props = {

    /**
     * Object containing all choices by ID.
     */
    choices: Object,

    /**
     * Object containing all polls by ID.
     */
    polls: Object,

    /**
     * ID of current user.
     */
    userID: string,

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

    _renderPoll: (string) => React$Node;

    /**
     * Render a given Poll results.
     *
     * @param {string} id - ID of the poll.
     * @returns {React$Node}
     */
    _renderPoll(id: string) {
        const poll = this.props.polls[id];
        const question = this.props.questions[poll.question];
        const renderedChoices = poll.choices.map(this._renderPollChoice);

        return (
            <Container
                key = { id } >
                <text
                    id = 'pollQuestion'>
                    { question.text }
                </text>

                <div
                    className = 'pollChoicesListContainer' >
                    <ul
                        className = 'pollChoicesList' >
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
        const { choices, userID } = this.props;
        const choice = choices[item];
        const numberOfVotes = choice.votes.length;
        const selected = choice.votes.includes(userID);

        return (
            <PollChoice
                disabled = { true }
                id = { item }
                key = { id.toString() }
                selected = { selected }
                text = { choice.text }
                votes = { numberOfVotes } />
        );
    }

}

/**
 * Filter current poll from previous polls.
 *
 * @param {Object} polls - Object contating all polls by ID.
 * @param {string} currentPoll - Current Poll ID or null.
 * @returns {Object} - Object with past polls only.
 */
function _getPastPolls(polls: Object, currentPoll: ?string): Object {
    const filtered = Object.keys(polls)
        .filter(key => key !== currentPoll)
        .reduce((obj, key) => {
            obj[key] = polls[key];

            return obj;
        }, {});

    return filtered;
}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux state.
 * @returns {{
 *      choices,
 *      polls,
 *      userID,
 *      questions
 * }}
 */
function _mapStateToProps(state: Object) {
    const {
        choices,
        currentPoll,
        polls,
        questions
    } = state['features/polls'];
    const userID = getLocalParticipant(state).id;

    return {
        choices,
        polls: _getPastPolls(polls, currentPoll),
        userID,
        questions
    };
}

export default connect(_mapStateToProps)(PollResultsForm);
