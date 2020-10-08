// @flow

import React, { Component } from 'react';

import { connect } from '../../base/redux';
import { jitsiLocalStorage } from '@jitsi/js-utils';

/**
 * The type of the React {@code Component} props of {@link ConferenceSessionTimer}.
 */
type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * The type of the React {@code Component} state of {@link ConferenceSessionTimer}.
 */
type State = {};

/**
 * ConferenceSessionTimer react component.
 *
 * @class ConferenceSessionTimer
 * @extends Component
 */
class ConferenceSessionTimer extends Component<Props, State> {

    /**
     * Handle for setTimeout timer.
     */
    _timeout;

    /**
     * Initializes a new {@code ConferenceSessionTimer} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    /**
     * Starts the conference timout when component will be
     * mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        console.log('mounting session timer');
        this._startTimeout();
    }

    /**
     * Stops the conference timeout when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        console.log('unmouting session timer');
        this._stopTimeout();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return <React.Fragment></React.Fragment>;
    }

    /**
     * Start conference session timout.
     *
     * @returns {void}
     */
    _startTimeout() {
        this._stopTimeout();
        this._timeout = setTimeout(() => {
            // remove session id after 1 hr
            console.log("removing session id");
            jitsiLocalStorage.removeItem('sessionId'); // we want to force teachers to re enter the password
        }, 3600000);
    }

    /**
     * Stop conference session timeout.
     *
     * @returns {void}
     */
    _stopTimeout() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    }
}

export default connect(_ => _)(ConferenceSessionTimer);
