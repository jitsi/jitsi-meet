import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getParticipantDisplayName } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
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
        messageContainer: {
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px 12px 12px 12px',
            padding: '12px',
            maxWidth: '100%',
            marginTop: '4px',
            boxSizing: 'border-box',
            display: 'inline-flex'
        },

        messageContent: {
            maxWidth: '100%',
            overflow: 'hidden',
            flex: 1
        },

        messageHeader: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text02,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            marginBottom: theme.spacing(1),
            maxWidth: '130px'
        },

        messageText: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
        },

        timestamp: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text03,
            marginTop: theme.spacing(1)
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
        <div className = { `${classes.messageContainer} ${interim ? classes.interim : ''}` }>
            <div className = { classes.messageContent }>
                {showDisplayName && (
                    <div className = { classes.messageHeader }>
                        {participantName}
                    </div>
                )}
                <div className = { classes.messageText }>{text}</div>
                <div className = { classes.timestamp }>
                    {new Date(timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}
