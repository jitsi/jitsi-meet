// @flow

import React from 'react';
import Dialog from 'react-native-dialog';

import { InputDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractDisplayNamePrompt,
{ type Props } from '../AbstractDisplayNamePrompt';

/**
 * Implements a component to render a display name prompt.
 */
class DisplayNamePrompt extends AbstractDisplayNamePrompt<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <InputDialog
                onSubmit = { this._onSetDisplayName }
                titleKey = 'dialog.displayNameRequired'>
                <Dialog.Description>
                    { t('dialog.enterDisplayName') }
                </Dialog.Description>
            </InputDialog>
        );
    }

    _onSetDisplayName: string => boolean;
}

export default translate(connect()(DisplayNamePrompt));
