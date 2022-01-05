// @flow

import React from 'react';

import { IconSignalLevel0, IconSignalLevel1, IconSignalLevel2 } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractConnectionIndicator, {
    type Props,
    type State
} from '../AbstractConnectionIndicator';

import { CONNECTOR_INDICATOR_COLORS } from './styles';

const ICONS = [
    IconSignalLevel0,
    IconSignalLevel1,
    IconSignalLevel2
];

/**
 * Implements an indicator to show the quality of the connection of a participant.
 */
class ConnectionIndicator extends AbstractConnectionIndicator<Props, State> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            autoHideTimeout: undefined,
            showIndicator: false,
            stats: {}
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showIndicator, stats } = this.state;
        const { percent } = stats;

        if (!showIndicator || typeof percent === 'undefined') {
            return null;
        }

        // Signal level on a scale 0..2
        const signalLevel = Math.floor(percent / 33.4);

        return (
            <BaseIndicator
                icon = { ICONS[signalLevel] }
                iconStyle = {{
                    color: CONNECTOR_INDICATOR_COLORS[signalLevel]
                }} />
        );
    }

}

export default connect()(ConnectionIndicator);
