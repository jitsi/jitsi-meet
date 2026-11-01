import { Theme } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconFaceSmile } from '../../../base/icons/svg';
import Popover from '../../../base/popover/components/Popover.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { sendReaction } from '../../actions.any';

import EmojiSelector from './EmojiSelector';

interface IProps {
    messageId: string;
    onPopoverOpenChange?: (isOpen: boolean) => void;
    receiverId: string;
    tabIndex?: number;
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
        popoverContent: {
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3],
            overflow: 'hidden'
        }
    };
});

const ReactButton = ({
    messageId,
    onPopoverOpenChange,
    receiverId,
    tabIndex = -1
}: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const buttonRef = useRef<HTMLDivElement>(null);

    const onSendReaction = useCallback(emoji => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    const popoverId = useRef(`react-${messageId}`);

    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);

    const handleClose = useCallback((restoreFocus = false) => {
        setIsPopoverOpen(false);
        onPopoverOpenChange?.(false);
        if (restoreFocus) {
            buttonRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
        }
    }, [ onPopoverOpenChange ]);

    const handleOpen = useCallback(() => {
        document.dispatchEvent(new CustomEvent('chat-popover-open', { detail: popoverId.current }));
        setIsPopoverOpen(true);
        onPopoverOpenChange?.(true);
    }, [ onPopoverOpenChange ]);

    useEffect(() => {
        const handleOtherOpen = (event: Event) => {
            const customEvent = event as CustomEvent<string>;

            if (customEvent.detail !== popoverId.current && isPopoverOpen) {
                handleClose();
            }
        };

        document.addEventListener('chat-popover-open', handleOtherOpen);

        return () => {
            document.removeEventListener('chat-popover-open', handleOtherOpen);
        };
    }, [ isPopoverOpen, handleClose ]);

    const handleToggle = useCallback(() => {
        if (isPopoverOpen) {
            handleClose(true);
        } else {
            handleOpen();
        }
    }, [ isPopoverOpen, handleClose, handleOpen ]);

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        event.stopPropagation();
    }, []);

    const handlePopoverKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            handleClose(true);
        }
    }, [ handleClose ]);

    const handleEmojiSelect = useCallback((emoji: string) => {
        onSendReaction(emoji);
        handleClose(true);
    }, [ onSendReaction, handleClose ]);

    const popoverContent = (
        <div
            className = { classes.popoverContent }
            onKeyDown = { handlePopoverKeyDown }>
            <EmojiSelector
                onClose = { handleClose }
                onSelect = { handleEmojiSelect } />
        </div>
    );

    return (
        <Popover
            allowClick = { true }
            content = { popoverContent }
            onPopoverClose = { handleClose }
            position = 'top'
            trigger = 'click'
            visible = { isPopoverOpen }>
            <div
                className = { classes.reactionPanelContainer }
                ref = { buttonRef }>
                <Button
                    accessibilityLabel = { t('toolbar.accessibilityLabel.react') }
                    className = { classes.reactButton }
                    icon = { IconFaceSmile }
                    onClick = { handleToggle }
                    onKeyPress = { handleKeyPress }
                    tabIndex = { tabIndex }
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>
        </Popover>
    );
};

export default ReactButton;
