// @flow

import React, { useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';

import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps, AnswerInfo } from '../AbstractPollResults';

import { dialogStyles, resultsStyles } from './styles';


/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = (props: AbstractProps) => {
    const {
        answers,
        detailedVotes,
        displayQuestion,
        question,
        t
    } = props;

    /* eslint-disable react/no-multi-comp */
    /**
     * Render a header summing up answer information.
     *
     * @param {string} answer - The name of the answer.
     * @param {number} percentage - The percentage of voters.
     * @param {number} nbVotes - The number of collected votes.
     * @returns {React.Node}
     */
    const renderHeader = (answer: string, percentage: number, nbVotes: number) => (
        <View style = { resultsStyles.answerHeader }>
            <Text>{ answer } - { percentage }%</Text>
            <Text style = { resultsStyles.answerVoteCount }>
                { t('polls.answer.vote', { count: nbVotes }) }
            </Text>
        </View>
    );

    /**
     * Render voters of and answer
     * @param {AnswerInfo} answer - the answer info
     * @returns {React.Node}
     */
    const renderRow = useCallback((answer: AnswerInfo) => {
        const { name, percentage, voters, voterCount } = answer;

        if (detailedVotes) {
            return (
                <View style = { resultsStyles.answerContainer }>
                    { renderHeader(name, percentage, voterCount) }
                    { voters && voterCount > 0
                    && <View style = { resultsStyles.voters }>
                        {voters.map(({ id, name: voterName }) =>
                            <Text key = { id }>{ voterName }</Text>
                        )}
                    </View>}
                </View>
            );
        }


        // else, we display a simple list
        // We add a progress bar by creating an empty view of width equal to percentage.
        return (
            <View style = { resultsStyles.answerContainer }>
                { renderHeader(answer.name, percentage, voterCount) }
                <View style = { resultsStyles.barContainer }>
                    <View style = { [ resultsStyles.bar, { width: `${percentage}%` } ] } />
                </View>
            </View>
        );

    }, []);

    /* eslint-disable react/jsx-no-bind */
    return (
        <View>
            {displayQuestion
                && <View>
                    <Text style = { dialogStyles.question } > { question } </Text>
                </View>}
            <FlatList
                data = { answers }
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { answer => renderRow(answer.item) } />
        </View>
    );
};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
