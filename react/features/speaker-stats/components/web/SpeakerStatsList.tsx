/* eslint-disable lines-around-comment */
import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { MOBILE_BREAKPOINT } from '../../constants';
// @ts-ignore
import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

// @ts-ignore
import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles()(theme => {
    return {
        list: {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(3)
        },
        item: {
            height: theme.spacing(7),
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                height: theme.spacing(8)
            }
        },
        avatar: {
            height: theme.spacing(5)
        },
        expressions: {
            paddingLeft: 29
        },
        hasLeft: {
            color: theme.palette.text03
        },
        displayName: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            }
        },
        time: {
            padding: '2px 4px',
            borderRadius: '4px',
            ...withPixelLineHeight(theme.typography.labelBold),
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
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
    const { classes } = useStyles();
    const items = abstractSpeakerStatsList(SpeakerStatsItem, classes);

    return (
        <div className = { classes.list }>
            {items}
        </div>
    );
};

export default SpeakerStatsList;
