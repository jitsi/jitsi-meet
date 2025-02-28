import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { ISubtitle } from '../../../subtitles/types';

import SubtitleMessage from './SubtitleMessage';

/**
 * Props for the SubtitlesGroup component.
 */
interface IProps {

    /**
     * Array of subtitle messages to be displayed in this group.
     */
    messages: ISubtitle[];

    /**
     * The ID of the participant who sent these subtitles.
     */
    senderId: string;
}

const useStyles = makeStyles()(theme => {
    return {
        groupContainer: {
            display: 'flex',
            marginBottom: theme.spacing(3)
        },

        avatar: {
            marginRight: theme.spacing(2),
            alignSelf: 'flex-start'
        },

        messagesContainer: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            maxWidth: 'calc(100% - 56px)', // 40px avatar + 16px margin
            gap: theme.spacing(1)
        }
    };
});

/**
 * Component that renders a group of subtitle messages from the same sender.
 *
 * @param {IProps} props - The props for the component.
 * @returns {JSX.Element} - A React component rendering a group of subtitles.
 */
export function SubtitlesGroup({ messages, senderId }: IProps) {
    const { classes } = useStyles();

    if (!messages.length) {
        return null;
    }

    return (
        <div className = { classes.groupContainer }>
            <Avatar
                className = { classes.avatar }
                participantId = { senderId }
                size = { 32 } />
            <div className = { classes.messagesContainer }>
                {messages.map((message, index) => (
                    <SubtitleMessage
                        key = { `${message.timestamp}-${message.id}` }
                        showDisplayName = { index === 0 }
                        { ...message } />
                ))}
            </div>
        </div>
    );
}
