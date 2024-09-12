import { Theme } from '@mui/material';
import React, { useCallback, useState } from 'react';
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

    const handleReactClick = useCallback(() => {
        setIsPopoverOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsPopoverOpen(false);
    }, []);

    const handleEmojiSelect = useCallback((emoji: string) => {
        onSendReaction(emoji);
        handleClose();
    }, [ onSendReaction, handleClose ]);

    const popoverContent = (
        <div className = { classes.popoverContent }>
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
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>
        </Popover>
    );
};

export default ReactButton;
