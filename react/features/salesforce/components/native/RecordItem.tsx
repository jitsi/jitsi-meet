import React from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent, Text, TextStyle, TouchableHighlight, View, ViewStyle } from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import { RECORD_TYPE } from '../../constants';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link RecordItem}.
 */
interface IProps {

    /**
     * The id of the record.
     */
    id?: string;

    /**
     * The name of the record.
     */
    name?: string;

    /**
     * The handler for the click event.
     */
    onClick?: (e?: GestureResponderEvent | React.MouseEvent) => void;

    /**
     * The type of the record.
     */
    type?: string;
}

/**
 * Component to render Record data.
 *
 * @param {IProps} props - The props of the component.
 * @returns {React$Element<any>}
 */
export const RecordItem = ({
    id,
    name,
    type,
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    onClick = () => {}
}: IProps) => {
    const { t } = useTranslation();
    const IconRecord = RECORD_TYPE[type ?? ''].icon;

    return (
        <TouchableHighlight onPress = { onClick }>
            <View
                key = { `record-${id}` }
                style = { styles.recordItem as ViewStyle }

                // @ts-ignore
                title = { name }>
                <View style = { styles.recordTypeIcon as ViewStyle }>
                    {IconRecord && (
                        <Icon
                            src = { IconRecord }
                            style = { styles.recordIcon } />
                    )}
                </View>
                <View style = { styles.recordDetails as ViewStyle }>
                    <Text
                        key = { name }
                        numberOfLines = { 1 }
                        style = { styles.recordName as TextStyle }>
                        {name}
                    </Text>
                    <Text
                        key = { type }
                        style = { styles.recordType }>
                        {t(RECORD_TYPE[type ?? ''].label)}
                    </Text>
                </View>
            </View>
        </TouchableHighlight>
    );
};
