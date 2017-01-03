import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { Container } from '../../base/react';
import { FilmStrip } from '../../filmStrip';
import { LargeVideo } from '../../largeVideo';
import { RoomLockPrompt } from '../../room-lock';
import { Toolbar } from '../../toolbar';

import PasswordRequiredPrompt from './PasswordRequiredPrompt';
import { styles } from './styles';

/**
 * The timeout in milliseconds after which the toolbar will be hidden.
 */
const TOOLBAR_TIMEOUT_MS = 5000;

/**
 * The conference page of the application.
 */
class Conference extends Component {
    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The indicator which determines whether a password is required to join
         * the conference and has not been provided yet.
         *
         * @private
         * @type {JitsiConference}
         */
        _passwordRequired: React.PropTypes.object,

        /**
         * The indicator which determines whether the user has requested to lock
         * the conference/room.
         *
         * @private
         * @type {JitsiConference}
         */
        _roomLockRequested: React.PropTypes.object,
        dispatch: React.PropTypes.func
    }

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = { toolbarVisible: true };

        /**
         * The numerical ID of the timeout in milliseconds after which the
         * toolbar will be hidden. To be used with
         * {@link WindowTimers#clearTimeout()}.
         *
         * @private
         */
        this._toolbarTimeout = undefined;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Inits the toolbar timeout after the component is initially rendered.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        this._setToolbarTimeout(this.state.toolbarVisible);
    }

    /**
     * Inits new connection and conference when conference screen is entered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props.dispatch(connect());
    }

    /**
     * Destroys connection, conference and local tracks when conference screen
     * is left. Clears {@link #_toolbarTimeout} before the component unmounts.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._clearToolbarTimeout();

        this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const toolbarVisible = this.state.toolbarVisible;

        return (
            <Container
                onClick = { this._onClick }
                style = { styles.conference }
                touchFeedback = { false }>

                <LargeVideo />
                <Toolbar visible = { toolbarVisible } />
                <FilmStrip visible = { !toolbarVisible } />

                {
                    this._renderPrompt()
                }
            </Container>
        );
    }

    /**
     * Clears {@link #_toolbarTimeout} if any.
     *
     * @private
     * @returns {void}
     */
    _clearToolbarTimeout() {
        if (this._toolbarTimeout) {
            clearTimeout(this._toolbarTimeout);
            this._toolbarTimeout = undefined;
        }
    }

    /**
     * Changes the value of the toolbarVisible state, thus allowing us to
     * 'switch' between toolbar and filmstrip views and change the visibility of
     * the above.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const toolbarVisible = !this.state.toolbarVisible;

        this.setState({ toolbarVisible });

        this._setToolbarTimeout(toolbarVisible);
    }

    /**
     * Renders a prompt if a password is required to join the conference.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPasswordRequiredPrompt() {
        const required = this.props._passwordRequired;

        if (required) {
            return (
                <PasswordRequiredPrompt conference = { required } />
            );
        }

        return null;
    }

    /**
     * Renders a prompt if necessary such as when a password is required to join
     * the conference or the user has requested to lock the conference/room.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPrompt() {
        return (
            this._renderPasswordRequiredPrompt()
                || this._renderRoomLockPrompt()
        );
    }

    /**
     * Renders a prompt if the user has requested to lock the conference/room.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRoomLockPrompt() {
        const requested = this.props._roomLockRequested;

        if (requested) {
            return (
                <RoomLockPrompt conference = { requested } />
            );
        }

        return null;
    }

    /**
     * Triggers the default toolbar timeout.
     *
     * @param {boolean} toolbarVisible - Indicates if the toolbar is currently
     * visible.
     * @private
     * @returns {void}
     */
    _setToolbarTimeout(toolbarVisible) {
        this._clearToolbarTimeout();
        if (toolbarVisible) {
            this._toolbarTimeout
                = setTimeout(this._onClick, TOOLBAR_TIMEOUT_MS);
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated Conference's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _passwordRequired: boolean
 * }}
 */
function mapStateToProps(state) {
    return {
        /**
         * The indicator which determines whether a password is required to join
         * the conference and has not been provided yet.
         *
         * @private
         * @type {JitsiConference}
         */
        _passwordRequired: state['features/base/conference'].passwordRequired,

        /**
         * The indicator which determines whether the user has requested to lock
         * the conference/room.
         *
         * @private
         * @type {JitsiConference}
         */
        _roomLockRequested: state['features/room-lock'].requested
    };
}

export default reactReduxConnect(mapStateToProps)(Conference);
