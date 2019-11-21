// @flow

import React, { Component, Fragment } from 'react';

import { getLocalParticipant } from '../../participants';
import { connect } from '../../redux';

// FIXME this imports feature to 'base'
import { statsEmitter } from '../../../connection-indicator';

import { TestHint } from './index';
import { isTestModeEnabled } from '../functions';

/**
 * Defines the TestConnectionInfo's properties.
 */
type Props = {

    /**
     * The JitsiConference's connection state. It's the lib-jitsi-meet's event
     * name converted to a string directly. At the time of this writing these
     * are the possible values:
     * 'conference.connectionEstablished'
     * 'conference.connectionInterrupted'
     * 'conference.connectionRestored'
     */
    _conferenceConnectionState: string,

    /**
     * This will be a boolean converted to a string. The value will be 'true'
     * once the conference is joined (the XMPP MUC room to be specific).
     */
    _conferenceJoinedState: string,

    /**
     * The local participant's ID. Required to be able to observe the local RTP
     * stats.
     */
    _localUserId: string,

    /**
     * Indicates whether or not the test mode is currently on. Otherwise the
     * TestConnectionInfo component will not render.
     */
    _testMode: boolean
}

/**
 * Describes the TestConnectionInfo's state.
 */
type State = {

    /**
     * The RTP stats section.
     */
    stats: {

        /**
         * The local bitrate.
         */
        bitrate: {

            /**
             * The local download RTP bitrate.
             */
            download: number,

            /**
             * The local upload RTP bitrate.
             */
            upload: number
        }
    }
}

/**
 * The component will expose some of the app state to the jitsi-meet-torture
 * through the UI accessibility layer which is visible to the tests. The Web
 * tests currently will execute JavaScript and access globals variables to learn
 * this information, but there's no such option on React Native(maybe that's
 * a good thing).
 */
class TestConnectionInfo extends Component<Props, State> {
    _onStatsUpdated: Object => void;

    /**
     * Initializes new <tt>TestConnectionInfo</tt> instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onStatsUpdated = this._onStatsUpdated.bind(this);

        this.state = {
            stats: {
                bitrate: {
                    download: 0,
                    upload: 0
                }
            }
        };
    }

    /**
     * The {@link statsEmitter} callback hoked up for the local participant.
     *
     * @param {Object} stats - These are the RTP stats. Look in
     * the lib-jitsi-meet for more details on the actual structure or add
     * a console print and figure out there.
     * @returns {void}
     * @private
     */
    _onStatsUpdated(stats = {}) {
        this.setState({
            stats: {
                bitrate: {
                    download: stats.bitrate?.download || 0,
                    upload: stats.bitrate?.upload || 0
                }
            }
        });
    }

    /**
     * Starts listening for the local RTP stat updates.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        statsEmitter.subscribeToClientStats(
            this.props._localUserId, this._onStatsUpdated);
    }

    /**
     * Updates which user's stats are being listened to (the local participant's
     * id changes).
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps._localUserId !== this.props._localUserId) {
            statsEmitter.unsubscribeToClientStats(
                prevProps._localUserId, this._onStatsUpdated);
            statsEmitter.subscribeToClientStats(
                this.props._localUserId, this._onStatsUpdated);
        }
    }

    /**
     * Removes the local stats listener.
     *
     * @private
     * @returns {void}
     */
    componentWillUnmount() {
        statsEmitter.unsubscribeToClientStats(
            this.props._localUserId, this._onStatsUpdated);
    }

    /**
     * Renders the component if the app is currently running in the test mode
     * (config.testing.testMode == true).
     *
     * @returns {ReactElement|null}
     */
    render() {
        if (!this.props._testMode) {
            return null;
        }

        return (
            <Fragment accessible = { false } >
                <TestHint
                    id = 'org.jitsi.meet.conference.connectionState'
                    value = { this.props._conferenceConnectionState } />
                <TestHint
                    id = 'org.jitsi.meet.conference.joinedState'
                    value = { this.props._conferenceJoinedState } />
                <TestHint
                    id = 'org.jitsi.meet.stats.rtp'
                    value = { JSON.stringify(this.state.stats) } />
            </Fragment>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated TestConnectionInfo's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conferenceConnectionState: string,
 *     _conferenceJoinedState: string,
 *     _localUserId: string,
 *     _testMode: boolean
 * }}
 */
function _mapStateToProps(state) {
    const conferenceJoined
        = Boolean(state['features/base/conference'].conference);
    const localParticipant = getLocalParticipant(state);

    return {
        _conferenceConnectionState: state['features/testing'].connectionState,
        _conferenceJoinedState: conferenceJoined.toString(),
        _localUserId: localParticipant && localParticipant.id,
        _testMode: isTestModeEnabled(state)
    };
}

export default connect(_mapStateToProps)(TestConnectionInfo);
