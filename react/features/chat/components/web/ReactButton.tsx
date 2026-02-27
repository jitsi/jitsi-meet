import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { sendReaction } from '../../actions.any';

import EmojiSelector from './EmojiSelector';

interface IProps {
    messageId: string;
    receiverId: string;
}

const useStyles = makeStyles()(() => {
    return {
        reactContainer: {
            display: 'inline-flex',
            alignItems: 'center'
        }
    };
});

const ReactButton = ({ messageId, receiverId }: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();

    const handleEmojiSelect = useCallback((emoji: string) => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    return (
        <div className = { classes.reactContainer }>
            <EmojiSelector onSelect = { handleEmojiSelect } />
        </div>
    );
};

export default ReactButton;
