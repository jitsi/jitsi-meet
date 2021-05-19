// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';

import PollResults from './PollResults';

type Props = {
    pollId: string,
};

/**
 * Component that renders the poll results dialog.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResultsDialog = (props: Props) => {
    const { pollId } = props;

    return (
        <Dialog
            hideCancelButton = { true }
            okKey = { 'polls.answer.close' }
            titleKey = { 'polls.answer.results' }
            width = { 'small' } >
            <div className = 'poll-dialog'>
                <PollResults
                    pollId = { pollId }
                    showDetails = { true } />
            </div>
        </Dialog>
    );
};

export default PollResultsDialog;
