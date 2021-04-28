// @flow

import { getCurrentConference } from '../base/conference';
import { StateListenerRegistry } from '../base/redux';

import { receiveAnswer, receivePoll } from './actions';
import { COMMAND_NEW_POLL, COMMAND_ANSWER_POLL } from './constants';
import type { Answer } from './types';

StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(COMMAND_NEW_POLL, ({ attributes, children }) => {
                const poll = {
                    senderId: attributes.senderId,
                    question: attributes.question,
                    answers: children.map(answerData => {
                        return {
                            name: answerData.value,
                            voters: new Set()
                        };
                    })
                };

                store.dispatch(receivePoll(attributes.pollId, poll));
            });

            conference.addCommandListener(COMMAND_ANSWER_POLL, ({ attributes, children }) => {
                const { dispatch } = store;
                const { senderId, pollId } = attributes;

                const receivedAnswer: Answer = {
                    senderId,
                    pollId,
                    answers: children.map(
                            element => element.attributes.checked === 'true'
                    )
                };

                dispatch(receiveAnswer(pollId, receivedAnswer));
            });
        }
    }
);
