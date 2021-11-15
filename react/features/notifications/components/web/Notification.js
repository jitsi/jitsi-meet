// @flow

import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import React from 'react';

import { translate } from '../../../base/i18n';
import { colors } from '../../../base/ui/Tokens';
import { NOTIFICATION_TYPE } from '../../constants';
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

        // the id is used for testing the UI
        return (
            <p data-testid = { this._getDescriptionKey() } >
                { description }
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
            if (this.props.customActionNameKey && this.props.customActionHandler) {
                return [
                    {
                        content: this.props.t(this.props.customActionNameKey),
                        onClick: () => {
                            if (this.props.customActionHandler()) {
                                this._onDismissed();
                            }
                        }
                    }
                ];
            }

            return [];
        }
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon() {
        const appearance = this.props.appearance;
        const secIconColor = ICON_COLOR[this.props.appearance];
        const iconSize = 'medium';

        return (<>
            <div className = { `ribbon ${appearance}` } />
            <EditorInfoIcon
                label = { appearance }
                secondaryColor = { secIconColor }
                size = { iconSize } />
        </>);
    }
}

export default translate(Notification);
