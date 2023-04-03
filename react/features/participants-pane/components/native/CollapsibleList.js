// @flow

import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import { StyleType } from '../../../base/styles/functions.native';
import styles from '../breakout-rooms/components/native/styles';

type Props = {

    /**
     * The children to be displayed within this list.
     */
    children: React$Node,

    /**
     * Additional style to be appended to the CollapsibleList container.
     */
    containerStyle?: StyleType,

    /**
     * Callback to invoke when the {@code CollapsibleList} is long pressed.
     */
    onLongPress?: Function,

    /**
     * Collapsible list title.
     */
    title: Object
}

const CollapsibleList = ({ children, containerStyle, onLongPress, title }: Props) => {
    const [ collapsed, setCollapsed ] = useState(false);
    const _toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [ collapsed ]);

    return (
        <View style = { !collapsed && containerStyle }>
            <TouchableOpacity
                onLongPress = { onLongPress }
                onPress = { _toggleCollapsed }
                style = { styles.collapsibleList }>
                <TouchableOpacity
                    onPress = { _toggleCollapsed }
                    style = { styles.arrowIcon }>
                    <Icon
                        size = { 18 }
                        src = { collapsed ? IconArrowDown : IconArrowUp } />
                </TouchableOpacity>
                <Text style = { styles.listTile }>
                    {
                        title
                    }
                </Text>
            </TouchableOpacity>
            {
                !collapsed && children
            }
        </View>
    );
};

export default CollapsibleList;
