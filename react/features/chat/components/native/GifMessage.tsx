import React from 'react';
import { Image, ImageStyle, View } from 'react-native';

import { GIF_PREFIX } from '../../../gifs/constants';

import styles from './styles';

interface IProps {

    /**
     * The formatted gif message.
     */
    message: string;
}

const GifMessage = ({ message }: IProps) => {
    const url = message.substring(GIF_PREFIX.length, message.length - 1);

    return (<View
        style = { styles.gifContainer }>
        <Image
            source = {{ uri: url }}
            style = { styles.gifImage as ImageStyle } />
    </View>);
};

export default GifMessage;
