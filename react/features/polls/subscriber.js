// @flow

import { StateListenerRegistry } from '../base/redux';
import { getCurrentConference } from '../base/conference';
import { COMMAND_NEW_POLL, COMMAND_ANSWER_POLL } from './constants';

import { receiveAnswer, receivePoll } from './actions';
import type { Answer } from './types';

StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(COMMAND_NEW_POLL, ({ attributes, children }) => {
                const poll = {
                    sender: attributes.sender,
                    title: attributes.title,
                    answers: children.map(answerData => ({
                        name: answerData.value,
                        voters: new Set(),
                    })),
                };
                store.dispatch(receivePoll(attributes.pollId, poll));
            });

            conference.addCommandListener(COMMAND_ANSWER_POLL, ({ attributes, children }) => {
                    const { dispatch } = store;
                    const {senderId, pollId} = attributes;

                    let receveid_answer: Answer = {
                        sender: senderId,
                        pollId : pollId,
                        answers : children.map(
                            (element) => {
                                return element.attributes.checked
                            }
                        )
                    }

                    store.dispatch(receiveAnswer(pollId, receveid_answer));
            });
        }
    }
);
