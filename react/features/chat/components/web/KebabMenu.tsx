import Popover from '@mui/material/Popover';
import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import logger from '../../../base/react/logger';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { handleLobbyChatInitialized, openChat } from '../../actions.web';

export interface IProps {
    className?: string;

    /**
    * True if the message is a lobby chat message.
    */
    isLobbyMessage: boolean;

    /**
     * The current chat message.
    */
    message: string;

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantId: string;

    /**
     * Whether the chat message menu is visible or not.
     */
    shouldDisplayChatMessageMenu: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        kebabButton: {
            padding: '2px'
        },

        menuItem: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: 'white',
            '&:hover': {
                backgroundColor: theme.palette.action03
            }
        },

        menuPanel: {
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[3],
            overflow: 'hidden'
        },

        popover: {
            '& .MuiPaper-root': {
                backgroundColor: 'transparent',
                boxShadow: 'none'
            }
        },

        copiedMessage: {
            position: 'fixed',
            backgroundColor: theme.palette.ui03,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: 'none'
        },

        showCopiedMessage: {
            opacity: 1
        }
    };
});

const KebabMenu = ({ message, participantId, isLobbyMessage, shouldDisplayChatMessageMenu }: IProps) => {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const [ showCopiedMessage, setShowCopiedMessage ] = useState(false);
    const [ popupPosition, setPopupPosition ] = useState({ top: 0,
        left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    const participant = useSelector((state: IReduxState) => getParticipantById(state, participantId));

    const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handlePrivateClick = useCallback(() => {
        if (isLobbyMessage) {
            dispatch(handleLobbyChatInitialized(participantId));
        } else {
            dispatch(openChat(participant));
        }
        handleClose();
    }, [ dispatch, isLobbyMessage, participant, participantId ]);

    const handleCopyClick = useCallback(() => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(message)
            .then(() => {
                if (buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();

                    setPopupPosition({ top: rect.top - 30,
                        left: rect.left });
                }

                setShowCopiedMessage(true);
                setTimeout(() => {
                    setShowCopiedMessage(false);
                }, 2000);
            });
        } else {
            logger.error('Clipboard not available');
        }
        handleClose();
    }, [ message ]);

    const open = Boolean(anchorEl);
    const id = open ? 'kebab-menu-popover' : undefined;

    return (
        <div>
            <div ref = { buttonRef }>
                <Button
                    accessibilityLabel = { t('toolbar.accessibilityLabel.moreOptions') }
                    className = { classes.kebabButton }
                    icon = { IconDotsHorizontal }
                    onClick = { handleMenuClick }
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>

            {showCopiedMessage && ReactDOM.createPortal(
                <div
                    className = { cx(classes.copiedMessage, { [classes.showCopiedMessage]: showCopiedMessage }) }
                    style = {{ top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px` }}>
                    {t('Message Copied')}
                </div>,
                document.body
            )}

            <Popover
                anchorEl = { anchorEl }
                anchorOrigin = {{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                className={classes.popover}
                id = { id }
                onClose = { handleClose }
                open = { open }
                transformOrigin = {{
                    vertical: 'top',
                    horizontal: 'center'
                }}>
                <div className = { classes.menuPanel }>
                    {shouldDisplayChatMessageMenu && (
                        <div
                            className = { classes.menuItem }
                            onClick = { handlePrivateClick }>
                            {t('Private Message')}
                        </div>
                    )}
                    <div
                        className = { classes.menuItem }
                        onClick = { handleCopyClick }>
                        {t('Copy')}
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default KebabMenu;
