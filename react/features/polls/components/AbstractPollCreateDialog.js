// @flow

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { COMMAND_NEW_POLL } from '../constants';

export const AbstractPollCreateDialog = Component => props => {
    const conference = useSelector(state => state['features/base/conference'].conference);

    const onSubmit = useCallback(() => {
        conference.sendCommandOnce(COMMAND_NEW_POLL, {
            attributes: {
                id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
                sender: conference.myUserId(),
                title: 'Example poll'
            },
            children: [
                { tagName: 'answer',
                    value: 'Answer 1' },
                { tagName: 'answer',
                    value: 'Answer 2' },
                { tagName: 'answer',
                    value: 'Answer 3' }
            ]
        });

        return true;
    }, [ conference ]);

    return (<Component
        { ...props }
        onSubmit = { onSubmit } />);
};
