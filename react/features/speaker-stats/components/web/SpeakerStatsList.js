// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles(() => {
    return {
        list: {
            marginTop: 15
        }
    };
});

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStatsList = () => {
    const items = abstractSpeakerStatsList(SpeakerStatsItem);
    const classes = useStyles();

    return (
        <div className = { classes.list }>
            {items}
        </div>
    );
};


export default SpeakerStatsList;
