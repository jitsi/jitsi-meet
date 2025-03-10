import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getParticipantDisplayName } from '../../../base/participants/functions';
import { ISubtitle } from '../../../subtitles/types';

/**
 * Props for the SubtitleMessage component.
 */
interface IProps extends ISubtitle {

    /**
     * Whether to show the display name of the participant.
     */
    showDisplayName: boolean;
}

/**
 * The styles for the SubtitleMessage component.
 */
const useStyles = makeStyles()(theme => {
    return {
        subtitleItem: {
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px'
        },
        interim: {
            opacity: 0.7
        }
    };
});

/**
 * Component that renders a single subtitle message with the participant's name,
 * message content, and timestamp.
 *
 * @param {IProps} props - The component props.
 * @returns {JSX.Element} - The rendered subtitle message.
 */
export default function SubtitleMessage({ participantId, text, timestamp, interim, showDisplayName }: IProps) {
    const { classes } = useStyles();
    const participantName = useSelector((state: any) =>
        getParticipantDisplayName(state, participantId));

    return (
        <div className = { `${classes.subtitleItem} ${interim ? classes.interim : ''}` }>
            {showDisplayName && <strong>{participantName}:</strong>}
            <div>{text}</div>
            <small>
                {new Date(timestamp).toLocaleTimeString()}
            </small>
        </div>
    );
}
