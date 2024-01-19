import React from 'react';
import { Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';

import styles from './styles';


interface IProps {
    uri?: string;
}

/**
 * Component that displays a branding background image.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
const BrandingImageBackground: React.FC<IProps> = ({ uri }: IProps) => {
    const imageType = uri?.substr(uri.lastIndexOf('/') + 1);
    const imgSrc = uri ? uri : undefined;

    let backgroundImage;

    if (!uri) {
        return null;
    }

    if (imageType?.includes('.svg')) {
        backgroundImage
            = (
                <SvgUri
                    height = '100%'

                    // Force uniform scaling.
                    // Align the <min-x> of the element's viewBox
                    // with the smallest X value of the viewport.
                    // Align the <min-y> of the element's viewBox
                    // with the smallest Y value of the viewport.
                    preserveAspectRatio = 'xMinYMin'
                    style = { styles.brandingImageBackgroundSvg as StyleProp<ViewStyle> }
                    uri = { imgSrc ?? null }
                    viewBox = '0 0 400 650'
                    width = '100%' />
            );
    } else {
        backgroundImage
            = (
                <Image
                    source = {{ uri: imgSrc }}
                    style = { styles.brandingImageBackground as StyleProp<ImageStyle> } />
            );
    }

    return backgroundImage;
};

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DialInLink} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { backgroundImageUrl } = state['features/dynamic-branding'];

    return {
        uri: backgroundImageUrl
    };
}

export default connect(_mapStateToProps)(BrandingImageBackground);
