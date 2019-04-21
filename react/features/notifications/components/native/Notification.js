// @flow

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '../../../base/font-icons';
import { translate } from '../../../base/i18n';

import AbstractNotification, {
    type Props
} from '../AbstractNotification';

import styles from './styles';

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @extends Component
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
            isDismissAllowed
        } = this.props;

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
                            name = { 'close' }
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
        const { t, title, titleArguments, titleKey } = this.props;
        const titleText = title || (titleKey && t(titleKey, titleArguments));

        if (titleText) {
            return (
                <Text
                    numberOfLines = { 1 }
                    style = { styles.contentText } >
                    { titleText }
                </Text>
            );
        }

        return this._getDescription().map((line, index) => (
            <Text
                key = { index }
                numberOfLines = { 1 }
                style = { styles.contentText }>
                { line }
            </Text>
        ));
    }

    _getDescription: () => Array<string>;

    _onDismissed: () => void;
}

export default translate(Notification);
