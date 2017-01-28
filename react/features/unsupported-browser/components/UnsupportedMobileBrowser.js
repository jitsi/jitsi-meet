import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Platform } from '../../base/react';

/**
 * The map of platforms to URLs at which the mobile app for the associated
 * platform is available for download.
 */
const URLS = {
    android: 'https://play.google.com/store/apps/details?id=org.jitsi.meet',
    ios: 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905'
};

/**
 * React component representing mobile browser page.
 *
 * @class UnsupportedMobileBrowser
 */
class UnsupportedMobileBrowser extends Component {
    /**
     * Mobile browser page component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The name of the conference room to be joined upon clicking the
         * respective button.
         *
         * @private
         * @type {string}
         */
        _room: React.PropTypes.string
    }

    /**
     * Constructor of UnsupportedMobileBrowser component.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind methods
        this._onJoinClick = this._onJoinClick.bind(this);
    }

    /**
     * React lifecycle method triggered before component will mount.
     *
     * @returns {void}
     */
    componentWillMount() {
        const joinButtonText
            = this.props._room ? 'Join the conversation' : 'Start a conference';

        this.setState({
            joinButtonText
        });
    }

    /**
     * Renders component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'unsupported-mobile-browser';
        const downloadButtonClassName = `${ns}__button ${ns}__button_primary`;

        return (
            <div className = { ns }>
                <div className = { `${ns}__body` }>
                    <img
                        className = { `${ns}__logo` }
                        src = '/images/logo-blue.svg' />
                    <p className = { `${ns}__text` }>
                        You need <strong>Jitsi Meet</strong> to join a
                        conversation on your mobile
                    </p>
                    <a href = { URLS[Platform.OS] }>
                        <button className = { downloadButtonClassName }>
                            Download the App
                        </button>
                    </a>
                    <p className = { `${ns}__text ${ns}__text_small` }>
                        or if you already have it
                        <br />
                        <strong>then</strong>
                    </p>
                    <button
                        className = { `${ns}__button` }
                        onClick = { this._onJoinClick }>
                        {
                            this.state.joinButtonText
                        }
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Handles clicks on the button that joins the local participant in a
     * conference.
     *
     * @private
     * @returns {void}
     */
    _onJoinClick() {
        // If the user installed the app while this Component was displayed
        // (e.g. the user clicked the Download the App button), then we would
        // like to open the current URL in the mobile app.

        // TODO The only way to do it appears to be a link with an app-specific
        // scheme, not a Universal Link.
    }
}

/**
 * Maps (parts of) the Redux state to the associated UnsupportedMobileBrowser's
 * props.
 *
 * @param {Object} state - Redux state.
 * @returns {{
 *     _room: string
 * }}
 */
function mapStateToProps(state) {
    return {
        /**
         * The name of the conference room to be joined upon clicking the
         * respective button.
         *
         * @private
         * @type {string}
         */
        _room: state['features/base/conference'].room
    };
}

export default connect(mapStateToProps)(UnsupportedMobileBrowser);
