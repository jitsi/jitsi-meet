import React, { useCallback, useContext, useEffect } from 'react';
import FocusLock from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../dialog/actions';
import { IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';

import Button from './Button';
import ClickableIcon from './ClickableIcon';
import { DialogTransitionContext } from './DialogTransition';


const useStyles = makeStyles()(theme => {
    return {
        container: {
            width: '100%',
            height: '100%',
            position: 'fixed',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyLongRegular),
            top: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 301,
            animation: `${keyframes`
                0% {
                    opacity: 0.4;
                }
                100% {
                    opacity: 1;
                }
            `} 0.2s forwards ease-out`,

            '&.unmount': {
                animation: `${keyframes`
                    0% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0.5;
                    }
                `} 0.15s forwards ease-in`
            }
        },

        backdrop: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backgroundColor: theme.palette.ui02,
            opacity: 0.75
        },

        modal: {
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui03}`,
            boxShadow: '0px 4px 25px 4px rgba(20, 20, 20, 0.6)',
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'flex',
            flexDirection: 'column',
            height: 'auto',
            minHeight: '200px',
            maxHeight: '80vh',
            marginTop: '64px',
            animation: `${keyframes`
                0% {
                    margin-top: 85px
                }
                100% {
                    margin-top: 64px
                }
            `} 0.2s forwards ease-out`,

            '&.medium': {
                width: '400px'
            },

            '&.large': {
                width: '664px'
            },

            '&.unmount': {
                animation: `${keyframes`
                    0% {
                        margin-top: 64px
                    }
                    100% {
                        margin-top: 40px
                    }
                `} 0.15s forwards ease-in`
            },

            '@media (max-width: 448px)': {
                width: '100% !important',
                maxHeight: 'initial',
                height: '100%',
                margin: 0,
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                animation: `${keyframes`
                    0% {
                        margin-top: 15px
                    }
                    100% {
                        margin-top: 0
                    }
                `} 0.2s forwards ease-out`,

                '&.unmount': {
                    animation: `${keyframes`
                        0% {
                            margin-top: 0
                        }
                        100% {
                            margin-top: 15px
                        }
                    `} 0.15s forwards ease-in`
                }
            }
        },

        header: {
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
        },

        closeIcon: {
            '&:focus': {
                boxShadow: 'none'
            }
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
        },

        focusLock: {
            zIndex: 1
        }
    };
});

interface IDialogProps {
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
    className?: string;
    description?: string;
    disableAutoHideOnSubmit?: boolean;
    disableBackdropClose?: boolean;
    disableEnter?: boolean;
    hideCloseButton?: boolean;
    ok?: {
        disabled?: boolean;
        hidden?: boolean;
        translationKey?: string;
    };
    onCancel?: () => void;
    onSubmit?: () => void;
    size?: 'large' | 'medium';
    title?: string;
    titleKey?: string;
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
    ok = { translationKey: 'dialog.Ok' },
    onCancel,
    onSubmit,
    size = 'medium',
    title,
    titleKey
}: IDialogProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const { isUnmounting } = useContext(DialogTransitionContext);
    const dispatch = useDispatch();

    const onClose = useCallback(() => {
        dispatch(hideDialog());
        onCancel?.();
    }, [ onCancel ]);

    const submit = useCallback(() => {
        !disableAutoHideOnSubmit && dispatch(hideDialog());
        onSubmit?.();
    }, [ onSubmit ]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Enter' && !disableEnter) {
            submit();
        }
    }, []);

    const onBackdropClick = useCallback(() => {
        !disableBackdropClose && onClose();
    }, [ disableBackdropClose, onClose ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className = { cx(classes.container, isUnmounting && 'unmount') }>
            <div
                className = { classes.backdrop }
                onClick = { onBackdropClick } />
            <FocusLock className = { classes.focusLock }>
                <div
                    aria-describedby = { description }
                    aria-labelledby = { title ?? t(titleKey ?? '') }
                    aria-modal = { true }
                    className = { cx(classes.modal, isUnmounting && 'unmount', size, className) }
                    role = 'dialog'>
                    <div className = { classes.header }>
                        <p
                            className = { classes.title }
                            id = 'dialog-title'>
                            {title ?? t(titleKey ?? '')}
                        </p>
                        {!hideCloseButton && (
                            <ClickableIcon
                                accessibilityLabel = { t('dialog.close') }
                                className = { classes.closeIcon }
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
                            labelKey = { ok.translationKey }
                            onClick = { submit } />}
                    </div>
                </div>
            </FocusLock>
        </div>
    );
};

export default Dialog;
