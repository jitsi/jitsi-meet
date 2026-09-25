import React from 'react';
import { makeStyles } from 'tss-react/mui';

import AbstractPollResults, { AbstractProps } from '../AbstractPollResults';

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

    const handleKeyDown = React.useCallback((fn: Function): React.KeyboardEventHandler<HTMLButtonElement> =>
        (event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === 'Enter') {
                fn();
            }
        }, []);

    return (
        <div
            aria-labelledby = { `poll-question-${pollId}` }
            className = { classes.container }
            id = { `poll-${pollId}` }>
            <div className = { classes.header }>
                <h2
                    className = { classes.question }
                    id = { `poll-question-${pollId}` }>
                    {question}
                </h2>
                <p className = { classes.creator }>
                    {t('polls.by', { name: creatorName })}
                </p>
            </div>
            <ul
                aria-label = { question }
                className = { classes.resultList }>
                {answers.map(({ name, percentage, voters, voterCount }, index) =>
                    (<li key = { index }>
                        <p className = { classes.answerName }>
                            {name}
                        </p>
                        <div
                            aria-label = { name }
                            className = { classes.answerResultContainer }
                            id = { `poll-result-${pollId}-${index}` }
                            role = 'group'>
                            <div className = { classes.barContainer }>
                                <div
                                    aria-label = { name }
                                    aria-valuemax = { 100 }
                                    aria-valuemin = { 0 }
                                    aria-valuenow = { percentage }
                                    aria-valuetext = { t('polls.result.value', { percent: percentage }) }
                                    className = { classes.bar }
                                    role = 'progressbar'
                                    style = {{ width: `${percentage}%` }} />
                            </div>
                            <p
                                aria-hidden = 'true'
                                className = { classes.voteCount }>
                                {voterCount} ({percentage}%)
                            </p>
                        </div>
                        {showDetails && voters && voterCount > 0 && (
                            <div aria-label = { `Voters for ${name}` }>
                                <ul className = { classes.voters }>
                                    { voters.map(voter => (
                                        <li key = { voter.id }>{ voter.name }</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>)
                )}
            </ul>
            <div className = { classes.buttonsContainer }>
                <button
                    onClick = { toggleIsDetailed }
                    onKeyDown = { handleKeyDown(toggleIsDetailed) }>
                    {showDetails ? t('polls.results.hideDetailedResults') : t('polls.results.showDetailedResults')}
                </button>
                <button
                    onClick = { changeVote }
                    onKeyDown = { handleKeyDown(changeVote) }>
                    {haveVoted ? t('polls.results.changeVote') : t('polls.results.vote')}
                </button>
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
