import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../dialog/actions';
import { IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { operatesWithEnterKey } from '../../functions.web';

import BaseDialog, { IProps as IBaseDialogProps } from './BaseDialog';
import Button from './Button';
import ClickableIcon from './ClickableIcon';


const useStyles = makeStyles()(theme => {
    return {
        header: {
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
        },

        title: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.heading5),
            margin: 0,
            padding: 0
        },

        content: {
            height: 'auto',
            overflowY: 'auto',
            width: '100%',
            boxSizing: 'border-box',
            padding: '0 24px',
            overflowX: 'hidden',
            minHeight: '40px',

            '@media (max-width: 448px)': {
                height: '100%'
            }
        },

        footer: {
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '24px',

            '& button:last-child': {
                marginLeft: '16px'
            }
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
        if (onSubmit && (
            (document.activeElement && !operatesWithEnterKey(document.activeElement))
            || !document.activeElement
        )) {
            !disableAutoHideOnSubmit && dispatch(hideDialog());
            onSubmit();
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
