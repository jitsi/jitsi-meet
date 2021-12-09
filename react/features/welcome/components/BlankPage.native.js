// @flow

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { readyToClose } from '../../mobile/external-api/actions';

import styles from './styles';


const BlankPage = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    /**
     * Destroys the local tracks (if any) since no media is desired when this
     * component is rendered.
     */
    useEffect(() => {
        dispatch(readyToClose());
    }, []);

    return (
        <View style = { styles.blankPageWrapper }>
            <Text style = { styles.blankPageText }>
                { t('blankPage.meetingEnded') }
            </Text>
        </View>
    );
};

export default BlankPage;
