import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getParticipantDisplayName } from '../../../base/participants/functions';

/**
 * Props for the SubtitleMessage component.
 */
interface IProps {

    /**
     * Whether this is an interim subtitle (not yet finalized).
     */
    interim?: boolean;

    /**
     * The ID of the participant who sent the subtitle.
     */
    participant: string;

    /**
     * The text content of the subtitle.
     */
    text: string;

    /**
     * The timestamp when the subtitle was created.
     */
    timestamp: number;
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
export default function SubtitleMessage({ participant, text, timestamp, interim }: IProps) {
    const { classes } = useStyles();
    const participantName = useSelector((state: any) =>
        getParticipantDisplayName(state, participant));

    return (
        <div className = { `${classes.subtitleItem} ${interim ? classes.interim : ''}` }>
            <strong>{participantName}:</strong>
            <div>{text}</div>
            <small>
                {new Date(timestamp).toLocaleTimeString()}
            </small>
        </div>
    );
}
