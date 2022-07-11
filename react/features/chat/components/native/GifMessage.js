import React from 'react';
import { Image, View } from 'react-native';

import { GIF_PREFIX } from '../../../gifs/constants';

import styles from './styles';

type Props = {

    /**
     * The formatted gif message.
     */
    message: string
}

const GifMessage = ({ message }: Props) => {
    const url = message.substring(GIF_PREFIX.length, message.length - 1);

    return (<View
        style = { styles.gifContainer }>
        <Image
            source = {{ uri: url }}
            style = { styles.gifImage } />
    </View>);
};

export default GifMessage;
