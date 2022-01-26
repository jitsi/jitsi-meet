// @flow

import Flag from '@atlaskit/flag';
import EditorErrorIcon from '@atlaskit/icon/glyph/editor/error';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import EditorSuccessIcon from '@atlaskit/icon/glyph/editor/success';
import EditorWarningIcon from '@atlaskit/icon/glyph/editor/warning';
import PeopleIcon from '@atlaskit/icon/glyph/people';
import PersonIcon from '@atlaskit/icon/glyph/person';
import QuestionsIcon from '@atlaskit/icon/glyph/questions';
import React, { isValidElement } from 'react';

import { translate } from '../../../base/i18n';
import Message from '../../../base/react/components/web/Message';
import { colors } from '../../../base/ui/Tokens';
import { NOTIFICATION_ICON, NOTIFICATION_TYPE } from '../../constants';
import AbstractNotification, {
    type Props
} from '../AbstractNotification';

declare var interfaceConfig: Object;

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */
const ICON_COLOR = {
    error: colors.error06,
    normal: colors.primary06,
    warning: colors.warning05
};

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @augments Component
 */
class Notification extends AbstractNotification<Props> {
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
                testId = { titleKey }
                title = { title || t(titleKey, titleArguments) } />
        );
    }

    _getDescription: () => Array<string>;

    _getDescriptionKey: () => string;

    _onDismissed: () => void;

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
    _mapAppearanceToButtons(hideErrorSupportLink) {
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
        let Icon;

        switch (this.props.icon || this.props.appearance) {
        case NOTIFICATION_ICON.ERROR:
            Icon = EditorErrorIcon;
            break;
        case NOTIFICATION_ICON.WARNING:
            Icon = EditorWarningIcon;
            break;
        case NOTIFICATION_ICON.SUCCESS:
            Icon = EditorSuccessIcon;
            break;
        case NOTIFICATION_ICON.MESSAGE:
            Icon = QuestionsIcon;
            break;
        case NOTIFICATION_ICON.PARTICIPANT:
            Icon = PersonIcon;
            break;
        case NOTIFICATION_ICON.PARTICIPANTS:
            Icon = PeopleIcon;
            break;
        default:
            Icon = EditorInfoIcon;
            break;
        }

        return Icon;
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
        const secIconColor = ICON_COLOR[appearance];
        const iconSize = 'medium';
        const Icon = this._getIcon();

        return (<div className = { icon }>
            <div className = { `ribbon ${appearance}` } />
            <Icon
                label = { appearance }
                secondaryColor = { secIconColor }
                size = { iconSize } />
        </div>);
    }
}

export default translate(Notification);
