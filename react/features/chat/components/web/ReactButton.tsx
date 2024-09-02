import { Theme } from '@mui/material';
import Popover from '@mui/material/Popover';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconFaceSmile } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { sendReaction } from '../../actions.any';

import EmojiSelector from './EmojiSelector';

interface IProps {
    messageId: string;
    receiverId: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        reactButton: {
            padding: '2px'
        },
        reactionPanelContainer: {
            position: 'relative',
            display: 'inline-block'
        },
        popoverPaper: {
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3]
        }
    };
});

const ReactButton = ({ messageId, receiverId }: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onSendReaction = useCallback(emoji => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);

    const handleReactClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleEmojiSelect = useCallback((emoji: string) => {
        onSendReaction(emoji);
        handleClose();
    }, [ onSendReaction, handleClose ]);

    const open = Boolean(anchorEl);
    const id = open ? 'react-popover' : undefined;

    return (
        <div className = { classes.reactionPanelContainer }>
            <Button
                accessibilityLabel = { t('toolbar.accessibilityLabel.react') }
                className = { classes.reactButton }
                icon = { IconFaceSmile }
                onClick = { handleReactClick }
                type = { BUTTON_TYPES.TERTIARY } />
            <Popover
                PaperProps = {{
                    className: classes.popoverPaper
                }}
                anchorEl = { anchorEl }
                anchorOrigin = {{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                id = { id }
                onClose = { handleClose }
                open = { open }
                transformOrigin = {{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}>
                <EmojiSelector
                    onSelect = { handleEmojiSelect } />
            </Popover>
        </div>
    );
};

export default ReactButton;
