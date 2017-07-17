import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Container } from '../../base/react';
import { Filmstrip } from '../../filmstrip';
import { LargeVideo } from '../../large-video';
import { OverlayContainer } from '../../overlay';
import { setToolboxVisible, Toolbox } from '../../toolbox';

import styles from './styles';

/**
 * The timeout in milliseconds after which the Toolbox will be hidden.
 *
 * @private
 * @type {number}
 */
const _TOOLBOX_TIMEOUT_MS = 5000;

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
         * The handler which dispatches the (redux) action setToolboxVisible to
         * show/hide the Toolbox.
         *
         * @private
         * @type {boolean}
         */
        _setToolboxVisible: React.PropTypes.func,

        /**
         * The indicator which determines whether the Toolbox is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolboxVisible: React.PropTypes.bool
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
         * Toolbox will be hidden. To be used with
         * {@link WindowTimers#clearTimeout()}.
         *
         * @private
         */
        this._toolboxTimeout = undefined;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Inits the Toolbox timeout after the component is initially rendered.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        this._setToolboxTimeout(this.props._toolboxVisible);
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
     * is left. Clears {@link #_toolboxTimeout} before the component unmounts.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._clearToolboxTimeout();

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

                {/*
                  * The LargeVideo is the lowermost stacking layer.
                  */}
                <LargeVideo />

                {/*
                  * The Filmstrip is in a stacking layer above the LargeVideo.
                  * The LargeVideo and the Filmstrip form what the Web/React app
                  * calls "videospace". Presumably, the name and grouping stem
                  * from the fact that these two React Components depict the
                  * videos of the conference's participants.
                  */}
                <Filmstrip />

                {/*
                  * The overlays need to be bellow the Toolbox so that the user
                  * may tap the ToolbarButtons.
                  */}
                <OverlayContainer />

                {/*
                  * The Toolbox is in a stacking layer above the Filmstrip.
                  */}
                <Toolbox />

                {/*
                  * The dialogs are in the topmost stacking layers.
                  */}
                <DialogContainer />
            </Container>
        );
    }

    /**
     * Clears {@link #_toolboxTimeout} if any.
     *
     * @private
     * @returns {void}
     */
    _clearToolboxTimeout() {
        if (this._toolboxTimeout) {
            clearTimeout(this._toolboxTimeout);
            this._toolboxTimeout = undefined;
        }
    }

    /**
     * Changes the value of the toolboxVisible state, thus allowing us to switch
     * between Toolbox and Filmstrip and change their visibility.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const toolboxVisible = !this.props._toolboxVisible;

        this.props._setToolboxVisible(toolboxVisible);
        this._setToolboxTimeout(toolboxVisible);
    }

    /**
     * Triggers the default Toolbox timeout.
     *
     * @param {boolean} toolboxVisible - Indicates whether the Toolbox is
     * currently visible.
     * @private
     * @returns {void}
     */
    _setToolboxTimeout(toolboxVisible) {
        this._clearToolboxTimeout();
        if (toolboxVisible) {
            this._toolboxTimeout
                = setTimeout(this._onClick, _TOOLBOX_TIMEOUT_MS);
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
 *     _setToolboxVisible: Function
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
            dispatch(connect());
        },

        /**
         * Dispatches an action disconnecting from the conference.
         *
         * @returns {Object} Dispatched action.
         * @private
         */
        _onDisconnect() {
            dispatch(disconnect());
        },

        /**
         * Dispatches an action changing the visiblity of the Toolbox.
         *
         * @param {boolean} visible - True to show the Toolbox or false to hide
         * it.
         * @returns {Object} Dispatched action.
         * @private
         */
        _setToolboxVisible(visible: boolean) {
            dispatch(setToolboxVisible(visible));
        }
    };
}

/**
 * Maps (parts of) the Redux state to the associated Conference's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The indicator which determines whether the Toolbox is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default reactReduxConnect(_mapStateToProps, _mapDispatchToProps)(
    Conference);
