// @flow
import React from 'react';

import Text from './Text';

type Props = Text.defaultProps

/**
 * Renders the scaled Text to avoid the font scaling due to IOS Text Size accessibility settings.
 *
 * @inheritdoc
 * @returns {ReactElement}
 */
export default function WelcomeScreenText(props: Props) {
    return (<Text
        { ...props }
        allowFontScaling = { false } />);
}
