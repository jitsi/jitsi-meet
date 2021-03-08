// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { openLoginDialog } from '../../actions.web';

type Props = {

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The name of the conference room (without the domain part).
     */
    room: string,

    /**
     * Function to be invoked after click.
     */
    onAuthNow: ?Function,

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string, params: Object },
}

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends Component<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        console.log('Cancel');
    }

    _onLogin: () => void;

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const { onAuthNow, dispatch } = this.props;

        onAuthNow && onAuthNow();
        dispatch(openLoginDialog());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            t,
            contentKey
        } = this.props;

        const content
            = typeof contentKey === 'string'
                ? t(contentKey)
                : t(contentKey.key, contentKey.params);

        return (
            <Dialog
                okKey = { t('dialog.IamHost') }
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin }
                width = { 'small' }>
                <span>
                    { content }
                </span>
            </Dialog>
        );
    }
}

export default translate(connect()(WaitForOwnerDialog));
