import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import {主题色色板, 主题色色板 as themeColors} from '../../../../../theme/ColorPalette'; // Assuming a central theme color definition
import { hideDialog } from '../../../dialog/actions';
import { IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { operatesWithEnterKey } from '../../functions.web';

import BaseDialog, { IProps as IBaseDialogProps } from './BaseDialog';
import Button from './Button';
import ClickableIcon from './ClickableIcon';


// Define themeColors based on _variables.scss (hardcoded for now)
// This should ideally be imported from a central theme provider/context if Jitsi has one for JSS.
const localThemeColors = {
    backgroundColorLight: '#252A3A',
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadiusLarge: '12px', // For modals
    primaryColor: '#7B61FF',
    spacingSmall: '8px',
    spacingMedium: '16px',
    spacingLarge: '24px',
};

const useStyles = makeStyles()(theme => { // theme here is likely Jitsi's existing MUI theme
    return {
        header: {
            width: '100%',
            padding: localThemeColors.spacingLarge, // Use themed spacing
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${localThemeColors.borderColor}`, // Add themed border
        },
        title: {
            color: localThemeColors.textColorPrimary, // Use themed text color
            ...withPixelLineHeight(theme.typography.heading5), // Keep existing typography if appropriate
            fontSize: '1.25rem', // Explicit font size from H5 example
            fontWeight: 600,    // Explicit font weight from H5 example
            margin: 0,
            padding: 0
        },
        // Style for the ClickableIcon wrapper of IconCloseLarge
        closeButton: {
            // ClickableIcon has its own styles, this is a target for its className prop if needed
            // For now, relying on IconCloseLarge being updated and ClickableIcon handling color
            '& svg': {
                fill: localThemeColors.textColorSecondary, // Make close icon less prominent
            },
            '&:hover svg': {
                fill: localThemeColors.textColorPrimary,
            }
        },
        content: {
            height: 'auto',
            overflowY: 'auto',
            width: '100%',
            boxSizing: 'border-box',
            padding: localThemeColors.spacingLarge, // Use themed padding for vertical and horizontal
            overflowX: 'hidden',
            minHeight: '40px',
            color: localThemeColors.textColorPrimary, // Default text color for content

            '@media (max-width: 448px)': {
                height: '100%' // Keep existing responsive behavior
            }
        },
        footer: {
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: localThemeColors.spacingLarge, // Use themed padding
            borderTop: `1px solid ${localThemeColors.borderColor}`, // Add themed border to footer top

            // Spacing between buttons in the footer
            // The existing CSS targets the last child, a more robust way is to use gap on the container
            // if all children are buttons, or apply margin to all but the first.
            // For now, keeping existing logic:
            '& button:last-child': {
                marginLeft: localThemeColors.spacingMedium // Use themed spacing (16px)
            },
            // Ensure Button components pick up global styles or have themed JSS.
            // Example: a primary button should use localThemeColors.primaryColor
        }
    };
});

interface IDialogProps extends IBaseDialogProps {
    back?: {
        hidden?: boolean;
        onClick?: () => void;
        translationKey?: string;
    };
    cancel?: {
        hidden?: boolean;
        translationKey?: string;
    };
    children?: React.ReactNode;
    disableAutoHideOnSubmit?: boolean;
    hideCloseButton?: boolean;
    ok?: {
        disabled?: boolean;
        hidden?: boolean;
        translationKey?: string;
    };
    onCancel?: () => void;
    onSubmit?: () => void;
}

const Dialog = ({
    back = { hidden: true },
    cancel = { translationKey: 'dialog.Cancel' },
    children,
    className,
    description,
    disableAutoHideOnSubmit = false,
    disableBackdropClose,
    hideCloseButton,
    disableEnter,
    disableEscape,
    ok = { translationKey: 'dialog.Ok' },
    onCancel,
    onSubmit,
    size,
    testId,
    title,
    titleKey
}: IDialogProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onClose = useCallback(() => {
        dispatch(hideDialog());
        onCancel?.();
    }, [ onCancel ]);

    const submit = useCallback(() => {
        if ((document.activeElement && !operatesWithEnterKey(document.activeElement)) || !document.activeElement) {
            !disableAutoHideOnSubmit && dispatch(hideDialog());
            onSubmit?.();
        }
    }, [ onSubmit ]);

    return (
        <BaseDialog
            className = { className }
            description = { description }
            disableBackdropClose = { disableBackdropClose }
            disableEnter = { disableEnter }
            disableEscape = { disableEscape }
            onClose = { onClose }
            size = { size }
            submit = { submit }
            testId = { testId }
            title = { title }
            titleKey = { titleKey }>
            <div className = { classes.header }>
                <h1
                    className = { classes.title }
                    id = 'dialog-title'>
                    {title ?? t(titleKey ?? '')}
                </h1>
                {!hideCloseButton && (
                    <ClickableIcon
                        accessibilityLabel = { t('dialog.accessibilityLabel.close') }
                        className = { classes.closeButton } // Apply style to ClickableIcon
                        icon = { IconCloseLarge }
                        id = 'modal-header-close-button'
                        onClick = { onClose } />
                )}
            </div>
            <div
                className = { classes.content }
                data-autofocus-inside = 'true'>
                {children}
            </div>
            <div
                className = { classes.footer }
                data-autofocus-inside = 'true'>
                {!back.hidden && <Button
                    accessibilityLabel = { t(back.translationKey ?? '') }
                    labelKey = { back.translationKey }
                    // eslint-disable-next-line react/jsx-handler-names
                    onClick = { back.onClick }
                    type = 'secondary' />}
                {!cancel.hidden && <Button
                    accessibilityLabel = { t(cancel.translationKey ?? '') }
                    labelKey = { cancel.translationKey }
                    onClick = { onClose }
                    type = 'tertiary' />}
                {!ok.hidden && <Button
                    accessibilityLabel = { t(ok.translationKey ?? '') }
                    disabled = { ok.disabled }
                    id = 'modal-dialog-ok-button'
                    isSubmit = { true }
                    labelKey = { ok.translationKey }
                    { ...(!ok.disabled && { onClick: submit }) } />}
            </div>
        </BaseDialog>
    );
};

export default Dialog;
