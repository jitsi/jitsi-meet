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

const PollCreateDialog = ({ onSubmit, t }: Props) => (
    <Dialog
        okKey = { t('polls.create.Send') }
        onSubmit = { onSubmit }
        titleKey = 'polls.create.title'
        width = 'small'>
        <p>Test</p>
    </Dialog>
);

// eslint-disable-next-line new-cap
export default translate(AbstractPollCreateDialog(PollCreateDialog));
