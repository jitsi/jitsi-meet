// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';

import PollResults from './PollResults';

type Props = {
    pollId: number,
};

const PollResultDialog = (props: Props) => {
    const { pollId } = props;

    return (
        <Dialog
            cancelDisabled = { true }
            okKey = { 'polls.answer.close' }
            titleKey = { 'polls.answer.results' }
            width = { 'small' } >
            <div className = 'poll-dialog'>
                <PollResults
                    detailedVotes = { true }
                    displayQuestion = { true }
                    pollId = { pollId } />
            </div>
        </Dialog>
    );
};

export default PollResultDialog;
