// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import v1 from 'uuid/v1';

import { DialogWithTabs, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';

import { showWarningNotification } from '../../notifications';

import {
    endPoll,
    startPoll,
    vote
} from '../actions';

import PollCreateForm from './PollCreateForm';
import PollResultsForm from './PollResultsForm';
import VoteForm from './VoteForm';

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

        this._addChoice = this._addChoice.bind(this);
        this._choiceTextChange = this._choiceTextChange.bind(this);
        this._closeDialog = this._closeDialog.bind(this);
        this._createNewPoll = this._createNewPoll.bind(this);
        this._createNewState = this._createNewState.bind(this);
        this._endPoll = this._endPoll.bind(this);
        this._getUniquePollChoices = this._getUniquePollChoices.bind(this);
        this._onChoiceTextSubmit = this._onChoiceTextSubmit.bind(this);
        this._onQuestionTextChange = this._onQuestionTextChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._removeChoice = this._removeChoice.bind(this);
        this._vote = this._vote.bind(this);

        // create a new poll ID an list of choices
        const initialState = this._createNewState();

        this.state = {
            ...initialState
        };
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

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        this.props.dispatch(hideDialog());
    }

    _createNewPoll: () => void;

    /**
     * Click handler for creating a new poll.
     *
     * @returns {void}
     */
    _createNewPoll() {
        const { question, choices, poll } = this.state;
        const { dispatch } = this.props;
        const newPoll = { ...poll };
        const newQuestion = { ...question };

        // check if question is not empty
        newQuestion.text = newQuestion.text.trim();
        if (!newQuestion.text) {
            dispatch(showWarningNotification({
                descriptionKey: 'polls.errorEmptyQuestion',
                titleKey: 'polls.errorEmptyQuestionTitle'
            }));

            return false;
        }

        // remove duplicate choices and ensure we have enough of them to start
        // the poll
        const uniqueChoices = this._getUniquePollChoices(choices);

        if (Object.keys(uniqueChoices).length < 2) {
            dispatch(showWarningNotification({
                descriptionKey: 'polls.errorNotEnoughChoices',
                titleKey: 'polls.errorNotEnoughChoicesTitle'
            }));

            return false;
        }

        // update the list of choices in the poll to remove any duplicates
        // that might have been present and removed by _getUniquePollChoices
        newPoll.choices = [];
        Object.keys(uniqueChoices).forEach(choice => {
            newPoll.choices.push(choice);
        });

        const payload = {
            poll: newPoll,
            question: newQuestion,
            choices: uniqueChoices
        };

        dispatch(startPoll(payload));

        // we need to reset the state and prepare new IDs and a new list
        // of choices. This is needed because otherwise all polls will
        // be created with the same IDs and the list of choices will
        // reappear after a poll has ended because PollCreateForm recieves
        // the choices list as props from the PollDialog
        const newState = this._createNewState();

        this.setState({
            ...newState
        });
    }

    _createNewState: () => Object;

    /**
     * Returns a new object that can be set to clear state.
     *
     * @returns {Object}
     */
    _createNewState() {
        const pollID = v1();
        const questionID = v1();
        const choice1ID = v1();
        const choice2ID = v1();

        // keep 2 ready choices as it is required to have them to create a poll
        return {
            choices: {
                [choice1ID]: {
                    id: choice1ID,
                    text: '',
                    votes: []
                },
                [choice2ID]: {
                    id: choice2ID,
                    text: '',
                    votes: []
                }
            },
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

    _getUniquePollChoices: (Object) => Object;

    /**
     * Filter out duplicate choices.
     *
     * @param {Object} choices - Object containing choices listed by ID.
     * @returns {Object}
     */
    _getUniquePollChoices(choices: Object) {
        const newObj = {};
        const seen = new Set<string>();

        for (const key in choices) {
            if (Object.prototype.hasOwnProperty.call(choices, key)) {
                const text = choices[key].text.trim();

                if (!seen.has(text) && text !== '') {
                    newObj[key] = choices[key];
                    seen.add(text);
                }
            }
        }

        return newObj;
    }

    _onChoiceTextSubmit: (Object) => void;

    /**
     * Function to handle when enter key is pressed in the choice text input
     * field to automatically add a new choice to the list.
     *
     * @param {Object} event - Key press event.
     * @returns {void}
     */
    _onChoiceTextSubmit(event: Object) {
        if (event.keyCode === 13
            && event.shiftKey === false) {
            event.preventDefault();

            this._addChoice();
        }
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

    _onSubmit: () => void;

    /**
     * Submit button handler.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { isPollRunning } = this.props;

        if (isPollRunning) {
            this._endPoll();
        } else {
            this._createNewPoll();
        }
    }

    _removeChoice: (number) => void;

    /**
     * Removes an item from list.
     *
     * @param {string} id - ID of item in list.
     * @returns {void}
     */
    _removeChoice(id: string) {
        const { choices } = this.state;

        // don't delete if these are 2 remaining choices
        // keep 2 choices since this is the requirement to create a new poll
        // and it is easier to show the user what they have to fill
        if (Object.keys(choices).length === 2) {
            return;
        }

        const filteredChoices = { ...choices };

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
        const { isPollRunning, userID } = this.props;
        const title = isPollRunning ? 'polls.endPoll' : 'polls.startPoll';
        const tabs = isPollRunning ? [ {
            component: VoteForm,
            label: 'polls.vote',
            props: {
                userID,
                onVote: this._vote
            },
            styles: 'voteFormContainer',
            submit: null
        } ] : [ {
            component: PollCreateForm,
            label: 'polls.create',
            props: {
                choices: this.state.choices,
                onKeyDown: this._onChoiceTextSubmit,
                onChoiceTextChange: this._choiceTextChange,
                onRemoveChoice: this._removeChoice,
                onQuestionTextChange: this._onQuestionTextChange
            },
            propsUpdateFunction: (oldProps, newProps) => {
                return { ...newProps };
            },
            styles: 'pollCreateFormContainer',
            submit: null
        } ];

        tabs.push({
            component: PollResultsForm,
            label: 'polls.results',
            props: {},
            styles: 'pollResultsFormContainer',
            submit: null
        });

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = 'polls-dialog'
                key = { isPollRunning.toString() }
                okTitleKey = { title }
                onSubmit = { this._onSubmit }
                tabs = { tabs }
                titleKey = 'dialog.polls' />
        );
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
}

/**
 * Map Redux state to Component props.
 *
 * @param {Object} state - Redux store state.
 * @returns {{
 *      isPollRunning,
 *      userID
 * }}
 */
function _mapStateToProps(state: Object) {
    const { currentPoll } = state['features/polls'];
    const userID = getLocalParticipant(state).id;

    return {
        isPollRunning: Boolean(currentPoll),
        userID
    };
}

export default translate(connect(_mapStateToProps)(PollDialog));
