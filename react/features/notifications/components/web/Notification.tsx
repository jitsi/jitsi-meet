import Flag from '@atlaskit/flag';
import React, { isValidElement } from 'react';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCheck, IconInfo, IconMessage, IconUser, IconUsers, IconWarningCircle } from '../../../base/icons/svg';
import Message from '../../../base/react/components/web/Message';
import { colors } from '../../../base/ui/Tokens';
import { NOTIFICATION_ICON, NOTIFICATION_TYPE } from '../../constants';
import AbstractNotification, { IProps } from '../AbstractNotification';

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */
const ICON_COLOR = {
    error: colors.error06,
    normal: colors.primary06,
    success: colors.success05,
    warning: colors.warning05
};

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @augments Component
 */
class Notification extends AbstractNotification<IProps> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            hideErrorSupportLink,
            t,
            title,
            titleArguments,
            titleKey,
            uid
        } = this.props;

        return (
            <Flag
                actions = { this._mapAppearanceToButtons(hideErrorSupportLink) }
                description = { this._renderDescription() }
                icon = { this._mapAppearanceToIcon() }
                id = { uid }
                testId = { titleKey || this._getDescriptionKey() }
                title = { title || t(titleKey, titleArguments) } />
        );
    }

    /**
     * Creates a {@code ReactElement} for displaying the contents of the
     * notification.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderDescription() {
        const description = this._getDescription();

        // Keeping in mind that:
        // - Notifications that use the `translateToHtml` function get an element-based description array with one entry
        // - Message notifications receive string-based description arrays that might need additional parsing
        // We look for ready-to-render elements, and if present, we roll with them
        // Otherwise, we use the Message component that accepts a string `text` prop
        const shouldRenderHtml = description.length === 1 && isValidElement(description[0]);

        // the id is used for testing the UI
        return (
            <p data-testid = { this._getDescriptionKey() } >
                { shouldRenderHtml ? description : <Message text = { description.join(' ') } /> }
            </p>
        );
    }

    /**
     * Opens the support page.
     *
     * @returns {void}
     * @private
     */
    _onOpenSupportLink() {
        window.open(interfaceConfig.SUPPORT_URL, '_blank', 'noopener');
    }

    /**
     * Creates action button configurations for the notification based on
     * notification appearance.
     *
     * @param {boolean} hideErrorSupportLink - Indicates if the support link
     * should be hidden in the error messages.
     * @private
     * @returns {Object[]}
     */
    _mapAppearanceToButtons(hideErrorSupportLink: boolean) {
        switch (this.props.appearance) {
        case NOTIFICATION_TYPE.ERROR: {
            const buttons = [
                {
                    content: this.props.t('dialog.dismiss'),
                    onClick: this._onDismissed
                }
            ];

            if (!hideErrorSupportLink && interfaceConfig.SUPPORT_URL) {
                buttons.push({
                    content: this.props.t('dialog.contactSupport'),
                    onClick: this._onOpenSupportLink
                });
            }

            return buttons;
        }
        case NOTIFICATION_TYPE.WARNING:
            return [
                {
                    content: this.props.t('dialog.Ok'),
                    onClick: this._onDismissed
                }
            ];

        default:
            if (this.props.customActionNameKey?.length && this.props.customActionHandler?.length) {
                return this.props.customActionNameKey.map((customAction: string, customActionIndex: number) => {
                    return {
                        content: this.props.t(customAction),
                        onClick: () => {
                            if (this.props.customActionHandler[customActionIndex]()) {
                                this._onDismissed();
                            }
                        },
                        testId: customAction
                    };
                });
            }

            return [];
        }
    }

    /**
     * Returns the Icon type component to be used, based on icon or appearance.
     *
     * @returns {ReactElement}
     */
    _getIcon() {
        let icon;

        switch (this.props.icon || this.props.appearance) {
        case NOTIFICATION_ICON.ERROR:
        case NOTIFICATION_ICON.WARNING:
            icon = IconWarningCircle;
            break;
        case NOTIFICATION_ICON.SUCCESS:
            icon = IconCheck;
            break;
        case NOTIFICATION_ICON.MESSAGE:
            icon = IconMessage;
            break;
        case NOTIFICATION_ICON.PARTICIPANT:
            icon = IconUser;
            break;
        case NOTIFICATION_ICON.PARTICIPANTS:
            icon = IconUsers;
            break;
        default:
            icon = IconInfo;
            break;
        }

        return icon;
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon() {
        const { appearance, icon } = this.props;
        const iconColor = ICON_COLOR[appearance as keyof typeof ICON_COLOR];
        const iconSrc = this._getIcon();

        return (<div className = { icon }>
            <div className = { `ribbon ${appearance}` } />
            <Icon
                color = { iconColor }
                size = { 20 }
                src = { iconSrc } />
        </div>);
    }
}

export default translate(Notification);
