import React, { Component } from 'react';

import { hideDialog } from '../actions';
import { DIALOG_PROP_TYPES } from '../constants';

/**
 * Abstract dialog to display dialogs.
 */
export default class AbstractDialog extends Component {

    /**
     * Abstract Dialog component's property types.
     *
     * @static
     */
    static propTypes = {
        ...DIALOG_PROP_TYPES,

        /**
         * Used to show/hide the dialog on cancel.
         */
        dispatch: React.PropTypes.func
    };

    /**
     * Initializes a new Dialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        let hide = true;

        if (this.props.onCancel) {
            hide = this.props.onCancel();
        }

        if (hide) {
            this.props.dispatch(hideDialog());
        }
    }

    /**
     * Dispatches the action when submitting the dialog.
     *
     * @private
     * @param {string} value - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value) {
        let hide = true;

        if (this.props.onSubmit) {
            hide = this.props.onSubmit(value);
        }

        if (hide) {
            this.props.dispatch(hideDialog());
        }
    }
}
