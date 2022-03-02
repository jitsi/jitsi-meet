// @flow

import React, { PureComponent } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { cancelWaitForOwner } from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after click.
     */
    onAuthNow: ?Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onCancelWaitForOwner = this._onCancelWaitForOwner.bind(this);
        this._onIAmHost = this._onIAmHost.bind(this);
    }

    _onCancelWaitForOwner: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelWaitForOwner() {
        const { dispatch } = this.props;

        dispatch(cancelWaitForOwner());
    }

    _onIAmHost: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onIAmHost() {
        const { onAuthNow } = this.props;

        onAuthNow && onAuthNow();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            t
        } = this.props;

        return (
            <Dialog
                disableBlanketClickDismiss = { true }
                hideCloseIconButton = { true }
                okKey = { t('dialog.IamHost') }
                onCancel = { this._onCancelWaitForOwner }
                onSubmit = { this._onIAmHost }
                titleKey = { t('dialog.WaitingForHostTitle') }
                width = { 'small' }>
                <span>
                    { t('dialog.WaitForHostMsg') }
                </span>
            </Dialog>
        );
    }
}

export default translate(connect()(WaitForOwnerDialog));
