// @flow

import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps, AnswerInfo } from '../AbstractPollResults';

import { chatStyles, dialogStyles, resultsStyles } from './styles';


/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = (props: AbstractProps) => {
    const {
        answers,
        changeVote,
        haveVoted,
        showDetails,
        question,
        t,
        toggleIsDetailed
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
            <Text style = { resultsStyles.answer }>{ answer }</Text>
            <View>
                <Text style = { resultsStyles.answer }>({nbVotes}) {percentage}%</Text>
            </View>

            {/* <Text style = { resultsStyles.answer }>{ answer } - { percentage }%</Text>
            <Text style = { resultsStyles.answerVoteCount }>
                { t('polls.answer.vote', { count: nbVotes }) }
            </Text> */}
        </View>
    );

    /**
     * Render voters of and answer.
     *
     * @param {AnswerInfo} answer - The answer info.
     * @returns {React.Node}
     */
    const renderRow = useCallback((answer: AnswerInfo) => {
        const { name, percentage, voters, voterCount } = answer;

        if (showDetails) {
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

    }, [ showDetails ]);

    /* eslint-disable react/jsx-no-bind */
    return (
        <View>
            <View>
                <Text style = { dialogStyles.question } >{ question }</Text>
            </View>
            <FlatList
                data = { answers }
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { answer => renderRow(answer.item) } />
            <View style = { chatStyles.bottomLinks }>
                <TouchableOpacity onPress = { toggleIsDetailed }>
                    <Text
                        style = { chatStyles.toggleText }>
                        {showDetails ? t('polls.results.hideDetailedResults') : t('polls.results.showDetailedResults')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress = { changeVote }>
                    <Text
                        style = { chatStyles.toggleText }>
                        {haveVoted ? t('polls.results.changeVote') : t('polls.results.vote')}
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
