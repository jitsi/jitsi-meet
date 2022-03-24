import { GiphyContent, GiphyGridView, GiphyMediaType } from '@giphy/react-native-sdk';
import React, { useCallback, useState } from 'react';
import { Image, Keyboard, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

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

    const onScroll = useCallback(Keyboard.dismiss, []);

    return (<JitsiScreen
        style = { styles.container }>
        <ClearableInput
            autoFocus = { true }
            customStyles = { styles.clearableInput }
            onChange = { setSearchQuery }
            placeholder = 'Search GIPHY'
            value = { searchQuery } />
        <GiphyGridView
            cellPadding = { 5 }
            content = { content }
            onMediaSelect = { sendGif }
            onScroll = { onScroll }
            style = { styles.grid } />
        <View
            style = { [ styles.credit, {
                bottom: insets.bottom,
                left: insets.left,
                right: insets.right
            } ] }>
            <Text
                style = { styles.creditText }>Powered by</Text>
            <Image source = { require('../../../../../images/GIPHY_logo.png') } />
        </View>
    </JitsiScreen>);
};

export default GifsMenu;
