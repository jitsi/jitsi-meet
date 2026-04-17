import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import styles from './styles';

interface IProps {

    /**
     * Translation key for the action button.
     */
    actionLabelKey: string;

    /**
     * Button type for the action button.
     */
    actionType?: BUTTON_TYPES;

    /**
     * Whether to use compact styling (no background, less padding).
     */
    compact?: boolean;

    /**
     * Whether the action button should be disabled.
     */
    disabled?: boolean;

    /**
     * The icon component to display.
     */
    icon: Function;

    /**
     * Whether this item's action is in progress.
     */
    isLoading?: boolean;

    /**
     * Secondary text (type label, company, stage, etc.).
     */
    metadata?: string;

    /**
     * The primary display name.
     */
    name: string;

    /**
     * Click handler for the action button.
     */
    onAction: () => void;
}

/**
 * Reusable list item component for Salesforce records with an action button.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const RecordListItem = ({
    actionLabelKey,
    actionType = BUTTON_TYPES.PRIMARY,
    compact = false,
    disabled = false,
    icon,
    isLoading = false,
    metadata,
    name,
    onAction
}: IProps) => {
    const itemStyle = compact ? styles.listItemCompact : styles.listItem;

    return (
        <View style = { itemStyle as ViewStyle }>
            <View style = { styles.listItemIcon as ViewStyle }>
                <Icon
                    size = { 24 }
                    src = { icon } />
            </View>
            <View style = { styles.listItemInfo as ViewStyle }>
                <Text
                    numberOfLines = { 1 }
                    style = { styles.listItemName }>
                    {name}
                </Text>
                {metadata && (
                    <Text style = { styles.listItemMeta }>
                        {metadata}
                    </Text>
                )}
            </View>
            <View style = { styles.listItemButtonContainer as ViewStyle }>
                {isLoading ? (
                    <View style = { styles.listItemSpinnerContainer as ViewStyle }>
                        <LoadingIndicator size = 'small' />
                    </View>
                ) : (
                    <Button
                        disabled = { disabled }
                        labelKey = { actionLabelKey }
                        onClick = { onAction }
                        type = { actionType } />
                )}
            </View>
        </View>
    );
};

export default RecordListItem;
