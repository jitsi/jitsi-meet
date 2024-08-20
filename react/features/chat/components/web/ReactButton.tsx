import { Theme } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconFaceSmile } from '../../../base/icons/svg';
import Popover from '../../../base/popover/components/Popover.web'; // Adjust the import path as needed
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { sendReaction } from '../../actions.any';
import { IChatProps as AbstractProps } from '../../types';

import EmojiSelector from './EmojiSelector';

interface IProps extends AbstractProps {

    /**
     * Function to send a reaction to a message.
     *
     * @protected
     */
    _onSendReaction: Function;

    messageId: string;

    reaction: string;

    receiverId: string;

}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        reactButton: {
            paddingTop: '0px',
            paddingBottom: '0px',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&:hover': {
                backgroundColor: theme.palette.action03,
                opacity: 1
            }
        },
        reactButtonVisible: {
            opacity: 1
        },
        reactionPanelContainer: {
            position: 'relative',
            display: 'inline-block'
        },
        popoverContainer: {
            position: 'absolute',
            top: '10%',
            left: '50%',
        }
    };
});

const ReactButton = ({
    messageId,
    receiverId
}: IProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();

    const onSendReaction = useCallback(emoji => {
        dispatch(sendReaction(emoji, messageId, receiverId));
    }, [ dispatch, messageId, receiverId ]);

    const [ showSmileysPanel, setShowSmileysPanel ] = useState(false);

    const buttonRef = useRef(null);

    const handleReactClick = useCallback(() => {
        setShowSmileysPanel(!showSmileysPanel);
    }, [ showSmileysPanel ]);

    return (
        <div
            className = { classes.reactionPanelContainer }
            ref = { buttonRef }>
            <Button
                accessibilityLabel = { ('toolbar.accessibilityLabel.react') }
                className = { cx(classes.reactButton, {
                    [classes.reactButtonVisible]: showSmileysPanel
                }) }
                icon = { IconFaceSmile }
                onClick = { handleReactClick }
                type = { BUTTON_TYPES.TERTIARY } />
            {showSmileysPanel && (
                <div className = { classes.popoverContainer }>
                    <Popover
                        content = { <EmojiSelector onSelect = { emoji => onSendReaction(emoji) } /> }
                        disablePopover = { false }
                        headingLabel = { ('toolbar.react') }
                        id = 'emoji-selector-popover'
                        onPopoverClose = { () => setShowSmileysPanel(false) }
                        onPopoverOpen = { () => setShowSmileysPanel(true) }
                        position = 'top'
                        visible = { showSmileysPanel }>
                        <div />
                    </Popover>
                </div>
            )}
        </div>
    );
};

export default ReactButton;
