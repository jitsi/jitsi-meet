import clsx from 'clsx';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { getFormattedTimestamp } from '../../functions';
import { IMessage } from '../../types';

import ChatMessage from './ChatMessage';

interface IProps {

    /**
     * Additional CSS classes to apply to the root element.
     */
    className: string;

    /**
     * The messages to display as a group.
     */
    messages: Array<IMessage>;
}

const useStyles = makeStyles()(theme => {
    return {
        messageGroup: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            flex: 1
        },

        groupContainer: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: '16px',

            '&.local': {
                alignItems: 'flex-end',

                '& $headerRow': {
                    flexDirection: 'row-reverse'
                }
            }
        },

        headerRow: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing(1),
            gap: theme.spacing(1)
        },

        avatar: {
            flexShrink: 0
        },

        timestamp: {
            ...theme.typography.labelRegular,
            color: theme.palette.text03,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontSize: '0.75rem'
        }
    };
});


const ChatMessageGroup = ({ className = '', messages }: IProps) => {
    const { classes } = useStyles();
    const messagesLength = messages.length;

    if (!messagesLength) {
        return null;
    }

    return (
        <div className={clsx(classes.groupContainer, className)}>
            <div className={classes.headerRow}>
                <Avatar
                    className={clsx(classes.avatar, "avatar")}
                    participantId={messages[0].participantId}
                    size={32}
                />
                <div className="text-xs font-semibold text-[#A6A6A6]">
                    {getFormattedTimestamp(messages[messages.length - 1])}
                </div>
            </div>
            <div className={`${classes.messageGroup} chat-message-group ${className}`}>
                {messages.map((message, i) => (
                    <ChatMessage
                        className={className}
                        key={i}
                        message={message}
                        showDisplayName={i === 0}
                        showTimestamp={false}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatMessageGroup;
