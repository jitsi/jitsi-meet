import React, { useCallback } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import Icon from '../../../../base/icons/components/Icon';
import { IconCheck } from '../../../../base/icons/svg';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

interface IProps {

    /**
     * Whether the row can be selected.
     */
    disabled?: boolean;

    /**
     * The already translated label of the row.
     */
    label: string;

    /**
     * Callback invoked with the row value on selection.
     */
    onSelect: (value: string) => void;

    /**
     * Whether the row is the selected one.
     */
    selected: boolean;

    /**
     * The value the row represents.
     */
    value: string;
}

const styles = {
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingVertical: BaseTheme.spacing[2]
    } as ViewStyle,

    iconWrapper: {
        alignItems: 'center',
        width: BaseTheme.spacing[5]
    } as ViewStyle,

    label: {
        color: BaseTheme.palette.text01
    },

    labelSelected: {
        fontWeight: 'bold' as const
    },

    disabled: {
        opacity: 0.5
    }
};

/**
 * A selectable row of the inline pickers (storage service, transcription
 * language) used by the native recording dialog.
 *
 * @returns {JSX.Element}
 */
const RecordingOptionRow = ({ disabled, label, onSelect, selected, value }: IProps) => {
    const onPress = useCallback(() => onSelect(value), [ onSelect, value ]);

    return (
        <TouchableOpacity
            accessibilityLabel = { label }
            accessibilityRole = 'button'
            accessibilityState = {{ disabled: Boolean(disabled), selected }}
            disabled = { disabled }
            onPress = { onPress }
            style = { [ styles.row, disabled && styles.disabled ] }>
            <View style = { styles.iconWrapper }>
                { selected && <Icon
                    size = { 20 }
                    src = { IconCheck } /> }
            </View>
            <Text style = { [ styles.label, selected && styles.labelSelected ] }>
                { label }
            </Text>
        </TouchableOpacity>
    );
};

export default RecordingOptionRow;
