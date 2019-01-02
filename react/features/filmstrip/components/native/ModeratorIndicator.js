import React, { Component } from 'react';

import { Icon } from '../../../base/font-icons';

import styles from './styles';

/**
 * Thumbnail badge showing that the participant is a conference moderator.
 */
export default class ModeratorIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Icon
                name = 'star'
                style = { styles.moderatorIndicator } />
        );
    }
}
