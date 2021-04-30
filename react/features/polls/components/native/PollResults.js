// @flow

import React, { useCallback } from 'react';
import { View, SectionList, Text, FlatList } from 'react-native';

import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps } from '../AbstractPollResults';
import _DialogStyles from './styles';
import { ColorPalette } from '../../../base/styles';


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
    
    /**
     * Render a header summing up answer information
     *
     * @param {string} answerName - the name of the answer
     * @param {number} percent - the percentage of voters
     * @param {number} nbVotes - the number of collected votes
     * @returns 
     */
    const renderHeader = (answer: string, percentage: number, nbVotes: number) => {
        return (
            <View style = { _DialogStyles.answerHeader }>
                <Text>{ answer } - { percentage }%</Text>
                <Text style = { _DialogStyles.answerVoteCount }>
                    { t('polls.answer.vote', { count: nbVotes }) }
                </Text>
            </View>
        )
    }
    
    /**
     * Render voters of and answer
     * @param { name: string, voters: Set<string> } answer - the answer 
     * @param {*} participants - A list of participants (to fetch names)
     * @param {number} totalVoters - Total number of voters for this poll
     * @param {boolean} detailed - if true, display all voters, if false, display percent bars
     * @param {Function} t - translation function
     * @returns 
     */
    const renderRow = useCallback((answer: { name: string, percentage: number, voters: Array<{ id: number, name: string }>, voterCount: number }) => {
        const { name, percentage, voters, voterCount } = answer;
        if ( detailedVotes ) {
            return (
                <View style = { _DialogStyles.answerContainer }>
                    { renderHeader(name, percentage, voterCount) }
                    { voterCount > 0 &&
                    <View style = { _DialogStyles.voters }>
                        {voters.map(({ id, name }) => 
                            <Text key = { id }>{ name }</Text>
                        )}
                    </View>}
                </View>
            );
        } else {
            // else, we display a simple list
            // We add a progress bar by creating an empty view of width equal to percentage.
            return (
                <View style = { _DialogStyles.answerContainer }>
                    { renderHeader(answer.name, percentage, voterCount) }
                    <View style = { _DialogStyles.barContainer }>
                        <View style = {[ _DialogStyles.bar, { width: percentage + '%' } ]}/>
                    </View>
                </View>
            );
        }
    }, []);

    return (
        <View>
            {displayQuestion
                && <View>
                    <Text style = { _DialogStyles.question } > { question } </Text>
                </View>}
            <FlatList
                data = { answers }
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { answer => renderRow(answer.item) }
            />
        </View>
    );
};

export default AbstractPollResults(PollResults);
