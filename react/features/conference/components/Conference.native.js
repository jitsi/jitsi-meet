import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Container } from '../../base/react';
import { FilmStrip } from '../../film-strip';
import { LargeVideo } from '../../large-video';
import { setToolbarVisible, Toolbar } from '../../toolbar';

import { styles } from './styles';

/**
 * The timeout in milliseconds after which the toolbar will be hidden.
 *
 * @private
 * @type {number}
 */
const _TOOLBAR_TIMEOUT_MS = 5000;

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends Component {
    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The handler which dispatches the (redux) action connect.
         *
         * @private
         * @type {Function}
         */
        _onConnect: React.PropTypes.func,

        /**
         * The handler which dispatches the (redux) action disconnect.
         *
         * @private
         * @type {Function}
         */
        _onDisconnect: React.PropTypes.func,

        /**
         * The handler which dispatches the (redux) action setTooblarVisible to
         * show/hide the toolbar.
         *
         * @private
         * @type {boolean}
         */
        _setToolbarVisible: React.PropTypes.func,

        /**
         * The indicator which determines whether toolbar is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolbarVisible: React.PropTypes.bool
    };

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

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
        this._setToolbarTimeout(this.props._toolbarVisible);
    }

    /**
     * Inits new connection and conference when conference screen is entered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props._onConnect();
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

        this.props._onDisconnect();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container
                onClick = { this._onClick }
                style = { styles.conference }
                touchFeedback = { false }>

                <LargeVideo />

                <Toolbar />
                <FilmStrip />

                <DialogContainer />
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
        const toolbarVisible = !this.props._toolbarVisible;

        this.props._setToolbarVisible(toolbarVisible);
        this._setToolbarTimeout(toolbarVisible);
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
                = setTimeout(this._onClick, _TOOLBAR_TIMEOUT_MS);
        }
    }
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onConnect: Function,
 *     _onDisconnect: Function,
 *     _setToolbarVisible: Function
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        /**
         * Dispatched an action connecting to the conference.
         *
         * @returns {Object} Dispatched action.
         * @private
         */
        _onConnect() {
            return dispatch(connect());
        },

        /**
         * Dispatches an action disconnecting from the conference.
         *
         * @returns {Object} Dispatched action.
         * @private
         */
        _onDisconnect() {
            return dispatch(disconnect());
        },

        /**
         * Dispatched an action changing visiblity of the toolbar.
         *
         * @param {boolean} isVisible - Flag showing whether toolbar is
         * visible.
         * @returns {Object} Dispatched action.
         * @private
         */
        _setToolbarVisible(isVisible: boolean) {
            return dispatch(setToolbarVisible(isVisible));
        }
    };
}

/**
 * Maps (parts of) the Redux state to the associated Conference's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _toolbarVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The indicator which determines whether toolbar is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolbarVisible: state['features/toolbar'].visible
    };
}

export default reactReduxConnect(_mapStateToProps, _mapDispatchToProps)(
        Conference);
