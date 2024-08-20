import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Popover from '@mui/material/Popover';

import { IconFaceSmile } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { sendReaction } from '../../actions.any';
import { IChatProps as AbstractProps } from '../../types';

import EmojiSelector from './EmojiSelector';

interface IProps extends AbstractProps {
    messageId: string;
    reaction: string;
    receiverId: string;
}

const useStyles = makeStyles()((theme) => {
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

    const onSendReaction = useCallback((emoji) => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [dispatch, messageId, receiverId]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleReactClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'react-popover' : undefined;

    return (
        <div className={classes.reactionPanelContainer}>
            <Button
                accessibilityLabel={t('toolbar.accessibilityLabel.react')}
                className={classes.reactButton}
                icon={IconFaceSmile}
                onClick={handleReactClick}
                type={BUTTON_TYPES.TERTIARY}
            />
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                PaperProps={{
                    className: classes.popoverPaper
                }}
            >
                <EmojiSelector onSelect={(emoji) => {
                    onSendReaction(emoji);
                    handleClose();
                }} />
            </Popover>
        </div>
    );
};

export default ReactButton;