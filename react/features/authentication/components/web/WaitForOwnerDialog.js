// @flow

import React, { PureComponent } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { safeDecodeURIComponent } from '../../../base/util';
import { cancelWaitForOwner } from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
type Props = {

    /**
     * The name of the conference room (without the domain part).
     */
    _room: string,

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
        const cancelButton = document.getElementById('modal-dialog-cancel-button');

        if (cancelButton) {
            cancelButton.onclick = () => {
                dispatch(cancelWaitForOwner());
            };
        }

        return false;
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
            _room: room,
            t
        } = this.props;

        return (
            <Dialog
                hideCloseIconButton = { true }
                okKey = { t('dialog.IamHost') }
                onCancel = { this._onCancelWaitForOwner }
                onSubmit = { this._onIAmHost }
                titleKey = { t('dialog.WaitingForHostTitle') }
                width = { 'small' }>
                <span>
                    {
                        translateToHTML(
                            t, 'dialog.WaitForHostMsg', { room })
                    }
                </span>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code WaitForOwnerDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { authRequired } = state['features/base/conference'];

    return {
        _room: authRequired && safeDecodeURIComponent(authRequired.getName())
    };
}

export default translate(connect(mapStateToProps)(WaitForOwnerDialog));
