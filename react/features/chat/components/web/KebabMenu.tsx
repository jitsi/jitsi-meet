import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";
import Button from "../../../base/ui/components/web/Button";
import { BUTTON_TYPES } from "../../../base/ui/constants.any";
import { IconDotsHorizontal } from "../../../base/icons/svg";
import Popover from "@mui/material/Popover";

export interface IProps {
    onReply: () => void;
    onPrivateMessage: () => void;
    onCopy: () => void;
    className?: string;
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
        "&:hover": {
            backgroundColor: theme.palette.action03,
        },
    },
}));

const KebabMenu = ({ onReply, onPrivateMessage, onCopy, className }: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

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
                <div>
                    <div className={classes.menuItem} onClick={() => handleMenuItemClick(onReply)}>
                        {t("Reply")}
                    </div>
                    <div className={classes.menuItem} onClick={() => handleMenuItemClick(onPrivateMessage)}>
                        {t("Private Message")}
                    </div>
                    <div className={classes.menuItem} onClick={() => handleMenuItemClick(onCopy)}>
                        {t("Copy")}
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default KebabMenu;
