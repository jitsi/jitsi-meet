/* @flow */

import React, { Component } from 'react';

declare var config: Object;

/**
 * Notice react component.
 *
 * @class Notice
 */
export default class Notice extends Component {
    state: Object;

    /**
     * Constructor of Notice component.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        const { noticeMessage } = config;

        this.state = {
            noticeMessage
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { noticeMessage } = this.state;

        if (!noticeMessage) {
            return null;
        }

        return (
            <div className = 'notice'>
                <span className = 'notice__message' >
                    { noticeMessage }
                </span>
            </div>
        );
    }
}
