import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { groupMessagesBySender } from '../../../base/util/messageGrouping';
import { ISubtitle } from '../../../subtitles/types';

import { SubtitlesGroup } from './SubtitlesGroup';

/**
 * The styles for the SubtitlesTab component.
 */
const useStyles = makeStyles()(theme => {
    return {
        subtitlesList: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
            flex: 1,
            boxSizing: 'border-box',
            color: theme.palette.text01
        }
    };
});

/**
 * Component that displays the subtitles history in a scrollable list.
 *
 * @returns {JSX.Element} - The SubtitlesTab component.
 */
export default function SubtitlesTab() {
    const { classes } = useStyles();
    const subtitles: ISubtitle[] = useSelector(state => state['features/subtitles'].subtitlesHistory);
    const groupedSubtitles = useMemo(() => groupMessagesBySender(subtitles), [ subtitles ]);

    return (
        <div className = { classes.subtitlesList }>
            {groupedSubtitles.map(group => (
                <SubtitlesGroup
                    key = { `${group.senderId}-${group.messages[0].timestamp}` }
                    messages = { group.messages }
                    senderId = { group.senderId } />
            ))}
        </div>
    );
}
