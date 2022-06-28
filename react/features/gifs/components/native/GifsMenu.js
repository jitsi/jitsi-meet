import { GiphyContent, GiphyGridView, GiphyMediaType } from '@giphy/react-native-sdk';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { createGifSentEvent, sendAnalytics } from '../../../analytics';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { sendMessage } from '../../../chat/actions.any';
import { goBack } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import ClearableInput from '../../../participants-pane/components/native/ClearableInput';
import { formatGifUrlMessage, getGifUrl } from '../../functions';

import styles from './styles';

const GifsMenu = () => {
    const [ searchQuery, setSearchQuery ] = useState('');
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const content = searchQuery === ''
        ? GiphyContent.trending({ mediaType: GiphyMediaType.Gif })
        : GiphyContent.search({
            searchQuery,
            mediaType: GiphyMediaType.Gif
        });

    const sendGif = useCallback(e => {
        const url = getGifUrl(e.nativeEvent.media);

        sendAnalytics(createGifSentEvent());

        dispatch(sendMessage(formatGifUrlMessage(url), true));
        goBack();
    }, []);


    const footerComponent = () => (
        <View style = { styles.credit }>
            <Text
                style = { styles.creditText }>Powered by</Text>
            <Image source = { require('../../../../../images/GIPHY_logo.png') } />
        </View>
    );

    return (
        <JitsiScreen
            /* eslint-disable-next-line react/jsx-no-bind */
            footerComponent = { footerComponent }
            style = { styles.container }>
            <ClearableInput
                customStyles = { styles.clearableInput }
                onChange = { setSearchQuery }
                placeholder = { t('giphy.search') }
                value = { searchQuery } />
            <GiphyGridView
                cellPadding = { 5 }
                content = { content }
                onMediaSelect = { sendGif }
                style = { styles.grid } />
        </JitsiScreen>
    );
};

export default GifsMenu;
