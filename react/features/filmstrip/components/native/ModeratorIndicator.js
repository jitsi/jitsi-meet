// @flow

import React, { Component } from 'react';

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
                icon = 'star' />
        );
    }
}
