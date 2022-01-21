// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles(theme => {
    return {
        list: {
            marginTop: 15
        },
        item: {
            height: 48
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
        time: {
            padding: '2px 4px',
            borderRadius: '4px'
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
