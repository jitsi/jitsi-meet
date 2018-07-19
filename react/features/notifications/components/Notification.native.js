// @flow

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '../../base/font-icons';
import { translate } from '../../base/i18n';

import { NOTIFICATION_TYPE } from '../constants';

import AbstractNotification, {
    type Props
} from './AbstractNotification';
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
            appearance,
            isDismissAllowed,
            t,
            title,
            titleArguments,
            titleKey
        } = this.props;

        let notificationStyle;

        switch (appearance) {
        case NOTIFICATION_TYPE.ERROR:
            notificationStyle = styles.notificationTypeError;
            break;
        case NOTIFICATION_TYPE.NORMAL:
            notificationStyle = styles.notificationTypeNormal;
            break;
        case NOTIFICATION_TYPE.SUCCESS:
            notificationStyle = styles.notificationTypeSuccess;
            break;
        case NOTIFICATION_TYPE.WARNING:
            notificationStyle = styles.notificationTypeWarning;
            break;
        case NOTIFICATION_TYPE.INFO:
        default:
            notificationStyle = styles.notificationTypeInfo;
        }

        return (
            <View
                pointerEvents = 'box-none'
                style = { [
                    styles.notification,
                    notificationStyle
                ] }>
                <View style = { styles.contentColumn }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.notificationTitle }>
                        <Text style = { styles.titleText }>
                            {
                                title || t(titleKey, titleArguments)
                            }
                        </Text>
                    </View>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.notificationContent }>
                        {
                            // eslint-disable-next-line no-extra-parens
                            this._getDescription().map((line, index) => (
                                <Text
                                    key = { index }
                                    style = { styles.contentText }>
                                    { line }
                                </Text>
                            ))
                        }
                    </View>
                </View>
                {
                    isDismissAllowed
                    && <View style = { styles.actionColumn }>
                        <TouchableOpacity onPress = { this._onDismissed }>
                            <Icon
                                name = { 'close' }
                                style = { styles.dismissIcon } />
                        </TouchableOpacity>
                    </View>
                }
            </View>
        );
    }

    _getDescription: () => Array<string>;

    _onDismissed: () => void;
}

export default translate(Notification);
