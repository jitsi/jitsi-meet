/* eslint-disable lines-around-comment */

import React from 'react';
import { WithTranslation } from 'react-i18next';
import { Animated, Text, View } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import {
    Icon,
    IconCloseLarge,
    IconInfoCircle,
    IconUsers,
    IconWarning
    // @ts-ignore
} from '../../../base/icons';
import { colors } from '../../../base/ui/Tokens';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_MODES, BUTTON_TYPES } from '../../../base/ui/constants.native';
import { replaceNonUnicodeEmojis } from '../../../chat/functions';
import { NOTIFICATION_ICON } from '../../constants';
import AbstractNotification, {
    type Props as AbstractNotificationProps
    // @ts-ignore
} from '../AbstractNotification';

// @ts-ignore
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


type Props = AbstractNotificationProps & WithTranslation & {
    _participants: ArrayLike<any>;
};


/**
 * Implements a React {@link Component} to display a notification.
 *
 * @augments Component
 */
class Notification extends AbstractNotification<Props> {

    /**
     * Initializes a new {@code Notification} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // @ts-ignore
        this.state = {
            notificationContainerAnimation: new Animated.Value(0)
        };
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        Animated.timing(
            // @ts-ignore
            this.state.notificationContainerAnimation,
            {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            })
            .start();
    }

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
            customActionNameKey,
            customActionType
            // @ts-ignore
        } = this.props;

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
                            this._onDismissed();
                        }
                    } }
                    style = { styles.btn }
                    type = { customActionType[index] } />
            ));
        }

        return [];
    }

    /**
     * Returns the Icon type component to be used, based on icon or appearance.
     *
     * @returns {ReactElement}
     */
    _getIcon() {
        const {
            appearance,
            icon
            // @ts-ignore
        } = this.props;

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
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon() {
        // @ts-ignore
        const { appearance } = this.props;
        // @ts-ignore
        const color = ICON_COLOR[appearance];

        return (
            <View style = { styles.iconContainer }>
                <Icon
                    color = { color }
                    size = { 24 }
                    src = { this._getIcon() } />
            </View>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // @ts-ignore
        const { icon } = this.props;
        const contentColumnStyles = icon === NOTIFICATION_ICON.PARTICIPANTS
            ? styles.contentColumn : styles.interactiveContentColumn;

        return (
            <Animated.View
                pointerEvents = 'box-none'
                style = { [
                    styles.notification,
                    {
                        // @ts-ignore
                        opacity: this.state.notificationContainerAnimation
                    }
                ] }>
                <View style = { contentColumnStyles }>
                    { this._mapAppearanceToIcon() }
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.contentContainer }>
                        { this._renderContent() }
                    </View>
                    <View style = { styles.btnContainer }>
                        { this._mapAppearanceToButtons() }
                    </View>
                </View>
                <IconButton
                    color = { BaseTheme.palette.icon04 }
                    onPress = { this._onDismissed }
                    src = { IconCloseLarge }
                    type = { BUTTON_TYPES.TERTIARY } />
            </Animated.View>
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
        // @ts-ignore
        const { icon, t, title, titleArguments, titleKey } = this.props;
        const titleText = title || (titleKey && t(titleKey, titleArguments));
        const description = this._getDescription();
        const descriptionStyles = icon === NOTIFICATION_ICON.PARTICIPANTS
            ? styles.contentTextInteractive : styles.contentText;

        if (description?.length) {
            return (
                <>
                    <Text style = { styles.contentTextTitle }>
                        { titleText }
                    </Text>
                    {
                        description.map((line, index) => (
                            <Text
                                key = { index }
                                style = { descriptionStyles }>
                                { replaceNonUnicodeEmojis(line) }
                            </Text>
                        ))
                    }
                </>
            );
        }

        return (
            <Text style = { styles.contentTextTitle }>
                { titleText }
            </Text>
        );
    }

    _getDescription: () => Array<string>;

    _onDismissed: () => void;
}


// @ts-ignore
export default translate(Notification);
