import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractPollResults, { AbstractProps, AnswerInfo } from '../AbstractPollResults';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: '24px',
            padding: '16px',
            backgroundColor: theme.palette.pollsBackground,
            borderRadius: '8px',
            wordBreak: 'break-word'
        },
        header: {
            marginBottom: '16px'
        },
        question: {
            ...theme.typography.heading6,
            color: theme.palette.pollsQuestion,
            marginBottom: '8px'
        },
        creator: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.pollsSubtitle
        },
        resultList: {
            listStyleType: 'none',
            margin: 0,
            padding: 0,

            '& li': {
                marginBottom: '16px'
            }
        },
        answerName: {
            display: 'flex',
            flexShrink: 1,
            overflowWrap: 'anywhere',
            ...theme.typography.bodyShortRegular,
            color: theme.palette.pollsAnswer,
            marginBottom: '4px'
        },
        answerResultContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '10em'
        },
        barContainer: {
            backgroundColor: theme.palette.pollsBarBackground,
            borderRadius: '4px',
            height: '6px',
            maxWidth: '160px',
            width: '158px',
            flexGrow: 1,
            marginTop: '2px'
        },
        bar: {
            height: '6px',
            borderRadius: '4px',
            backgroundColor: theme.palette.action01
        },
        voteCount: {
            flex: 1,
            textAlign: 'right',
            ...theme.typography.bodyShortBold,
            color: theme.palette.pollsBarPercentage
        },
        voters: {
            margin: 0,
            marginTop: '4px',
            listStyleType: 'none',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.pollsVotersBackground,
            borderRadius: theme.shape.borderRadius,
            padding: '8px 16px',

            '& li': {
                ...theme.typography.bodyShortRegular,
                color: theme.palette.pollsVotersText,
                margin: 0,
                marginBottom: '2px',

                '&:last-of-type': {
                    marginBottom: 0
                }
            }
        },
        buttonsContainer: {
            display: 'flex',
            justifyContent: 'space-between',

            '& button': {
                border: 0,
                backgroundColor: 'transparent',
                ...theme.typography.bodyShortRegular,
                color: theme.palette.link01
            }
        }
    };
});

/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = ({
    answers,
    changeVote,
    creatorName,
    haveVoted,
    pollId,
    showDetails,
    question,
    t,
    toggleIsDetailed
}: AbstractProps) => {
    const { classes } = useStyles();
    const exportResults = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const csvRows: string[] = [];

        csvRows.push(`"Question:","${question}"`);
        csvRows.push(`"Created By:","${creatorName}"`);
        csvRows.push('');

        const headers: string[] = [ 'Option', 'Voter Count', 'Valid Voters (with email)', 'Other Voters' ];

        csvRows.push(headers.map(h => `"${h}"`).join(','));

        answers.forEach((answer: AnswerInfo) => {
            const validVoters = answer.voters
                ?.filter(voter => voter.email)
                .map(voter => `${voter.name} (${voter.email})`)
                .join('; ') || '';

            const otherVoters = answer.voters
                ?.filter(voter => !voter.email)
                .map(voter => voter.name)
                .join('; ') || '';

            const row = [
                `"${answer.name}"`,
                answer.voterCount.toString(),
                `"${validVoters}"`,
                `"${otherVoters}"`
            ];

            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([ csvContent ], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');


        link.href = url;
        link.setAttribute('download', `poll-results-${pollId}.csv`);
        link.click();
        window.URL.revokeObjectURL(url);
    }, [ answers, question, creatorName, pollId ]);

    const isModerator = useSelector(isLocalParticipantModerator);

    return (
        <div
            className = { classes.container }
            id = { `poll-${pollId}` }>
            <div className = { classes.header }>
                <div className = { classes.question }>
                    {question}
                </div>
                <div className = { classes.creator }>
                    {t('polls.by', { name: creatorName })}
                </div>
            </div>
            <ul className = { classes.resultList }>
                {answers.map(({ name, percentage, voters, voterCount }, index) =>
                    (<li key = { index }>
                        <div className = { classes.answerName }>
                            {name}
                        </div>
                        <div
                            className = { classes.answerResultContainer }
                            id = { `poll-result-${pollId}-${index}` }>
                            <span className = { classes.barContainer }>
                                <div
                                    className = { classes.bar }
                                    style = {{ width: `${percentage}%` }} />
                            </span>
                            <div className = { classes.voteCount }>
                                {voterCount} ({percentage}%)
                            </div>
                        </div>
                        {showDetails && voters && voterCount > 0
                        && <ul className = { classes.voters }>
                            {voters.map(voter =>
                                <li key = { voter.id }>{voter.name}</li>
                            )}
                        </ul>}
                    </li>)
                )}
            </ul>
            <div className = { classes.buttonsContainer }>
                <button onClick = { toggleIsDetailed }>
                    {showDetails
                        ? t('polls.results.hideDetailedResults')
                        : t('polls.results.showDetailedResults')}
                </button>

                <button onClick = { changeVote }>
                    {haveVoted
                        ? t('polls.results.changeVote')
                        : t('polls.results.vote')}
                </button>

                {isModerator && (
                    <button
                        onClick = { exportResults }
                        type = 'button'>
                        {t('polls.results.exportResults')}
                    </button>
                )}
            </div>
        </div>
    );
};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
