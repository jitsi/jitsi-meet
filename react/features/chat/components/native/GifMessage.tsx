import { GiphyMediaView } from '@giphy/react-native-sdk';
import React from 'react';
import { Image, ImageStyle, View } from 'react-native';

import { extractGifMediaId, extractGifURL } from '../../../gifs/function.any';

import styles from './styles';

interface IProps {

    /**
     * The formatted gif message.
     */
    message: string;
}

const GifMessage = ({ message }: IProps) => {
    const url = extractGifURL(message);
    const mediaId = extractGifMediaId(url);

    return (<View
        id = 'gif-message'
        style = { styles.gifContainer }>
        {mediaId
            ? <GiphyMediaView
                media = {{ id: mediaId }}
                resizeMode = 'contain'
                style = { styles.gifMedia } />
            : <Image
                source = {{ uri: url }}
                style = { styles.gifImage as ImageStyle } />}
    </View>);
};

export default GifMessage;
