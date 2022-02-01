// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { MOBILE_BREAKPOINT } from '../../constants';
import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles(theme => {
    return {
        list: {
            marginTop: 15
        },
        item: {
            height: 48,
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                height: 64,
                fontSize: 16,
                fontWeight: 400
            }
        },
        avatar: {
            height: 32
        },
        expressions: {
            paddingLeft: 29
        },
        hasLeft: {
            color: theme.palette.text03
        },
        displayName: {
            fontSize: 14,
            fontWeight: 400,
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                fontSize: 16
            }
        },
        time: {
            padding: '2px 4px',
            borderRadius: '4px',
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                fontSize: 16,
                fontWeight: 400
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
