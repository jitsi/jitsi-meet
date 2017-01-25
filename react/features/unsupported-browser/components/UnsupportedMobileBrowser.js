import React, { Component } from 'react';
import { connect } from 'react-redux';

import { appNavigate } from '../../app';
import { Platform } from '../../base/react';

import { mobileBrowserPageIsShown } from '../actions';

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
        dispatch: React.PropTypes.func,
        room: React.PropTypes.string
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
        this._onClickJoin = this._onClickJoin.bind(this);
    }

    /**
     * React lifecycle method triggered after component is mounted.
     *
     * @returns {void}
     */
    componentDidMount() {
        this.props.dispatch(mobileBrowserPageIsShown());
    }

    /**
     * React lifecycle method triggered before component will mount.
     *
     * @returns {void}
     */
    componentWillMount() {
        const { room } = this.props;
        let btnText;
        let link;

        if (room) {
            btnText = 'Join the conversation';
            link = room;
        } else {
            btnText = 'Start a conference';
            link = '';
        }

        this.setState({
            btnText,
            link
        });
    }

    /**
     * Renders component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'unsupported-mobile-browser';
        const primaryButtonClasses
            = `${ns}__button ${ns}__button_primary`;

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
                        <button className = { primaryButtonClasses }>
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
                        onClick = { this._onClickJoin }>
                        {
                            this.state.btnText
                        }
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Navigates to the next state of the app.
     *
     * @private
     * @returns {void}
     */
    _onClickJoin() {
        this.props.dispatch(appNavigate(this.state.link));
    }
}

/**
 * Maps (parts of) the Redux state to the associated UnsupportedMobileBrowser's
 * props.
 *
 * @param {Object} state - Redux state.
 * @returns {{
 *     room: string
 * }}
 */
function mapStateToProps(state) {
    return {
        room: state['features/base/conference'].room
    };
}

export default connect(mapStateToProps)(UnsupportedMobileBrowser);
