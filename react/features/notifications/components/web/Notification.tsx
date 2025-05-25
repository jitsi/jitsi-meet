import { Theme } from '@mui/material';
import React, { isValidElement, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
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
import { getSupportUrl } from '../../../base/react/functions';
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


// Define themeColors based on _variables.scss (hardcoded for now)
const localThemeColors = {
    backgroundColorLight: '#252A3A',
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    primaryColor: '#7B61FF', // Info
    hangupRed: '#FF3B30', // Error
    warningColorOrange: '#FFA500', // Warning
    successColorGreen: '#28A745', // Success
    spacingSmall: '8px',
    spacingMedium: '16px',
};

const useStyles = makeStyles()((theme: Theme) => { // theme is Jitsi's existing MUI theme, can be used for fallbacks or typography
    return {
        container: {
            backgroundColor: localThemeColors.backgroundColorLight,
            padding: localThemeColors.spacingMedium, // Consistent padding
            display: 'flex',
            position: 'relative' as const,
            borderRadius: localThemeColors.borderRadius,
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)', // Slightly more pronounced shadow
            marginBottom: localThemeColors.spacingMedium, // Use themed spacing

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
            top: localThemeColors.spacingSmall, // Align with padding
            borderRadius: `calc(${localThemeColors.borderRadius} / 2)`, // Rounded ribbon ends

            '&.normal': {
                backgroundColor: localThemeColors.primaryColor
            },

            '&.error': {
                backgroundColor: localThemeColors.hangupRed
            },

            '&.success': {
                backgroundColor: localThemeColors.successColorGreen
            },

            '&.warning': {
                backgroundColor: localThemeColors.warningColorOrange
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
            justifyContent: 'center', // Better vertical alignment if content is short
            color: localThemeColors.textColorPrimary, // Default text color for this container
            flex: 1,
            margin: `0 ${localThemeColors.spacingMedium}`, // Use themed spacing

            // maxWidth: 100% minus the icon on left (20px) minus the close icon on the right (20px) minus the margins
            maxWidth: `calc(100% - 20px - 20px - ${localThemeColors.spacingMedium} - ${localThemeColors.spacingMedium})`,
            maxHeight: '150px' // Keep existing maxHeight
        },
        title: {
            ...withPixelLineHeight(theme.typography.bodyShortBold), // Keep existing typography for now
            color: localThemeColors.textColorPrimary, // Ensure title is primary text color
            fontWeight: 600, // Semibold title
            marginBottom: `calc(${localThemeColors.spacingSmall} / 2)` // Small gap if description follows
        },
        description: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular), // Keep existing typography
            color: localThemeColors.textColorSecondary, // Description is secondary text color
            overflow: 'auto',
            overflowWrap: 'break-word',
            userSelect: 'all',

            '&:not(:empty)': {
                marginTop: localThemeColors.spacingSmall // Use themed spacing
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
            color: localThemeColors.primaryColor, // Actions use primary color for text
            ...withPixelLineHeight(theme.typography.bodyShortBold), // Keep existing typography
            fontWeight: 600, // Semibold for actions
            marginRight: localThemeColors.spacingMedium, // Use themed spacing
            padding: 0,
            cursor: 'pointer',
            border: 'none', // Ensure no border
            '&:hover': {
                // color: lighten(localThemeColors.primaryColor, 0.1) // Optional: slightly lighten text on hover
                textDecoration: 'underline',
            },

            '&:last-of-type': {
                marginRight: 0
            },

            '&.destructive': {
                color: localThemeColors.hangupRed, // Destructive actions use error color
                // '&:hover': {
                //    color: lighten(localThemeColors.hangupRed, 0.1)
                // }
            }
        },
        closeIconContainer: { // Container for the close icon button
            display: 'flex',
            alignItems: 'flex-start', // Align to top if notification content wraps
            paddingLeft: localThemeColors.spacingSmall, // Space from text content
        },
        closeIcon: { // Applied to the Icon component for the close button
            cursor: 'pointer',
            '& svg': {
                fill: localThemeColors.textColorSecondary, // Default close icon color
            },
            '&:hover svg': {
                fill: localThemeColors.textColorPrimary, // Hover color for close icon
            }
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
    disableClosing,
    hideErrorSupportLink,
    icon,
    onDismissed,
    title,
    titleArguments,
    titleKey,
    uid
}: IProps) => {
    const { classes, cx } = useStyles(); // Removed 'theme' as we use localThemeColors now
    const { t } = useTranslation();
    const { unmounting } = useContext(NotificationsTransitionContext);
    const supportUrl = useSelector(getSupportUrl);

    // Updated ICON_COLOR map to use localThemeColors
    const ICON_COLOR_MAP = {
        error: localThemeColors.hangupRed,
        normal: localThemeColors.primaryColor,
        success: localThemeColors.successColorGreen,
        warning: localThemeColors.warningColorOrange
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

    const _onOpenSupportLink = useCallback(() => {
        window.open(supportUrl, '_blank', 'noopener');
    }, [ supportUrl ]);

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

            if (!hideErrorSupportLink && supportUrl) {
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
    }, [ appearance, onDismiss, customActionHandler, customActionNameKey, hideErrorSupportLink, supportUrl ]);

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
            aria-atomic = 'false'
            aria-live = 'polite'
            className = { cx(classes.container, (unmounting.get(uid ?? '') && 'unmount') as string | undefined) }
            data-testid = { titleKey || descriptionKey }
            id = { uid }>
            <div className = { cx(classes.ribbon, appearance) } />
            <div className = { classes.content }>
                <div className = { icon }>
                    <Icon
                        color = { ICON_COLOR_MAP[appearance as keyof typeof ICON_COLOR_MAP] }
                        size = { 20 }
                        src = { getIcon() } />
                </div>
                <div className = { classes.textContainer }>
                    <span className = { classes.title }>{title || t(titleKey ?? '', titleArguments)}</span>
                    {renderDescription()}
                    <div className = { classes.actionsContainer }>
                        {mapAppearanceToButtons().map(({ content, onClick, type, testId }) => (
                            <button
                                className = { cx(classes.action, type === 'destructive' && 'destructive') } // Apply destructive class if type matches
                                data-testid = { testId }
                                key = { content }
                                onClick = { onClick }
                                type = 'button'> {/* Explicitly type button */}
                                {content}
                            </button>
                        ))}
                    </div>
                </div>
                { !disableClosing && (
                    <div className = { classes.closeIconContainer }>
                        <Icon
                            accessibilityLabel = { t('dialog.close') }
                            className = { classes.closeIcon }
                            // color prop for Icon component might not directly take a hex, relies on fill via CSS
                            id = 'close-notification'
                            onClick = { onDismiss }
                            size = { 18 } // Slightly smaller close icon for notifications
                            src = { IconCloseLarge } // Using the updated large close icon
                            tabIndex = { 0 }
                            testId = { `${titleKey || descriptionKey}-dismiss` } />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notification;
