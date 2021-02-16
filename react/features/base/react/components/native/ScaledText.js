// @flow
import React from 'react';
import Text from './Text';

type Props = Text.defaultProps

/**
 * renders the scaled Text to avoid the font scaling for IOS Text Size accessibility settings.
 *
 * @inheritdoc
 * @returns {ReactElement}
 */
export default function ScaledText(props: Props) {
    return (<Text
        { ...props }
        allowFontScaling = { false } />);
}
