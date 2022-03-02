// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { openLoginDialog, cancelWaitForOwner } from '../../actions.native';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The dialog is display in XMPP password + guest access configuration, after
 * user connects from anonymous domain and the conference does not exist yet.
 *
 * See {@link LoginDialog} description for more details.
 */
class WaitForOwnerDialog extends Component<Props> {
    /**
     * Initializes a new WaitForWonderDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                cancelLabel = 'dialog.Cancel'
                confirmLabel = 'dialog.IamHost'
                descriptionKey = 'dialog.WaitForHostMsg'
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin } />
        );
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelWaitForOwner());
    }

    _onLogin: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        this.props.dispatch(openLoginDialog());
    }
}

export default translate(connect()(WaitForOwnerDialog));
