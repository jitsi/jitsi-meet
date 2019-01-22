// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DialogWithTabs, hideDialog } from '../../base/dialog';
import PollCreateForm from './PollCreateForm';
import VoteForm from './VoteForm';
import PollResultsForm from './PollResultsForm';
import { translate } from '../../base/i18n';
import v1 from 'uuid/v1';
import {
    startPoll,
    vote, endPoll
} from '../actions';
import { getUniquePollChoices } from '../functions';

import { getLocalParticipant } from '../../base/participants';

type Props = {

    /**
     * Redux dispatch method.
     */
    dispatch: Function,

    /**
     * True if there is an active poll session now.
     */
    isPollRunning: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Current user id.
     */
    userID: string
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
     * Poll question.
     */
    question: Object
};

/**
 * Polls main dialog view component.
 */
class PollDialog extends Component<Props, State> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._closeDialog = this._closeDialog.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._addChoice = this._addChoice.bind(this);
        this._removeChoice = this._removeChoice.bind(this);
        this._onQuestionTextChange = this._onQuestionTextChange.bind(this);
        this._createNewPoll = this._createNewPoll.bind(this);
        this._choiceTextChange = this._choiceTextChange.bind(this);
        this._vote = this._vote.bind(this);
        this._endPoll = this._endPoll.bind(this);
        this._clearState = this._clearState.bind(this);

        const initialState = this._clearState();

        this.state = {
            ...initialState
        };
    }

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        console.log('Close');
        this.props.dispatch(hideDialog());
    }

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const { isPollRunning, userID } = this.props;
        const title = isPollRunning ? 'dialog.endPoll' : 'dialog.startPoll';
        const tabs = isPollRunning ? [ {
            component: VoteForm,
            label: 'polls.vote',
            props: {
                userID,
                onVoteClicked: this._vote
            },
            submit: null
        } ] : [ {
            component: PollCreateForm,
            label: 'polls.create',
            props: {
                choices: this.state.choices,
                onAddChoice: this._addChoice,
                onChoiceTextChange: this._choiceTextChange,
                onRemoveChoice: this._removeChoice,
                onQuestionTextChange: this._onQuestionTextChange
            },
            propsUpdateFunction: (oldProps, newProps) => {
                return { ...newProps };
            },
            submit: null
        } ];

        tabs.push({
            component: PollResultsForm,
            label: 'polls.results',
            props: {},
            submit: null
        });

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = { 'polls-dialog' }
                key = { isPollRunning.toString() }
                okTitleKey = { title }
                onSubmit = { this._onSubmit }
                tabs = { tabs }
                titleKey = { 'dialog.polls' } />
        );
    }

    _onSubmit: (Object) => void;

    /**
     * Submit button handler.
     *
     * @returns {boolean}
     */
    _onSubmit() {
        const { isPollRunning } = this.props;

        if (isPollRunning) {
            this._endPoll();
        } else {
            this._createNewPoll();
        }
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

    _choiceTextChange: (string, string) => void;

    /**
     * Item text change handler.
     *
     * @param {string} id - ID of the item with change.
     * @param {string} text - New text.
     * @returns {void}
     */
    _choiceTextChange(id: string, text: string) {
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

    _createNewPoll: () => void;

    /**
     * Click handler for creating a new poll.
     *
     * @returns {boolean}
     */
    _createNewPoll() {
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

        dispatch(startPoll(payload));

        // Clear Object
        const newState = this._clearState();

        this.setState({
            ...newState
        });
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

    _endPoll: () => void;

    /**
     * Dispatch action to end poll.
     *
     * @returns {boolean}
     */
    _endPoll() {
        const { dispatch } = this.props;

        dispatch(endPoll());
    }


    _vote: (string) => void;

    /**
     * Handle logic for voting for a specific option.
     *
     * @param {string} id - ID of selected item.
     * @returns {boolean}
     */
    _vote(id: string) {
        const { dispatch } = this.props;

        dispatch(vote(id));
    }

    _clearState: () => Object;

    /**
     * Returns a new object that can be set to clear state.
     *
     * @returns {Object}
     */
    _clearState() {
        const pollID = v1();
        const questionID = v1();

        return {
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
    }
}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux store state.
 * @returns {{}}
 */
function _mapStateToProps(state: Object) {
    const { currentPoll } = state['features/polls'];
    const userID = getLocalParticipant(state).id;

    return {
        isPollRunning: currentPoll !== null,
        userID
    };
}

export default translate(connect(_mapStateToProps)(PollDialog));
