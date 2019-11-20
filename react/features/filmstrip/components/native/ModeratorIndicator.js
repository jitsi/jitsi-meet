// @flow

import React, { Component } from 'react';

import { IconModerator } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge showing that the participant is a conference moderator.
 */
export default class ModeratorIndicator extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                highlight = { false }
                icon = { IconModerator } />
        );
    }
}
