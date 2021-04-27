// @flow

import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { getCurrentConference } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import { ANSWER_POLL_COMMAND } from './constants';
import { Answer} from './types';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    }
    
    return next(action);
});


StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener( ANSWER_POLL_COMMAND,
                ({ attributes, children }) => { //FOLLOW_ME_COMMAND
                    const { dispatch, getState } = store;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const {senderId, pollId} = attributes;

                    let receveid_answer: Answer = {
                        sender:senderId,
                        pollId : pollId,
                        answers : children.map(
                            (element) => {
                                return element.attributes.checked
                            }
                        )
                    }

                    console.log("reformed answer", receveid_answer); 


                    if (localParticipantId == senderId) {
                        console.log("StateListenerRegistry I just received my own poll:");
                    } else {
                        console.log("StateListenerRegistry I received a poll from someone else");
                        //dispatch(receivePoll({senderId: sender_id}));
                    }
            });
        }
    }
);