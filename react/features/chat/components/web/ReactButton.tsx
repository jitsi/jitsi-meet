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
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onSendReaction = useCallback(emoji => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const restoreTriggerFocus = useRef(false);

    useEffect(() => {
        if (!isPopoverOpen) {
            return undefined;
        }

        let frame = 0;
        const startedAt = performance.now();

        const focusFirstEmoji = () => {
            const panel = popoverContentRef.current;
            const firstItem = panel?.querySelector<HTMLButtonElement>('button');
            const active = document.activeElement;
            const itemHasFocus = Boolean(active instanceof HTMLElement
                && panel?.contains(active)
                && active.tagName === 'BUTTON');

            if (firstItem && !itemHasFocus && firstItem.getClientRects().length > 0) {
                firstItem.focus();
            }

            if (performance.now() - startedAt < 300) {
                frame = requestAnimationFrame(focusFirstEmoji);
            }
        };

        frame = requestAnimationFrame(focusFirstEmoji);

        return () => cancelAnimationFrame(frame);
    }, [ isPopoverOpen ]);

    useEffect(() => {
        if (isPopoverOpen || !restoreTriggerFocus.current) {
            return undefined;
        }

        restoreTriggerFocus.current = false;

        const frame = requestAnimationFrame(() => {
            triggerRef.current?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [ isPopoverOpen ]);

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
            ref = { popoverContentRef }>
            <EmojiSelector onSelect = { handleEmojiSelect } />
        </div>
    );

    return (
        <Popover
            content = { popoverContent }
            onPopoverClose = { handleClose }
            position = 'top'
            trigger = 'click'
            visible = { isPopoverOpen }>
            <div className = { classes.reactionPanelContainer }>
                <Button
                    accessibilityLabel = { t('toolbar.accessibilityLabel.react') }
                    className = { classes.reactButton }
                    icon = { IconFaceSmile }
                    onClick = { handleReactClick }
                    onKeyPress = { handleTriggerKeyPress }
                    ref = { triggerRef }
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>
        </Popover>
    );
};

export default ReactButton;
