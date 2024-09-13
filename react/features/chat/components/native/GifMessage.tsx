import React from 'react';
import { Image, ImageStyle, View } from 'react-native';

import { extractGifURL } from '../../../gifs/function.any';

import styles from './styles';

interface IProps {

    /**
     * The formatted gif message.
     */
    message: string;
}

const GifMessage = ({ message }: IProps) => {
    const url = extractGifURL(message);

    return (<View
        id = 'gif-message'
        style = { styles.gifContainer }>
        <Image
            source = {{ uri: url }}
            style = { styles.gifImage as ImageStyle } />
    </View>);
};

export default GifMessage;
