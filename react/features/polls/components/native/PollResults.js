// @flow

import React from 'react';
import { View, SectionList, Text, FlatList } from 'react-native';

import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps } from '../AbstractPollResults';


/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = (props: AbstractProps) => {
    const {
        detailedVotes,
        displayQuestion,
        participants,
        pollDetails,
        totalVoters
    } = props;

    const answers = pollDetails.answers.map(answer => {

        const answerPercent = totalVoters === 0 ? 0 : Math.round(answer.voters.size / totalVoters * 100);

        const votersName = [ ...answer.voters ].map(voterId => {

            const participant = participants.find(part => part.id === voterId);

            const name: string = participant ? participant.name : 'Fellow Jitster';

            return name;
        });

        if (detailedVotes) {

            return (
                {
                    data: votersName,
                    title: `${answer.name} (${answerPercent} %)`
                }
            );
        }

        return (
            {
                key: `${answer.name} (${answerPercent} %)`
            }
        );
    });

    return (
        <View>
            {displayQuestion
                && <View>
                    <Text>{ pollDetails.question }</Text>
                </View>}
            <View>
                {detailedVotes
                    ? <SectionList
                        sections = { answers }
                        keyExtractor = { (item, index) => item + index }
                        renderItem = { ({ item }) => (
                            <View>
                                <Text>{item}</Text>
                            </View>
                        ) }
                        renderSectionHeader = { ({ section: { title } }) =>
                            <Text>{title}</Text>
                        } />
                    : <FlatList
                        data = { answers }
                        renderItem = { ({ item }) => <Text>{item.key}</Text> } />
                }
            </View>

        </View>
    );

};

export default AbstractPollResults(PollResults);
