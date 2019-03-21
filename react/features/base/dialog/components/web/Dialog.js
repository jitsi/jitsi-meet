// @flow

import React from 'react';

import { connect } from '../../../redux';

import AbstractDialog from '../AbstractDialog';
import type { Props as AbstractDialogProps, State } from '../AbstractDialog';
import StatelessDialog from './StatelessDialog';

/**
 * The type of the React {@code Component} props of {@link Dialog}.
 */
type Props = AbstractDialogProps & {

    /**
     * Whether the dialog is modal. This means clicking on the blanket will
     * leave the dialog open. No cancel button.
     */
    isModal: boolean,

    /**
     * Disables rendering of the submit button.
     */
    submitDisabled: boolean,

    /**
     * Width of the dialog, can be:
     * - 'small' (400px), 'medium' (600px), 'large' (800px),
     * 'x-large' (968px)
     * - integer value for pixel width
     * - string value for percentage
     */
    width: string
};

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class Dialog extends AbstractDialog<Props, State> {
    /**
     * Initializes a new Dialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
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
            onCancel: this._onCancel,
            onSubmit: this._onSubmit
        };

        // $FlowExpectedError
        delete props.dispatch;

        return <StatelessDialog { ...props } />;
    }

    _onCancel: () => void;

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        this.props.isModal || super._onCancel();
    }

    _onSubmit: (?string) => void;
}

export default connect()(Dialog);
