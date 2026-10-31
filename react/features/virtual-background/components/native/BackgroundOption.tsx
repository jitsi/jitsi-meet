import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import styles from './styles';

/** Props for a selectable background option. */
interface IProps {
    /** ID of the currently selected option. */
    choice?: string;
    /** Whether selecting this option is disabled. */
    disabled: boolean;
    /** Selects the option with the given ID. */
    onSelect: (id: string) => void;
    /** Background choice to render. */
    option: {
        /** Stable identifier of the option. */
        id: string;
        /** Translation key for the option label. */
        title: string;
        /** URI of the option image, when available. */
        uri?: string;
    };
}

/**
 * Renders a selectable background option with an optional image.
 *
 * @returns {JSX.Element} The rendered background option.
 */
export default function BackgroundOption({ choice, disabled, onSelect, option }: IProps) {
    const { t } = useTranslation();
    const checked = choice === option.id;
    const handleSelect = useCallback(() => onSelect(option.id), [ onSelect, option.id ]);

    return (
        <Pressable
            accessibilityLabel = { t(option.title) }
            accessibilityRole = 'radio'
            accessibilityState = {{ checked, disabled }}
            disabled = { disabled }
            onPress = { handleSelect }
            style = { [ styles.option, checked && styles.selected ] }>
            { option.uri && (
                <View style = { styles.thumbnail }>
                    <Image
                        resizeMode = 'cover'
                        source = {{ uri: option.uri }}
                        style = { styles.thumbnailImage } />
                </View>
            ) }
            <View style = { styles.optionFooter }>
                <Text
                    numberOfLines = { 2 }
                    style = { styles.optionLabel }>
                    { t(option.title) }
                </Text>
            </View>
        </Pressable>
    );
}
