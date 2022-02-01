// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { MOBILE_BREAKPOINT } from '../../constants';
import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles(theme => {
    return {
        list: {
            marginTop: `${theme.spacing(3)}px`
        },
        item: {
            height: `${theme.spacing(7)}px`,
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                height: `${theme.spacing(8)}px`
            }
        },
        avatar: {
            height: `${theme.spacing(5)}px`
        },
        expressions: {
            paddingLeft: 29
        },
        hasLeft: {
            color: theme.palette.text03
        },
        displayName: {
            ...theme.typography.bodyShortRegular,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeight}px`,
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                ...theme.typography.bodyShortRegularLarge,
                lineHeight: `${theme.typography.bodyShortRegular.lineHeightLarge}px`
            }
        },
        time: {
            padding: '2px 4px',
            borderRadius: '4px',
            ...theme.typography.labelBold,
            lineHeight: `${theme.typography.labelBold.lineHeight}px`,
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                ...theme.typography.bodyShortRegularLarge,
                lineHeight: `${theme.typography.bodyShortRegular.lineHeightLarge}px`
            }
        },
        dominant: {
            backgroundColor: theme.palette.success02
        }
    };
});

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStatsList = () => {
    const classes = useStyles();
    const items = abstractSpeakerStatsList(SpeakerStatsItem, classes);

    return (
        <div className = { classes.list }>
            {items}
        </div>
    );
};

export default SpeakerStatsList;
