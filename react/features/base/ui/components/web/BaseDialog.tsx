import React, { ReactNode, useCallback, useContext, useEffect } from 'react';
import { FocusOn } from 'react-focus-on';
import { useTranslation } from 'react-i18next';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../styles/functions.web';
import { isElementInTheViewport } from '../../functions.web';

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

        focusLock: {
            zIndex: 1
        }
    };
});

export interface IProps {
    children?: ReactNode;
    className?: string;
    description?: string;
    disableBackdropClose?: boolean;
    disableEnter?: boolean;
    disableEscape?: boolean;
    onClose?: () => void;
    size?: 'large' | 'medium';
    submit?: () => void;
    testId?: string;
    title?: string;
    titleKey?: string;
}

const BaseDialog = ({
    children,
    className,
    description,
    disableBackdropClose,
    disableEnter,
    disableEscape,
    onClose,
    size = 'medium',
    submit,
    testId,
    title,
    titleKey
}: IProps) => {
    const { classes, cx } = useStyles();
    const { isUnmounting } = useContext(DialogTransitionContext);
    const { t } = useTranslation();

    const onBackdropClick = useCallback(() => {
        !disableBackdropClose && onClose?.();
    }, [ disableBackdropClose, onClose ]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !disableEscape) {
            onClose?.();
        }
        if (e.key === 'Enter' && !disableEnter) {
            submit?.();
        }
    }, [ disableEnter, onClose, submit ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ handleKeyDown ]);

    return (
        <div
            className = { cx(classes.container, isUnmounting && 'unmount') }
            data-testid = { testId }>
            <div className = { classes.backdrop } />
            <FocusOn
                className = { classes.focusLock }
                onClickOutside = { onBackdropClick }
                returnFocus = {

                    // If we return the focus to an element outside the viewport the page will scroll to
                    // this element which in our case is undesirable and the element is outside of the
                    // viewport on purpose (to be hidden). For example if we return the focus to the toolbox
                    // when it is hidden the whole page will move up in order to show the toolbox. This is
                    // usually followed up with displaying the toolbox (because now it is on focus) but
                    // because of the animation the whole scenario looks like jumping large video.
                    isElementInTheViewport
                }>
                <div
                    aria-description = { description }
                    aria-label = { title ?? t(titleKey ?? '') }
                    aria-modal = { true }
                    className = { cx(classes.modal, isUnmounting && 'unmount', size, className) }
                    data-autofocus = { true }
                    role = 'dialog'
                    tabIndex = { -1 }>
                    {children}
                </div>
            </FocusOn>
        </div>
    );
};

export default BaseDialog;
