import PropTypes from 'prop-types';
import { Component } from 'react';

import { hideDialog } from '../actions';
import { DIALOG_PROP_TYPES } from '../constants';

/**
 * An abstract implementation of a dialog on Web/React and mobile/react-native.
 */
export default class AbstractDialog extends Component {
    /**
     * <tt>AbstractDialog</tt> React <tt>Component</tt>'s prop types.
     *
     * @static
     */
    static propTypes = {
        ...DIALOG_PROP_TYPES,

        /**
         * The React <tt>Component</tt> children of <tt>AbstractDialog</tt>
         * which represents the dialog's body.
         */
        children: PropTypes.node,

        /**
         * Used to show/hide the dialog on cancel.
         */
        dispatch: PropTypes.func
    };

    /**
     * Initializes a new <tt>AbstractDialog</tt> instance.
     *
     * @param {Object} props - The read-only React <tt>Component</tt> props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Dispatches a redux action to hide this dialog when it's canceled.
     *
     * @protected
     * @returns {void}
     */
    _onCancel() {
        const { onCancel } = this.props;

        if (!onCancel || onCancel()) {
            this.props.dispatch(hideDialog());
        }
    }

    /**
     * Dispatches a redux action to hide this dialog when it's submitted.
     *
     * @private
     * @param {string} value - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value) {
        const { onSubmit } = this.props;

        if (!onSubmit || onSubmit(value)) {
            this.props.dispatch(hideDialog());
        }
    }
}
