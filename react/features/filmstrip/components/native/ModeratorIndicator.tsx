/* eslint-disable lines-around-comment */

import React from 'react';

// @ts-ignore
import { IconModerator } from '../../../base/icons';
// @ts-ignore
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge showing that the participant is a conference moderator.
 *
 * @returns {JSX.Element}
 */
const ModeratorIndicator = (): JSX.Element => <BaseIndicator icon = { IconModerator } />;

export default ModeratorIndicator;
