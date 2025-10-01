import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { IParticipant } from '../../../base/participants/types';
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

    /**
     * The participant list from redux.
     */
    participants: IParticipant[];
}

const useStyles = makeStyles()(theme => {
    return {
        messageGroup: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',

            '&.remote': {
                maxWidth: 'calc(100% - 40px)' // 100% - avatar and margin
            }
        },

        groupContainer: {
            display: 'flex',

            '&.local': {
                justifyContent: 'flex-end',

                '& .avatar': {
                    display: 'none'
                }
            }
        },

        avatar: {
            margin: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(3)} 0`,
            position: 'sticky',
            flexShrink: 0,
            top: 0
        }
    };
});


const ChatMessageGroup = ({ className = '', messages, participants }: IProps) => {
    const { classes } = useStyles();
    const messagesLength = messages.length;

    if (!messagesLength) {
        return null;
    }

    const messagesWithSender = messages.map(message => {
        let participant;

        for (const p of participants) {
            if (p instanceof Map) {
                for (const [ _, value ] of p) {
                    if (value.id === message.participantId) {
                        participant = value;
                        break;
                    }
                }
            }

            if (participant) break;
        }

        return {
            ...message,
            participantRole: participant?.role,
            local: participant?.local,
        };
    });

    return (
        <div className = { clsx(classes.groupContainer, className) }>
            <Avatar
                className = { clsx(classes.avatar, 'avatar') }
                participantId = { messages[0].participantId }
                size = { 32 } />
            <div className = { `${classes.messageGroup} chat-message-group ${className}` }>
                {messagesWithSender.map((message, i) => (
                    <ChatMessage
                        className = { className }
                        isModerator = { message.participantRole === 'moderator' }
                        key = { i }
                        message = { message }
                        showDisplayName = { i === 0 }
                        showTimestamp = { i === messages.length - 1 } />
                ))}
            </div>
        </div>
    );
};

const mapStateToProps = (state: IReduxState) => {
    const participantState = state['features/base/participants'];

    const participants: IParticipant[] = Array.isArray(participantState)
        ? participantState
        : Object.values(participantState);

    return {
        participants,
    };
};

export default connect(mapStateToProps)(ChatMessageGroup);
