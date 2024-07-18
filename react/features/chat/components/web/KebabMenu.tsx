import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";
import Button from "../../../base/ui/components/web/Button";
import { BUTTON_TYPES } from "../../../base/ui/constants.any";
import { IconDotsHorizontal } from "../../../base/icons/svg";
import Popover from "@mui/material/Popover";
import { useDispatch, useSelector } from 'react-redux';
import { handleLobbyChatInitialized, openChat } from '../../actions.web';
import { sendReaction } from '../../actions.any.ts'
import { getParticipantById } from "../../../base/participants/functions";
import { IReduxState } from "../../../app/types";

export interface IProps {
    onReply: () => void;
    onPrivateMessage: () => void;
    onCopy: () => void;
    className?: string;

    message: string;

    messageId: string;

    /**
    * True if the message is a lobby chat message.
    */
    isLobbyMessage: boolean;

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantId: string;

    /**
     * Whether the button should be visible or not.
     */
    visible?: boolean;
}

const useStyles = makeStyles()((theme) => ({
    kebabButton: {
        padding: "2px",
        opacity: 0,
        transition: "opacity 0.3s ease",
        "&:hover": {
            backgroundColor: theme.palette.action03,
            opacity: 1,
        },
    },
    menuItem: {
        padding: "8px 16px",
        cursor: "pointer",
        color: "white", // Set text color to white
        "&:hover": {
            backgroundColor: theme.palette.action03,
        },
    },
    menuPanel: {
        backgroundColor: theme.palette.ui02,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
    },
}));

const KebabMenu = ({ messageId, message, isLobbyMessage, participantId, onCopy, className }: IProps) => {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const participant = useSelector((state: IReduxState) => getParticipantById(state, participantId));

    const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleReplyClick = useCallback(() => {
        
    }, []);

    const handlePrivateClick = useCallback(() => {
        if (isLobbyMessage) {
            dispatch(handleLobbyChatInitialized(participantId));
        } else {
            dispatch(openChat(participant));
        }
    }, [dispatch, isLobbyMessage, participant, participantId]);

    const handleCopyClick = useCallback(() => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(message).then(() => {
                console.log("Message copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy message: ", err);
            });
        } else {
            console.error("Clipboard API not available");
        }
    }, [message]);

    const handleMenuItemClick = useCallback((action: () => void) => {
        action();
        setAnchorEl(null);
    }, []);

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? "kebab-menu-popover" : undefined;

    return (
        <div className={cx(className)}>
            <Button
                accessibilityLabel={t("toolbar.accessibilityLabel.moreOptions")}
                className={classes.kebabButton}
                icon={IconDotsHorizontal}
                onClick={handleMenuClick}
                type={BUTTON_TYPES.TERTIARY}
            />
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <div className={classes.menuPanel}>
                    <div className={classes.menuItem} onClick={() => handleReplyClick()}>
                        {t("Reply")}
                    </div>
                    <div className={classes.menuItem} onClick={() => handlePrivateClick()}>
                        {t("Private Message")}
                    </div>
                    <div className={classes.menuItem} onClick={() => handleCopyClick()}>
                        {t("Copy")}
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default KebabMenu;
