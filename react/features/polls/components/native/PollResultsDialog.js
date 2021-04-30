// @flow

import React from 'react';

import { CustomSubmitDialog } from '../../../base/dialog';

import PollResults from './PollResults';

type Props = {
    pollId: number,
};

const PollResultDialog = (props: Props) => {
    const { pollId } = props;

    return (
        <CustomSubmitDialog
            okKey = 'polls.answer.close'
            titleKey = 'polls.answer.results'>
            <PollResults
                detailedVotes = { true }
                displayQuestion = { true }
                pollId = { pollId } />

        </CustomSubmitDialog>
    );
};

export default PollResultDialog;
