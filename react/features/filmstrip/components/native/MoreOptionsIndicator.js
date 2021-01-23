// @flow

import React, { Component } from 'react';

import { IconMenuThumb } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge for displaying the "more options" Button
 */
export default class MoreOptionsIndicator extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                highlight = { false }
                icon = { IconMenuThumb } />
        );
    }
}
