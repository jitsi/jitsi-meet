import React, { useCallback } from 'react';
import { FlatList, Text, TextStyle, View, ViewStyle } from 'react-native';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps, AnswerInfo } from '../AbstractPollResults';

import { dialogStyles, pollsStyles, resultsStyles } from './styles';

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
        creatorName,
        haveVoted,
        question,
        showDetails,
        t,
        toggleIsDetailed
    } = props;

    /**
     * Render a header summing up answer information.
     *
     * @param {string} answer - The name of the answer.
     * @param {number} percentage - The percentage of voters.
     * @param {number} nbVotes - The number of collected votes.
     * @returns {React.Node}
     */
    const renderHeader = (answer: string, percentage: number, nbVotes: number) => (
        <View style = { resultsStyles.answerHeader as ViewStyle }>
            <Text style = { resultsStyles.answer as TextStyle }>{ answer }</Text>
            <View>
                <Text style = { resultsStyles.answer as TextStyle }>({nbVotes}) {percentage}%</Text>
            </View>
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
                <View style = { resultsStyles.answerContainer as ViewStyle }>
                    { renderHeader(name, percentage, voterCount) }
                    <View style = { resultsStyles.barContainer as ViewStyle }>
                        <View style = { [ resultsStyles.bar, { width: `${percentage}%` } ] as ViewStyle[] } />
                    </View>
                    { voters && voterCount > 0
                        && <View style = { resultsStyles.voters as ViewStyle }>
                            {/* @ts-ignore */}
                            {voters.map(({ id, name: voterName }) =>
                                (<Text
                                    key = { id }
                                    style = { resultsStyles.voter as TextStyle }>
                                    { voterName }
                                </Text>)
                            )}
                        </View>}
                </View>
            );
        }


        // else, we display a simple list
        // We add a progress bar by creating an empty view of width equal to percentage.
        return (
            <View style = { resultsStyles.answerContainer as ViewStyle }>
                { renderHeader(answer.name, percentage, voterCount) }
                <View style = { resultsStyles.barContainer as ViewStyle }>
                    <View style = { [ resultsStyles.bar, { width: `${percentage}%` } ] as ViewStyle[] } />
                </View>
            </View>
        );

    }, [ showDetails ]);


    /* eslint-disable react/jsx-no-bind */
    return (
        <View>
            <Text
                id = 'question-text'
                style = { dialogStyles.questionText as TextStyle } >{ question }</Text>
            <Text
                id = 'poll-owner-text'
                style = { dialogStyles.questionOwnerText as TextStyle } >
                { t('polls.by', { name: creatorName }) }
            </Text>
            <FlatList
                data = { answers }
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { answer => renderRow(answer.item) } />
            <View style = { pollsStyles.bottomLinks as ViewStyle }>
                <Button
                    id = {
                        showDetails
                            ? t('polls.results.hideDetailedResults')
                            : t('polls.results.showDetailedResults')
                    }
                    labelKey = {
                        showDetails
                            ? 'polls.results.hideDetailedResults'
                            : 'polls.results.showDetailedResults'
                    }
                    labelStyle = { pollsStyles.toggleText }
                    onClick = { toggleIsDetailed }
                    type = { BUTTON_TYPES.TERTIARY } />
                <Button
                    id = {
                        haveVoted
                            ? t('polls.results.changeVote')
                            : t('polls.results.vote')
                    }
                    labelKey = {
                        haveVoted
                            ? 'polls.results.changeVote'
                            : 'polls.results.vote'
                    }
                    labelStyle = { pollsStyles.toggleText }
                    onClick = { changeVote }
                    type = { BUTTON_TYPES.TERTIARY } />
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
