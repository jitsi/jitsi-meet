import { Theme } from '@mui/material';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconFaceSmile } from '../../../base/icons/svg';
import Popover from '../../../base/popover/components/Popover.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { sendReaction } from '../../actions.any';

import EmojiSelector from './EmojiSelector';
import useFocusFirstItem from './useFocusFirstItem';
import useMenuFocusTrap from './useMenuFocusTrap';

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
        popoverContent: {
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3],
            overflow: 'hidden'
        }
    };
});

const ReactButton = ({ messageId, receiverId }: IProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onSendReaction = useCallback(emoji => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const restoreTriggerFocus = useRef(false);

    useFocusFirstItem(popoverContentRef, isPopoverOpen, 'button');

    useEffect(() => {
        if (isPopoverOpen || !restoreTriggerFocus.current) {
            return undefined;
        }

        restoreTriggerFocus.current = false;

        const frame = requestAnimationFrame(() => {
            const active = document.activeElement;
            const panel = popoverContentRef.current;
            const focusLost = !active || active === document.body || Boolean(panel?.contains(active));

            if (focusLost) {
                triggerRef.current?.focus({ preventScroll: true });
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [ isPopoverOpen ]);

    const handleMenuTab = useMenuFocusTrap();

    const handleReactClick = useCallback(() => {
        restoreTriggerFocus.current = true;
        setIsPopoverOpen(true);
    }, []);

    const handleTriggerKeyPress = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter') {
            event.stopPropagation();
        }
    }, []);

    const handleClose = useCallback(() => {
        setIsPopoverOpen(false);
    }, []);

    const handleEmojiSelect = useCallback((emoji: string) => {
        onSendReaction(emoji);
        handleClose();
    }, [ onSendReaction, handleClose ]);

    const popoverContent = (
        <div
            className = { classes.popoverContent }
            onKeyDown = { handleMenuTab }
            ref = { popoverContentRef }>
            <EmojiSelector onSelect = { handleEmojiSelect } />
        </div>
    );

    const triggerButton = (
        <Button
            accessibilityLabel = { t('toolbar.accessibilityLabel.react') }
            ariaExpanded = { isPopoverOpen }
            ariaHasPopup = 'listbox'
            className = { classes.reactButton }
            icon = { IconFaceSmile }
            onClick = { handleReactClick }
            onKeyPress = { handleTriggerKeyPress }
            ref = { triggerRef }
            type = { BUTTON_TYPES.TERTIARY } />
    );

    return (
        <div
            className = { cx(classes.reactionPanelContainer,
                isPopoverOpen && 'chat-message-actions-open') }>
            <Popover
                content = { popoverContent }
                onPopoverClose = { handleClose }
                position = 'top'
                trigger = 'click'
                visible = { isPopoverOpen }>
                {triggerButton}
            </Popover>
        </div>
    );
};

export default memo(ReactButton);
