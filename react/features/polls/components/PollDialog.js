// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DialogWithTabs, hideDialog } from '../../base/dialog';
import PollCreateForm from './PollCreateForm';
import VoteForm from './VoteForm';
import { getPastPolls } from '../functions';
import PollResultsForm from './PollResultsForm';

type Props = {

    /**
     * Current Poll ID.
     */
    currentPoll: ?string,

    /**
     * Poll choices.
     */
    choices: Object,

    /**
     * Redux dispatch method.
     */
    dispatch: Function,

    /**
     * Polls Objects by ID.
     */
    polls: Object,

    /**
     * Poll questions.
     */
    questions: string
};

/**
 * Polls main dialog view component.
 */
class PollDialog extends Component<Props, *> {

    /**
     * Constructor.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._closeDialog = this._closeDialog.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
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

    /**
     * Component render method.
     *
     * @inheritdoc
     */
    render() {
        const {
            currentPoll,
            choices,
            polls,
            questions
        } = this.props;
        const tabs = currentPoll === null ? [ {
            component: PollCreateForm,
            label: 'polls.create',
            props: {},
            submit: null
        } ] : [ {
            component: VoteForm,
            label: 'polls.vote',
            props: {},
            submit: null
        } ];

        tabs.push({
            component: PollResultsForm,
            label: 'polls.results',
            props: {
                choices,
                polls: getPastPolls(polls, currentPoll),
                questions
            },
            submit: this._onSubmit
        });

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = 'polls-dialog'
                onSubmit = { this._onSubmit }
                tabs = { tabs }
                titleKey = 'dialog.polls' />
        );
    }

    _onSubmit: (Object) => void;

    /**
     * Submit button handler.
     *
     * @returns {boolean}
     */
    _onSubmit() {
        this._closeDialog();
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
        choices,
        polls,
        questions
    } = state['features/polls'];

    return {
        currentPoll,
        choices,
        polls,
        questions
    };
}

export default connect(_mapStateToProps)(PollDialog);
