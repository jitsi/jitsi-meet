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

            // Command triggered when a new poll is received
            conference.addCommandListener(COMMAND_NEW_POLL, ({ attributes, children }) => {
                const poll = {
                    senderId: attributes.senderId,
                    answered: false,
                    question: attributes.question,
                    answers: children.map(answerData => {
                        return {
                            name: answerData.value,
                            voters: new Map()
                        };
                    })
                };

                const dialogComponent = store.getState()['features/base/dialog'].component;
                const queue = dialogComponent !== undefined;
                const pollId = parseInt(attributes.pollId, 10);

                store.dispatch(receivePoll(pollId, poll, queue));
            });

            // Command triggered when new answer is received
            conference.addCommandListener(COMMAND_ANSWER_POLL, ({ attributes, children }) => {
                const { dispatch } = store;
                const { senderId, voterName, pollId } = attributes;

                const receivedAnswer: Answer = {
                    senderId,
                    voterName,
                    pollId: parseInt(pollId, 10),
                    answers: children.map(

                            // Boolean are converted to text through XMPP
                            // We convert here the strings back to boolean
                            element => element.attributes.checked === 'true'
                    )
                };

                dispatch(receiveAnswer(pollId, receivedAnswer));
            });
        }
    }
);
