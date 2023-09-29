import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TextStyle, View, ViewStyle } from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import {
    IconCloseLarge,
    IconInfoCircle,
    IconUsers,
    IconWarning
} from '../../../base/icons/svg';
import { colors } from '../../../base/ui/Tokens';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_MODES, BUTTON_TYPES } from '../../../base/ui/constants.native';
import { replaceNonUnicodeEmojis } from '../../../chat/functions';
import { NOTIFICATION_ICON, NOTIFICATION_TYPE } from '../../constants';
import { INotificationProps } from '../../types';
import { NotificationsTransitionContext } from '../NotificationsTransition';

import styles from './styles';


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


export interface IProps extends INotificationProps {
    _participants: ArrayLike<any>;
    onDismissed: Function;
}

const Notification = ({
    appearance = NOTIFICATION_TYPE.NORMAL,
    customActionHandler,
    customActionNameKey,
    customActionType,
    description,
    descriptionArguments,
    descriptionKey,
    icon,
    onDismissed,
    title,
    titleArguments,
    titleKey,
    uid
}: IProps) => {
    const { t } = useTranslation();
    const notificationOpacityAnimation = useRef(new Animated.Value(0)).current;
    const { unmounting } = useContext(NotificationsTransitionContext);

    useEffect(() => {
        Animated.timing(
            notificationOpacityAnimation,
            {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
            .start();
    }, []);

    useEffect(() => {
        if (unmounting.get(uid ?? '')) {
            Animated.timing(
                notificationOpacityAnimation,
                {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                })
                .start();
        }
    }, [ unmounting ]);

    const onDismiss = useCallback(() => {
        onDismissed(uid);
    }, [ onDismissed, uid ]);

    const mapAppearanceToButtons = () => {
        if (customActionNameKey?.length && customActionHandler?.length && customActionType?.length) {
            return customActionNameKey?.map((customAction: string, index: number) => (
                <Button
                    accessibilityLabel = { customAction }
                    key = { index }
                    labelKey = { customAction }
                    mode = { BUTTON_MODES.TEXT }
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { () => {
                        if (customActionHandler[index]()) {
                            onDismiss();
                        }
                    } }
                    style = { styles.btn }

                    // @ts-ignore
                    type = { customActionType[index] } />
            ));
        }

        return [];
    };

    const getIcon = () => {
        let src;

        switch (icon || appearance) {
        case NOTIFICATION_ICON.PARTICIPANT:
            src = IconInfoCircle;
            break;
        case NOTIFICATION_ICON.PARTICIPANTS:
            src = IconUsers;
            break;
        case NOTIFICATION_ICON.WARNING:
            src = IconWarning;
            break;
        default:
            src = IconInfoCircle;
            break;
        }

        return src;
    };

    const _getDescription = () => {
        const descriptionArray = [];

        descriptionKey
            && descriptionArray.push(t(descriptionKey, descriptionArguments));

        description && descriptionArray.push(description);

        return descriptionArray;
    };

    // eslint-disable-next-line react/no-multi-comp
    const _renderContent = () => {
        const titleText = title || (titleKey && t(titleKey, titleArguments));
        const descriptionArray = _getDescription();

        if (descriptionArray?.length) {
            return (
                <>
                    <Text style = { styles.contentTextTitle as TextStyle }>
                        {titleText}
                    </Text>
                    {
                        descriptionArray.map((line, index) => (
                            <Text
                                key = { index }
                                style = { styles.contentText }>
                                {replaceNonUnicodeEmojis(line)}
                            </Text>
                        ))
                    }
                </>
            );
        }

        return (
            <Text style = { styles.contentTextTitle as TextStyle }>
                {titleText}
            </Text>
        );
    };

    return (
        <Animated.View
            pointerEvents = 'box-none'
            style = { [
                _getDescription()?.length
                    ? styles.notificationWithDescription
                    : styles.notification,
                {
                    opacity: notificationOpacityAnimation
                }
            ] as ViewStyle[] }>
            <View
                style = { (icon === NOTIFICATION_ICON.PARTICIPANTS
                    ? styles.contentColumn
                    : styles.interactiveContentColumn) as ViewStyle }>
                <View style = { styles.iconContainer as ViewStyle }>
                    <Icon
                        color = { ICON_COLOR[appearance as keyof typeof ICON_COLOR] }
                        size = { 24 }
                        src = { getIcon() } />
                </View>
                <View
                    pointerEvents = 'box-none'
                    style = { styles.contentContainer }>
                    {_renderContent()}
                </View>
                <View style = { styles.btnContainer as ViewStyle }>
                    {mapAppearanceToButtons()}
                </View>
            </View>
            <IconButton
                color = { BaseTheme.palette.icon04 }
                onPress = { onDismiss }
                src = { IconCloseLarge }
                type = { BUTTON_TYPES.TERTIARY } />
        </Animated.View>
    );

};

export default Notification;
