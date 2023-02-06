/* eslint-disable lines-around-comment */

import React from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { IReduxState } from '../../../app/types';
// @ts-ignore
import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n/functions';
import {
    Icon,
    IconCloseLarge,
    IconInfoCircle,
    IconUsers,
    IconWarning
    // @ts-ignore
} from '../../../base/icons';
import { getRemoteParticipants } from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import { colors } from '../../../base/ui/Tokens';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { replaceNonUnicodeEmojis } from '../../../chat/functions';
import { getKnockingParticipants } from '../../../lobby/functions';
import { NOTIFICATION_ICON } from '../../constants';
import AbstractNotification, {
    type Props as AbstractNotificationProps
    // @ts-ignore
} from '../AbstractNotification';

// @ts-ignore
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
            // @ts-ignore
        } = this.props;

        if (customActionNameKey?.length && customActionHandler?.length) {
            return customActionNameKey?.map((customAction: string, index: number) => {
                let buttonLabelStyle: Object | undefined;

                if (customAction === 'lobby.reject') {
                    buttonLabelStyle = styles.rejectBtnLabel;
                } else {
                    buttonLabelStyle = styles.btnLabel;
                }

                return (
                    <Button
                        accessibilityLabel = { customAction }
                        key = { index }
                        labelKey = { customAction }
                        labelStyle = { buttonLabelStyle }
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick = { () => {
                            if (customActionHandler[index]()) {
                                this._onDismissed();
                            }
                        } }
                        type = { BUTTON_TYPES.TERTIARY }
                        useRippleColor = { false } />
                );
            });
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
            src = IconWarning;
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
        const { appearance, icon } = this.props;
        // @ts-ignore
        const color = ICON_COLOR[appearance];
        const iconContainerStyles = icon === NOTIFICATION_ICON.PARTICIPANTS
            ? styles.iconContainerInteractive : styles.iconContainer;

        return (
            <View style = { iconContainerStyles }>
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
        const { _participants, icon } = this.props;
        const oneParticipant = _participants.length === 1;
        const contentColumnStyles = icon === NOTIFICATION_ICON.PARTICIPANTS
            ? styles.contentColumn : styles.interactiveContentColumn;

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.notification }>
                <View style = { contentColumnStyles }>
                    { oneParticipant ? this._renderAvatar() : this._mapAppearanceToIcon() }
                    <View pointerEvents = 'box-none'>
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
        // @ts-ignore
        const { icon, maxLines = DEFAULT_MAX_LINES, t, title, titleArguments, titleKey, concatText } = this.props;
        const titleText = title || (titleKey && t(titleKey, titleArguments));
        const description = this._getDescription();
        const titleConcat = [];
        const descriptionStyles = icon === NOTIFICATION_ICON.PARTICIPANTS
            ? styles.contentTextInteractive : styles.contentText;

        if (concatText) {
            titleConcat.push(titleText);
        }

        if (description?.length) {
            return [ ...titleConcat, ...description ].map((line, index) => (
                <Text
                    key = { index }
                    numberOfLines = { maxLines }
                    style = { descriptionStyles }>
                    { replaceNonUnicodeEmojis(line) }
                </Text>
            ));
        }

        return (
            <Text
                numberOfLines = { maxLines }>
                { titleText }
            </Text>
        );
    }

    /**
     * Renders the avatar.
     *
     * @returns {Array<ReactElement>}
     * @private
     */
    _renderAvatar() {
        // @ts-ignore
        const { _participants } = this.props;

        return (
            <>
                {
                    _participants?.map((p: any, index: number) => (
                        <View
                            key = { index }
                            style = { styles.avatarContainer }>
                            <Avatar
                                displayName = { p.name }
                                participantId = { p.id }
                                size = { 32 } />
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.avatarText }>
                                { p.name }
                            </Text>
                        </View>
                    ))
                }
            </>
        );
    }

    _getDescription: () => Array<string>;

    _onDismissed: () => void;
}

/**
 * Maps (parts of) the redux state to the associated {@code Notification}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState) {
    const knockingParticipants = getKnockingParticipants(state);
    const remoteParticipants = getRemoteParticipants(state);

    return {
        _participants: knockingParticipants || remoteParticipants
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(Notification));
