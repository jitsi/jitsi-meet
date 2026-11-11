/* eslint-disable react/no-multi-comp */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

import { QUICK_REACTIONS } from '../../constants';

import styles from './styles';

interface IProps {
    onSelect: (emoji: string) => void;
}

interface IItemProps {
    emoji: string;
    label: string;
    onSelect: (emoji: string) => void;
}

/**
 * One quick reaction button.
 *
 * @returns {JSX.Element}
 */
const EmojiItem = ({ emoji, label, onSelect }: IItemProps) => {
    const onPress = useCallback(() => onSelect(emoji), [ emoji, onSelect ]);

    return (
        <TouchableOpacity
            accessibilityLabel = { label }
            accessibilityRole = 'button'
            onPress = { onPress }
            style = { styles.emojiSelectorItem as ViewStyle }>
            <Text style = { styles.emojiSelectorEmoji as TextStyle }>{ emoji }</Text>
        </TouchableOpacity>
    );
};

/**
 * The row of quick reactions, the same set as the web EmojiSelector.
 *
 * @returns {JSX.Element}
 */
const EmojiSelector = ({ onSelect }: IProps) => {
    const { t } = useTranslation();

    return (
        <View style = { styles.emojiSelector as ViewStyle }>
            { QUICK_REACTIONS.map(({ emoji, labelKey, name }) => (
                <EmojiItem
                    emoji = { emoji }
                    key = { name }
                    label = { t(labelKey) }
                    onSelect = { onSelect } />
            )) }
        </View>
    );
};

export default EmojiSelector;
