import React from 'react';
import { connect } from 'react-redux';

import AbstractDialog from './AbstractDialog';
import StatelessDialog from './StatelessDialog';

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class Dialog extends AbstractDialog {

    /**
     * Web dialog component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractDialog.propTypes,

        /**
         * This is the body of the dialog, the component children.
         */
        children: React.PropTypes.node,

        /**
         * Whether the dialog is modal. This means clicking on the blanket will
         * leave the dialog open. No cancel button.
         */
        isModal: React.PropTypes.bool,

        /**
         * Disables rendering of the submit button.
         */
        submitDisabled: React.PropTypes.bool,

        /**
         * Width of the dialog, can be:
         * - 'small' (400px), 'medium' (600px), 'large' (800px),
         * 'x-large' (968px)
         * - integer value for pixel width
         * - string value for percentage
         */
        width: React.PropTypes.string
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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const props = {
            ...this.props,
            onSubmit: this._onSubmit,
            onCancel: this._onCancel
        };

        delete props.dispatch;

        return <StatelessDialog { ...props } />;
    }

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (this.props.isModal) {
            return;
        }

        super._onCancel();
    }
}

export default connect()(Dialog);
