// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableHighlight } from 'react-native';

import { Icon } from '../../../base/icons';
import { RECORD_TYPE } from '../../constants';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link RecordItem}.
 */
type Props = {

    /**
     * The id of the record.
     */
    id: String,

    /**
     * The name of the record.
     */
    name: String,

    /**
     * The handler for the click event.
     */
    onClick: Function,

    /**
     * The type of the record.
     */
    type: String
}

/**
 * Component to render Record data.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element<any>}
 */
export const RecordItem = ({
    id,
    name,
    type,
    /* eslint-disable-next-line no-empty-function */
    onClick = () => {}
}: Props) => {
    const { t } = useTranslation();
    const IconRecord = RECORD_TYPE[type].icon;

    return (
        <TouchableHighlight onPress = { onClick }>
            <View
                key = { `record-${id}` }
                style = { styles.recordItem }
                title = { name }>
                <View style = { styles.recordTypeIcon }>
                    {IconRecord && (
                        <Icon
                            src = { IconRecord }
                            style = { styles.recordIcon } />
                    )}
                </View>
                <View style = { styles.recordDetails }>
                    <Text
                        key = { name }
                        numberOfLines = { 1 }
                        style = { styles.recordName }>
                        {name}
                    </Text>
                    <Text
                        key = { type }
                        style = { styles.recordType }>
                        {t(RECORD_TYPE[type].label)}
                    </Text>
                </View>
            </View>
        </TouchableHighlight>
    );
};
