import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Platform } from '../../base/react';

import { appNavigate } from '../../app';
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
 * @class MobileBrowserPage
 */
class MobileBrowserPage extends Component {

    /**
     * Constructor of MobileBrowserPage component.
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
     * Mobile browser page component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func,
        room: React.PropTypes.string
    };

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
        let link = '';

        if (room) {
            btnText = 'Join the conversation';
            link += room;
        } else {
            btnText = 'Start a conference';
        }

        this.setState({
            btnText,
            link
        });
    }

    /**
     * Navigates to the next state of the app.
     *
     * @returns {void}
     * @private
     */
    _onClickJoin() {
        const { link } = this.state;

        this.props.dispatch(appNavigate(link));
    }

    /**
     * Renders component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { btnText } = this.state;
        const blockPrefix = 'mobile-browser-page';
        const textClasses = `${blockPrefix}__text ${blockPrefix}__text_small`;
        let primaryButtonClasses = `${blockPrefix}__button`;

        primaryButtonClasses += ` ${blockPrefix}__button_primary`;

        return (
            <div className = { blockPrefix }>
                <div className = { `${blockPrefix}__body` }>
                    <img
                        className = { `${blockPrefix}__logo` }
                        src = '/images/logo-blue.svg' />
                    <p className = { `${blockPrefix}__text` }>
                        You need <strong>Jitsi Meet</strong> to join a
                        conversation on your mobile
                    </p>
                    <a href = { URLS[Platform.OS] }>
                        <button className = { primaryButtonClasses }>
                            Download the App
                        </button>
                    </a>
                    <p className = { textClasses }>
                        or if you already have it
                        <br />
                        <strong>then</strong>
                    </p>
                    <button
                        className = 'mobile-browser-page__button'
                        onClick = { this._onClickJoin }>
                        { btnText }
                    </button>
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated MobileBrowserPage's props.
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

export default connect(mapStateToProps)(MobileBrowserPage);
