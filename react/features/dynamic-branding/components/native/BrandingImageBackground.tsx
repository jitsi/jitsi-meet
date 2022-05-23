import React from 'react';
import { Image } from 'react-native';
import { SvgUri } from 'react-native-svg';

import styles from './styles';


interface Props {
    uri: any;
}

/**
 * Component that displays a branding background image.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
const BrandingImageBackground: React.FC<Props> = ({ uri }:Props) => {
    const imageType = uri?.substr(uri.lastIndexOf('/') + 1);
    const imgSrc = uri ? uri : undefined;

    let backgroundImage;

    if (imageType?.includes('.svg')) {
        backgroundImage
            = (
                <SvgUri
                    height = '100%'
                    style = { styles.brandingImageBackgroundSvg }
                    uri = { imgSrc }
                    width = '100%' />
            );
    } else {
        backgroundImage
            = (
                <Image
                    source = {{ uri: imgSrc }}
                    style = { styles.brandingImageBackground } />
            );
    }

    return backgroundImage;
};

export default BrandingImageBackground;
