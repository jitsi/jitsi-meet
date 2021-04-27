// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

import { AbstractPollCreateDialog } from '../AbstractPollCreateDialog';

type Props = {
    /**
     * The dialog submit callback (from AbstractPollCreateDialog)
     */
    onSubmit: Function,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * A dialog for creating polls
 */
const PollCreateDialog = ({onSubmit, t}: Props, ) => {
    return (
        <Dialog
            titleKey = 'polls.create.title'
            width = 'small'
            okKey = { t('polls.create.Send') }
            onSubmit = { onSubmit }>
            <p>Test</p>
        </Dialog>
    );
};

export default translate(AbstractPollCreateDialog(PollCreateDialog));
