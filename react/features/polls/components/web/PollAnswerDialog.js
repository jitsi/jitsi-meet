// @flow

import * as React from 'react';
import { useState } from 'react';
import { Checkbox } from '@atlaskit/checkbox';
import { Dialog } from '../../../base/dialog';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { Poll, Answer} from "../../types";
import { ANSWER_POLL_COMMAND } from '../../constants';


type Props = {
    conference: any,
    poll: Poll,
    localId: String,
    dispatch: any
}

export const example_poll: Poll = {
    id: 42,
    sender: "314159",
    title: "Question??",
    // options: { multiple: false},
    answers: [
        {name: "A", voters: new Set(["alpha", "beta", "gamma"])},
        {name: "B", voters: new Set(["mu", "nu", "xi"])},
        {name: "Maybe C", voters: new Set(["alpha", "beta", "mu"])},
        {name: "D", voters: new Set(["alpha", "beta", "gamma"])},
        {name: "E", voters: new Set(["mu", "nu", "xi"])},
        {name: "F", voters: new Set(["alpha", "beta", "gamma"])},
        {name: "G", voters: new Set(["mu", "nu", "xi"])},
        {name: "H", voters: new Set(["alpha", "beta", "gamma"])},
        {name: "I", voters: new Set(["mu", "nu", "xi"])},
    ],
    messageIdx: 12345
};


function AnswerPoll(props: Props): React.Node {

    const { poll, localId, conference, dispatch } = props;

    const [checkBoxStates, setCheckBoxState] = useState(new Array(poll.answers.length).fill(false));

    return ( 
        <Dialog
            width = 'small'
            className = 'poll-answers default-scrollbar'
            cancelKey = { 'dialog.close' }
            submitDisabled = { false }
            titleKey = "Poll"
            onSubmit = {() => {

                let answer_data = {
                    attributes: {
                        pollId: poll.id,
                        senderId: localId
                    },
                    children: checkBoxStates.map(
                        (checkBoxState) => {
                            return {
                                tagName: "answer",
                                attributes: {checked: checkBoxState
                            }}
                        })
                };


                conference.sendCommandOnce(
                    ANSWER_POLL_COMMAND,
                    answer_data
                    );
                return true;
            }}
            >


            <div>
                <h1 className="poll-answers">{poll.title}</h1>
                {
                poll.answers.map((answer, index) => {
                    return (
                        <Checkbox
                            key = {index}
                            label={
                                <label className="poll-answers"> {answer.name}</label>
                            }
                            size="xlarge"
                            name="checkbox-poll-answer"
                            onChange={() => {
                                // we toggle the matching checkBox State
                                let newCheckBoxStates = [...checkBoxStates];
                                newCheckBoxStates[index] = !newCheckBoxStates[index];
                                setCheckBoxState(newCheckBoxStates);
                            }
                            }
                        />
                    )
                })
                }
            </div>
        </Dialog>
    );
}

function _mapStateToProps(state: Object) {
    const {conference} = state['features/base/conference'];
    return {
        conference: conference,
        localId: getLocalParticipant(state).id
    };
}

export default connect(_mapStateToProps)(AnswerPoll)