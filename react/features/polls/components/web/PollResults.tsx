import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import AbstractPollResults, { AbstractProps } from '../AbstractPollResults';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: '24px',
            padding: '16px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '8px',
            wordBreak: 'break-word'
        },
        header: {
            marginBottom: '16px'
        },
        question: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: theme.palette.text01,
            marginBottom: '8px'
        },
        creator: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text02
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
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            marginBottom: '4px'
        },
        answerResultContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '10em'
        },
        barContainer: {
            backgroundColor: theme.palette.ui03,
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
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.text01
        },
        voters: {
            margin: 0,
            marginTop: '4px',
            listStyleType: 'none',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            padding: '8px 16px',

            '& li': {
                ...withPixelLineHeight(theme.typography.bodyShortRegular),
                color: theme.palette.text01,
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
                ...withPixelLineHeight(theme.typography.bodyShortRegular),
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
    showDetails,
    question,
    t,
    toggleIsDetailed
}: AbstractProps) => {
    const { classes } = useStyles();

    return (
        <div className = { classes.container }>
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
                        <div className = { classes.answerResultContainer }>
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
                                <li key = { voter?.id }>{voter?.name}</li>
                            )}
                        </ul>}
                    </li>)
                )}
            </ul>
            <div className = { classes.buttonsContainer }>
                <button
                    onClick = { toggleIsDetailed }>
                    {showDetails ? t('polls.results.hideDetailedResults') : t('polls.results.showDetailedResults')}
                </button>
                <button
                    onClick = { changeVote }>
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
