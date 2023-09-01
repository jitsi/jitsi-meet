import React from 'react';
import { SvgFromXml } from 'react-native-svg';

/**
 * SVG rendering component.
 *
 * @returns {JSX.Element}
 */
const SvgXmlIcon = ({ src, ...rest }: {
    src: string;
}): JSX.Element => (
    <SvgFromXml
        override = { rest }
        xml = { src } />
);

export default SvgXmlIcon;
