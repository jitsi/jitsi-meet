// @flow

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { translate } from '../../../base/i18n';
import {
    Icon,
    IconCloseLarge,
    IconInfoCircle,
    IconUserGroups, IconWarning
} from '../../../base/icons';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { replaceNonUnicodeEmojis } from '../../../chat/functions';
import { NOTIFICATION_ICON } from '../../constants';
import AbstractNotification, {
    type Props
} from '../AbstractNotification';

import styles from './styles';


/**
 * Default value for the maxLines prop.
 *
 * @type {number}
 */
const DEFAULT_MAX_LINES = 2;

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */

const {
    error06,
    primary06,
    success05,
    warning05
} = BaseTheme.palette;

const ICON_COLOR = {
    error: error06,
    normal: primary06,
    success: success05,
    warning: warning05
};

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @augments Component
 */
class Notification extends AbstractNotification<Props> {

    /**
     * Creates action button configurations for the notification based on
     * notification appearance.
     *
     * @private
     * @returns {Object[]}
     */
    _mapAppearanceToButtons() {
        const {
            customActionHandler,
            customActionNameKey
        } = this.props;

        if (customActionNameKey?.length && customActionHandler?.length) {
            return customActionNameKey?.map((customAction: string, index: number) => (
                <Button
                    accessibilityLabel = { customAction }
                    key = { index }
                    labelKey = { customAction }
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { () => {
                        if (customActionHandler[index]()) {
                            this._onDismissed();
                        }
                    } }
                    type = { BUTTON_TYPES.TERTIARY } />)
            );
        }

        return [];
    }

    /**
     * Returns the Icon type component to be used, based on icon or appearance.
     *
     * @returns {ReactElement}
     */
    _getIcon() {
        const { appearance, icon } = this.props;

        let src;

        switch (icon || appearance) {
        case NOTIFICATION_ICON.PARTICIPANT:
            src = IconWarning;
            break;
        case NOTIFICATION_ICON.PARTICIPANTS:
            src = IconUserGroups;
            break;
        default:
            src = IconInfoCircle;
            break;
        }

        return src;
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon() {
        const { appearance } = this.props;
        const color = ICON_COLOR[appearance];

        return (
            <Icon
                color = { color }
                size = { 20 }
                src = { this._getIcon() } />
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.notification }>
                { this._mapAppearanceToIcon() }
                { this._mapAppearanceToButtons() }
                <View style = { styles.contentColumn }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.notificationContent }>
                        {
                            this._renderContent()
                        }
                    </View>
                </View>
                <TouchableOpacity onPress = { this._onDismissed }>
                    <Icon
                        src = { IconCloseLarge }
                        style = { styles.dismissIcon } />
                </TouchableOpacity>
            </View>
        );
    }

    /**
     * Renders the notification's content. If the title or title key is present
     * it will be just the title. Otherwise it will fallback to description.
     *
     * @returns {Array<ReactElement>}
     * @private
     */
    _renderContent() {
        const { maxLines = DEFAULT_MAX_LINES, t, title, titleArguments, titleKey, concatText } = this.props;
        const titleText = title || (titleKey && t(titleKey, titleArguments));
        const description = this._getDescription();
        const titleConcat = [];

        if (concatText) {
            titleConcat.push(titleText);
        }

        if (description && description.length) {
            return [ ...titleConcat, ...description ].map((line, index) => (
                <Text
                    key = { index }
                    numberOfLines = { maxLines }
                    style = { styles.contentText }>
                    { replaceNonUnicodeEmojis(line) }
                </Text>
            ));
        }

        return (
            <Text
                numberOfLines = { maxLines }
                style = { styles.contentText } >
                { titleText }
            </Text>
        );
    }

    _getDescription: () => Array<string>;

    _onDismissed: () => void;
}

export default translate(Notification);
