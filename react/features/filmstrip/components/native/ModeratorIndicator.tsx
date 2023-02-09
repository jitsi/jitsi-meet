import React from 'react';

import { IconModerator } from '../../../base/icons';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge showing that the participant is a conference moderator.
 *
 * @returns {JSX.Element}
 */
export default function MoeratorIndicator(): JSX.Element {
    return (
        <BaseIndicator icon = { IconModerator } />
    );
}
