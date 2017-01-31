/* global config */
import React, { Component } from 'react';

/**
 * A Web Component which renders feedback button.
 */
export class FeedbackButton extends Component {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        // if there is no callstats configured skip rendering
        if (!config.callStatsID) {
            return null;
        }

        return (
            <a
                className = 'button icon-feedback'
                id = 'feedbackButton' />
        );
    }
}
