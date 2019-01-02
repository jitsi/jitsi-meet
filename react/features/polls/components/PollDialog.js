// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DialogWithTabs, hideDialog } from '../../base/dialog';
import PollCreateForm from './PollCreateForm';
import VoteForm from './VoteForm';
import PollResultsForm from './PollResultsForm';
import { translate } from '../../base/i18n';

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
    t: Function
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
        const { isPollRunning } = this.props;
        const tabs = isPollRunning ? [ {
            component: VoteForm,
            label: 'polls.vote',
            props: {},
            submit: null
        } ] : [ {
            component: PollCreateForm,
            label: 'polls.create',
            props: {},
            submit: null
        } ];

        tabs.push({
            component: PollResultsForm,
            label: 'polls.results',
            props: {},
            submit: this._onSubmit
        });

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = { 'polls-dialog' }
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
    const { currentPoll } = state['features/polls'];

    return {
        isPollRunning: currentPoll !== null
    };
}

export default translate(connect(_mapStateToProps)(PollDialog));
