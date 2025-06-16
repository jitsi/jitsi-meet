import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { MOBILE_BREAKPOINT } from '../../constants';
import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

const useStyles = makeStyles()(theme => {
    return {
        list: {
            paddingTop: 90,
            '& .item': {
                height: theme.spacing(7),
                [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                    height: theme.spacing(8)
                },
                '& .has-left': {
                    color: theme.palette.text03
                },
                '& .avatar': {
                    marginRight: theme.spacing(3)
                },
                '& .time': {
                    padding: '2px 4px',
                    borderRadius: '4px',
                    ...withPixelLineHeight(theme.typography.labelBold),
                    [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                        ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
                    },
                    backgroundColor: theme.palette.ui02
                },
                '& .display-name': {
                    ...withPixelLineHeight(theme.typography.bodyShortRegular),
                    [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                        ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
                    }
                },
                '& .dominant': {
                    backgroundColor: theme.palette.success02
                }
            }

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
    const items = abstractSpeakerStatsList(SpeakerStatsItem);

    return (
        <div className = { classes.list }>
            <div className = 'separator' />
            {items}
        </div>
    );
};

export default SpeakerStatsList;
