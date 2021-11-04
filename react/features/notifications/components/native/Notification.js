// @flow

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import AbstractNotification, {
    type Props
} from '../AbstractNotification';

import styles from './styles';

/**
 * Default value for the maxLines prop.
 *
 * @type {number}
 */
const DEFAULT_MAX_LINES = 1;

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
        const { isDismissAllowed } = this.props;

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.notification }>
                <View style = { styles.contentColumn }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.notificationContent }>
                        {
                            this._renderContent()
                        }
                    </View>
                </View>
                {
                    isDismissAllowed
                    && <TouchableOpacity onPress = { this._onDismissed }>
                        <Icon
                            src = { IconClose }
                            style = { styles.dismissIcon } />
                    </TouchableOpacity>
                }
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
                    { line }
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
