// @flow

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { receivePoll } from './actions';
import { COMMAND_NEW_POLL, COMMAND_ANSWER_POLL } from './constants';
import { Answer } from './types';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    }

    return next(action);
});


StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(COMMAND_NEW_POLL, ({ attributes, children }) => {
                const poll = {
                    sender: attributes.sender,
                    title: attributes.title,
                    answers: children.map(answerData => {
                        return {
                            name: answerData.value,
                            voters: new Set()
                        };
                    })
                };

                store.dispatch(receivePoll(attributes.id, poll));
            });
            conference.addCommandListener(COMMAND_ANSWER_POLL,
                ({ attributes, children }) => {
                    const { dispatch, getState } = store;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const { senderId, pollId } = attributes;

                    const receveid_answer: Answer = {
                        sender: senderId,
                        pollId,
                        answers: children.map(
                            element => element.attributes.checked
                        )
                    };

                    console.log('reformed answer', receveid_answer);


                    if (localParticipantId == senderId) {
                        console.log('StateListenerRegistry I just received my own poll:');
                    } else {
                        console.log('StateListenerRegistry I received a poll from someone else');

                        // dispatch(receivePoll({senderId: sender_id}));
                    }
                });
        }
    }
);
