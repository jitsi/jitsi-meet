import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import Icon from '../../../base/icons/components/Icon';
import { IconCheck } from '../../../base/icons/svg';

import styles from './styles';

interface IProps {
    disable: () => { type: string; };
    enable: () => { type: string; };
    enabled: boolean;
    labelKey: string;
}

/**
 * One "Allow non-moderators to:" row. Moderation on means not allowed, so no check and not selected.
 *
 * @returns {JSX.Element}
 */
const ModerationRow = ({ disable, enable, enabled, labelKey }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const onPress = useCallback(
        () => dispatch(enabled ? disable() : enable()), [ disable, dispatch, enable, enabled ]);

    return (
        <TouchableOpacity
            accessibilityLabel = { t(labelKey) }
            accessibilityRole = 'button'
            accessibilityState = {{ selected: !enabled }}
            onPress = { onPress }
            style = { styles.contextMenuItem as ViewStyle }>
            {!enabled && <Icon
                size = { 24 }
                src = { IconCheck } />}
            <Text style = { enabled ? styles.contextMenuItemTextNoIcon : styles.contextMenuItemText }>
                {t(labelKey)}
            </Text>
        </TouchableOpacity>
    );
};

export default ModerationRow;
