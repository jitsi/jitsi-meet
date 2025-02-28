import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import SubtitleMessage from './SubtitleMessage';

/**
 * The styles for the SubtitlesTab component.
 */
const useStyles = makeStyles()(() => {
    return {
        subtitlesList: {
            padding: '16px',
            flex: 1,
            overflowY: 'auto',
            height: '100%'
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
    const subtitles = useSelector(state => state['features/subtitles'].subtitlesHistory);

    return (
        <div className = { classes.subtitlesList }>
            {subtitles.map((subtitle, index) => (
                <SubtitleMessage
                    key = { index }
                    { ...subtitle } />
            ))}
        </div>
    );
}
