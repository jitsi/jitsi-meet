import React, { useCallback } from 'react';
import { StyleProp, TouchableHighlight, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import Icon from '../../../base/icons/components/Icon';
import { IconCheck } from '../../../base/icons/svg';

import styles from './styles';

interface IProps {

    /**
     * The language code this item selects, or null for the "off" item.
     */
    code: string | null;

    /**
     * The label shown for the item.
     */
    label: string;

    /**
     * Invoked with the item's code when the item is pressed.
     */
    onSelect: (code: string | null) => void;

    /**
     * Whether this item is the current selection.
     */
    selected: boolean;
}

/**
 * A row in the native audio-translation language selector.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioTranslationLanguageItem = ({ code, label, onSelect, selected }: IProps) => {
    const onPress = useCallback(() => onSelect(code), [ code, onSelect ]);

    return (
        <View style = { styles.languageItemWrapper as StyleProp<ViewStyle> }>
            <View style = { styles.iconWrapper as StyleProp<ViewStyle> }>
                { selected && <Icon
                    size = { 20 }
                    src = { IconCheck } /> }
            </View>
            <TouchableHighlight
                onPress = { onPress }
                underlayColor = { 'transparent' }>
                <Text style = { [ styles.languageItemText, selected && styles.selectedLanguageItemText ] }>
                    { label }
                </Text>
            </TouchableHighlight>
        </View>
    );
};

export default AudioTranslationLanguageItem;
