/* @flow */

import React, { Component } from 'react';

declare var config: Object;

/**
 * Implements a Web/React Component which renders a feedback button.
 */
export class FeedbackButton extends Component {
    state = {
        callStatsID: String
    };

    /**
     * Initializes a new FeedbackButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this.state = {
            callStatsID: config.callStatsID
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // If callstats.io-support is not configured, skip rendering.
        if (!this.state.callStatsID) {
            return null;
        }

        return (
            <a
                className = 'button icon-feedback'
                id = 'feedbackButton' />
        );
    }
}
