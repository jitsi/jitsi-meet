import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { copyText } from '../../../base/util/copyText.web';
import { handleLobbyChatInitialized, openChat } from '../../actions.web';

export interface IProps {
    className?: string;
    isLobbyMessage: boolean;
    message: string;
    participantId: string;
    shouldDisplayChatMessageMenu: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        messageMenuButton: {
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

const MessageMenu = ({ message, participantId, isLobbyMessage, shouldDisplayChatMessageMenu }: IProps) => {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [ isPopoverOpen, setIsPopoverOpen ] = useState(false);
    const [ showCopiedMessage, setShowCopiedMessage ] = useState(false);
    const [ popupPosition, setPopupPosition ] = useState({ top: 0,
        left: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    const participant = useSelector((state: IReduxState) => getParticipantById(state, participantId));

    const handleMenuClick = useCallback(() => {
        setIsPopoverOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsPopoverOpen(false);
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
        copyText(message)
            .then(success => {
                if (success) {
                    if (buttonRef.current) {
                        const rect = buttonRef.current.getBoundingClientRect();

                        setPopupPosition({
                            top: rect.top - 30,
                            left: rect.left
                        });
                    }
                    setShowCopiedMessage(true);
                    setTimeout(() => {
                        setShowCopiedMessage(false);
                    }, 2000);
                } else {
                    console.error('Failed to copy text');
                }
            })
            .catch(error => {
                console.error('Error copying text:', error);
            });
        handleClose();
    }, [ message ]);

    const popoverContent = (
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
    );

    return (
        <div>
            <div ref = { buttonRef }>
                <Popover
                    content = { popoverContent }
                    onPopoverClose = { handleClose }
                    position = 'top'
                    trigger = 'click'
                    visible = { isPopoverOpen }>
                    <Button
                        accessibilityLabel = { t('toolbar.accessibilityLabel.moreOptions') }
                        className = { classes.messageMenuButton }
                        icon = { IconDotsHorizontal }
                        onClick = { handleMenuClick }
                        type = { BUTTON_TYPES.TERTIARY } />
                </Popover>
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
        </div>
    );
};

export default MessageMenu;
