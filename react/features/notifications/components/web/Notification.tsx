import { Theme } from '@mui/material';
import React, { isValidElement, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import {
    IconCheck,
    IconCloseLarge,
    IconInfo,
    IconMessage,
    IconUser,
    IconUsers,
    IconWarningCircle
} from '../../../base/icons/svg';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { NOTIFICATION_ICON, NOTIFICATION_TYPE } from '../../constants';
import { INotificationProps } from '../../types';
import { NotificationsTransitionContext } from '../NotificationsTransition';

interface IProps extends INotificationProps {

    /**
     * Callback invoked when the user clicks to dismiss the notification.
     */
    onDismissed: Function;
}

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */


const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            backgroundColor: theme.palette.ui10,
            padding: '8px 16px 8px 20px',
            display: 'flex',
            position: 'relative' as const,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)',
            marginBottom: theme.spacing(2),

            '&:last-of-type': {
                marginBottom: 0
            },

            animation: `${keyframes`
                0% {
                    opacity: 0;
                    transform: translateX(-80%);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0);
                }
            `} 0.2s forwards ease`,

            '&.unmount': {
                animation: `${keyframes`
                    0% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-80%);
                    }
                `} 0.2s forwards ease`
            }
        },

        ribbon: {
            width: '4px',
            height: 'calc(100% - 16px)',
            position: 'absolute' as const,
            left: 0,
            top: '8px',
            borderRadius: '4px',

            '&.normal': {
                backgroundColor: theme.palette.action01
            },

            '&.error': {
                backgroundColor: theme.palette.iconError
            },

            '&.success': {
                backgroundColor: theme.palette.success01
            },

            '&.warning': {
                backgroundColor: theme.palette.warning01
            }
        },

        content: {
            display: 'flex',
            alignItems: 'flex-start',
            padding: '8px 0',
            flex: 1,
            maxWidth: '100%'
        },

        textContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'space-between',
            color: theme.palette.text04,
            flex: 1,
            margin: '0 8px',

            // maxWidth: 100% minus the icon on left (20px) minus the close icon on the right (20px) minus the margins
            maxWidth: 'calc(100% - 40px - 16px)',
            maxHeight: '150px'
        },

        title: {
            ...withPixelLineHeight(theme.typography.bodyShortBold)
        },

        description: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            overflow: 'auto',
            overflowWrap: 'break-word',
            userSelect: 'all',

            '&:not(:empty)': {
                marginTop: theme.spacing(1)
            }
        },

        actionsContainer: {
            display: 'flex',
            width: '100%',

            '&:not(:empty)': {
                marginTop: theme.spacing(2)
            }
        },

        action: {
            border: 0,
            outline: 0,
            backgroundColor: 'transparent',
            color: theme.palette.action01,
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            marginRight: theme.spacing(3),
            padding: 0,
            cursor: 'pointer',

            '&:last-of-type': {
                marginRight: 0
            },

            '&.destructive': {
                color: theme.palette.textError
            }
        },

        closeIcon: {
            cursor: 'pointer'
        }
    };
});

const Notification = ({
    appearance = NOTIFICATION_TYPE.NORMAL,
    customActionHandler,
    customActionNameKey,
    customActionType,
    description,
    descriptionArguments,
    descriptionKey,
    hideErrorSupportLink,
    icon,
    onDismissed,
    title,
    titleArguments,
    titleKey,
    uid
}: IProps) => {
    const { classes, cx, theme } = useStyles();
    const { t } = useTranslation();
    const { unmounting } = useContext(NotificationsTransitionContext);

    const ICON_COLOR = {
        error: theme.palette.iconError,
        normal: theme.palette.action01,
        success: theme.palette.success01,
        warning: theme.palette.warning01
    };

    const onDismiss = useCallback(() => {
        onDismissed(uid);
    }, [ uid ]);

    // eslint-disable-next-line react/no-multi-comp
    const renderDescription = useCallback(() => {
        const descriptionArray = [];

        descriptionKey
            && descriptionArray.push(t(descriptionKey, descriptionArguments));

        description && typeof description === 'string' && descriptionArray.push(description);

        // Keeping in mind that:
        // - Notifications that use the `translateToHtml` function get an element-based description array with one entry
        // - Message notifications receive string-based description arrays that might need additional parsing
        // We look for ready-to-render elements, and if present, we roll with them
        // Otherwise, we use the Message component that accepts a string `text` prop
        const shouldRenderHtml = descriptionArray.length === 1 && isValidElement(descriptionArray[0]);

        // the id is used for testing the UI
        return (
            <div
                className = { classes.description }
                data-testid = { descriptionKey } >
                {shouldRenderHtml ? descriptionArray : <Message text = { descriptionArray.join(' ') } />}
                {typeof description === 'object' && description}
            </div>
        );
    }, [ description, descriptionArguments, descriptionKey, classes ]);

    const _onOpenSupportLink = () => {
        window.open(interfaceConfig.SUPPORT_URL, '_blank', 'noopener');
    };

    const mapAppearanceToButtons = useCallback((): {
        content: string; onClick: () => void; testId?: string; type?: string; }[] => {
        switch (appearance) {
        case NOTIFICATION_TYPE.ERROR: {
            const buttons = [
                {
                    content: t('dialog.dismiss'),
                    onClick: onDismiss
                }
            ];

            if (!hideErrorSupportLink && interfaceConfig.SUPPORT_URL) {
                buttons.push({
                    content: t('dialog.contactSupport'),
                    onClick: _onOpenSupportLink
                });
            }

            return buttons;
        }
        case NOTIFICATION_TYPE.WARNING:
            return [
                {
                    content: t('dialog.Ok'),
                    onClick: onDismiss
                }
            ];

        default:
            if (customActionNameKey?.length && customActionHandler?.length) {
                return customActionNameKey.map((customAction: string, customActionIndex: number) => {
                    return {
                        content: t(customAction),
                        onClick: () => {
                            if (customActionHandler?.[customActionIndex]()) {
                                onDismiss();
                            }
                        },
                        type: customActionType?.[customActionIndex],
                        testId: customAction
                    };
                });
            }

            return [];
        }
    }, [ appearance, onDismiss, customActionHandler, customActionNameKey, hideErrorSupportLink ]);

    const getIcon = useCallback(() => {
        let iconToDisplay;

        switch (icon || appearance) {
        case NOTIFICATION_ICON.ERROR:
        case NOTIFICATION_ICON.WARNING:
            iconToDisplay = IconWarningCircle;
            break;
        case NOTIFICATION_ICON.SUCCESS:
            iconToDisplay = IconCheck;
            break;
        case NOTIFICATION_ICON.MESSAGE:
            iconToDisplay = IconMessage;
            break;
        case NOTIFICATION_ICON.PARTICIPANT:
            iconToDisplay = IconUser;
            break;
        case NOTIFICATION_ICON.PARTICIPANTS:
            iconToDisplay = IconUsers;
            break;
        default:
            iconToDisplay = IconInfo;
            break;
        }

        return iconToDisplay;
    }, [ icon, appearance ]);

    return (
        <div
            className = { cx(classes.container, unmounting.get(uid ?? '') && 'unmount') }
            data-testid = { titleKey || descriptionKey }
            id = { uid }>
            <div className = { cx(classes.ribbon, appearance) } />
            <div className = { classes.content }>
                <div className = { icon }>
                    <Icon
                        color = { ICON_COLOR[appearance as keyof typeof ICON_COLOR] }
                        size = { 20 }
                        src = { getIcon() } />
                </div>
                <div className = { classes.textContainer }>
                    <span className = { classes.title }>{title || t(titleKey ?? '', titleArguments)}</span>
                    {renderDescription()}
                    <div className = { classes.actionsContainer }>
                        {mapAppearanceToButtons().map(({ content, onClick, type, testId }) => (
                            <button
                                className = { cx(classes.action, type) }
                                data-testid = { testId }
                                key = { content }
                                onClick = { onClick }>
                                {content}
                            </button>
                        ))}
                    </div>
                </div>
                <Icon
                    className = { classes.closeIcon }
                    color = { theme.palette.icon04 }
                    id = 'close-notification'
                    onClick = { onDismiss }
                    size = { 20 }
                    src = { IconCloseLarge }
                    testId = { `${titleKey || descriptionKey}-dismiss` } />
            </div>
        </div>
    );
};

export default Notification;
