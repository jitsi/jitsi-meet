import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { IconDotsHorizontal } from '../../../base/icons/svg';

export interface IProps {
    onReply: () => void;
    onPrivateMessage: () => void;
    onCopy: () => void;
    className?: string;
}

const useStyles = makeStyles()(theme => ({
    kebabButton: {
        padding: '2px',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        '&:hover': {
            backgroundColor: theme.palette.action03,
            opacity: 1
        }
    },
    menuPanel: {
        position: 'absolute',
        zIndex: 10,
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: theme.palette.ui02,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
        padding: '8px',
        display: 'flex',
        flexDirection: 'column'
    },
    menuPanelContainer: {
        position: 'relative',
        display: 'inline-block',
    },
    menuItem: {
        padding: '8px 16px',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.palette.action03
        }
    }
}));

const KebabMenu = ({ onReply, onPrivateMessage, onCopy, className }: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [showMenuPanel, setShowMenuPanel] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleMenuClick = useCallback(() => {
        setShowMenuPanel(!showMenuPanel);
    }, [showMenuPanel]);

    const handleMenuItemClick = useCallback((action: () => void) => {
        action();
        setShowMenuPanel(false);
    }, []);

    return (
        <div ref = { buttonRef } className = { cx(classes.menuPanelContainer, className) } >
            <Button
                accessibilityLabel = { t('toolbar.accessibilityLabel.moreOptions') }
                className = { classes.kebabButton }
                icon = { IconDotsHorizontal }
                onClick = { handleMenuClick }
                type = { BUTTON_TYPES.TERTIARY }
            />
            { showMenuPanel && (
                <div className={classes.menuPanel}>
                    <div className = { classes.menuItem } onClick = { () => handleMenuItemClick(onReply) } >
                        { t('Reply') }
                    </div>
                    <div className = { classes.menuItem } onClick = {() => handleMenuItemClick(onPrivateMessage) } >
                        { t('Private Message') }
                    </div>
                    <div className = { classes.menuItem } onClick = { () => handleMenuItemClick(onCopy) } >
                        { t('Copy') }
                    </div>
                </div>
            )}
        </div>
    );
};

export default KebabMenu;
