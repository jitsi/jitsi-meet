// @flow

import React, { Component } from 'react';

// eslint-disable-next-line react-native/split-platform-components
import { BackAndroid, BackHandler, StatusBar, View } from 'react-native';
import { connect as reactReduxConnect } from 'react-redux';

import { appNavigate } from '../../app';
import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { CalleeInfoContainer } from '../../base/jwt';
import { Container, LoadingIndicator, TintedView } from '../../base/react';
import { createDesiredLocalTracks } from '../../base/tracks';
import { Filmstrip } from '../../filmstrip';
import { LargeVideo } from '../../large-video';
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
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = {

    /**
     * The indicator which determines that we are still connecting to the
     * conference which includes establishing the XMPP connection and then
     * joining the room. If truthy, then an activity/loading indicator will
     * be rendered.
     *
     * @private
     */
    _connecting: boolean,

    /**
     * The handler which dispatches the (redux) action connect.
     *
     * @private
     */
    _onConnect: Function,

    /**
     * The handler which dispatches the (redux) action disconnect.
     *
     * @private
     */
    _onDisconnect: Function,

    /**
     * Handles a hardware button press for back navigation. Leaves the
     * associated {@code Conference}.
     *
     * @private
     * @returns {boolean} As the associated conference is unconditionally
     * left and exiting the app while it renders a {@code Conference} is
     * undesired, {@code true} is always returned.
     */
    _onHardwareBackPress: Function,

    /**
     * The indicator which determines whether the UI is reduced (to accommodate
     * smaller display areas).
     *
     * @private
     */
    _reducedUI: boolean,

    /**
     * The handler which dispatches the (redux) action setToolboxVisible to
     * show/hide the Toolbox.
     *
     * @private
     */
    _setToolboxVisible: Function,

    /**
     * The indicator which determines whether the Toolbox is visible.
     *
     * @private
     */
    _toolboxVisible: boolean
};

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends Component<Props> {
    _backHandler: ?BackHandler;

    _toolboxTimeout: ?number;

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

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._onHardwareBackPress = this._onHardwareBackPress.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        // Set handling any hardware button presses for back navigation up.
        const backHandler = BackHandler || BackAndroid;

        if (backHandler) {
            this._backHandler = backHandler;
            backHandler.addEventListener(
                'hardwareBackPress',
                this._onHardwareBackPress);
        }

        this._setToolboxTimeout(this.props._toolboxVisible);
    }

    /**
     * Implements {@link Component#componentWillMount()}. Invoked immediately
     * before mounting occurs. Connects the conference described by the redux
     * store/state.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props._onConnect();
    }

    /**
     * Implements {@link Component#componentWillUnmount()}. Invoked immediately
     * before this component is unmounted and destroyed. Disconnects the
     * conference described by the redux store/state.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // Tear handling any hardware button presses for back navigation down.
        const backHandler = this._backHandler;

        if (backHandler) {
            this._backHandler = undefined;
            backHandler.removeEventListener(
                'hardwareBackPress',
                this._onHardwareBackPress);
        }

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
                accessibilityLabel = 'Conference'
                accessible = { false }
                onClick = { this._onClick }
                style = { styles.conference }
                touchFeedback = { false }>
                <StatusBar
                    hidden = { true }
                    translucent = { true } />

                {/*
                  * The LargeVideo is the lowermost stacking layer.
                  */}
                <LargeVideo />

                {/*
                  * If there is a ringing call, show the callee's info.
                  */
                    this.props._reducedUI || <CalleeInfoContainer />
                }

                {/*
                  * The activity/loading indicator goes above everything, except
                  * the toolbox/toolbars and the dialogs.
                  */
                    this.props._connecting
                        && <TintedView>
                            <LoadingIndicator />
                        </TintedView>
                }

                <View style = { styles.toolboxAndFilmstripContainer } >
                    {/*
                      * The Toolbox is in a stacking layer bellow the Filmstrip.
                      */}
                    <Toolbox />
                    {/*
                      * The Filmstrip is in a stacking layer above the
                      * LargeVideo. The LargeVideo and the Filmstrip form what
                      * the Web/React app calls "videospace". Presumably, the
                      * name and grouping stem from the fact that these two
                      * React Components depict the videos of the conference's
                      * participants.
                      */}
                    <Filmstrip />
                </View>

                {/*
                  * The dialogs are in the topmost stacking layers.
                  */
                    this.props._reducedUI || <DialogContainer />
                }
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

    _onClick: () => void;

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

        // XXX If the user taps to toggle the visibility of the Toolbox, then no
        // automatic toggling of the visibility should happen.
        this._clearToolboxTimeout();
    }

    _onHardwareBackPress: () => boolean;

    /**
     * Handles a hardware button press for back navigation.
     *
     * @returns {boolean} If the hardware button press for back navigation was
     * handled by this {@code Conference}, then {@code true}; otherwise,
     * {@code false}.
     */
    _onHardwareBackPress() {
        return this._backHandler && this.props._onHardwareBackPress();
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
         * Dispatches actions to create the desired local tracks and for
         * connecting to the conference.
         *
         * @returns {void}
         * @private
         */
        _onConnect() {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        },

        /**
         * Dispatches an action disconnecting from the conference.
         *
         * @returns {void}
         * @private
         */
        _onDisconnect() {
            dispatch(disconnect());
        },

        /**
         * Handles a hardware button press for back navigation. Leaves the
         * associated {@code Conference}.
         *
         * @returns {boolean} As the associated conference is unconditionally
         * left and exiting the app while it renders a {@code Conference} is
         * undesired, {@code true} is always returned.
         */
        _onHardwareBackPress() {
            dispatch(appNavigate(undefined));

            return true;
        },

        /**
         * Dispatches an action changing the visibility of the Toolbox.
         *
         * @param {boolean} visible - True to show the Toolbox or false to hide
         * it.
         * @returns {void}
         * @private
         */
        _setToolboxVisible(visible) {
            dispatch(setToolboxVisible(visible));
        }
    };
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _connecting: boolean,
 *     _reducedUI: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { connecting, connection } = state['features/base/connection'];
    const { conference, joining, leaving } = state['features/base/conference'];
    const { reducedUI } = state['features/base/responsive-ui'];

    // XXX There is a window of time between the successful establishment of the
    // XMPP connection and the subsequent commencement of joining the MUC during
    // which the app does not appear to be doing anything according to the redux
    // state. In order to not toggle the _connecting props during the window of
    // time in question, define _connecting as follows:
    // - the XMPP connection is connecting, or
    // - the XMPP connection is connected and the conference is joining, or
    // - the XMPP connection is connected and we have no conference yet, nor we
    //   are leaving one.
    const connecting_
        = connecting || (connection && (joining || (!conference && !leaving)));

    return {
        /**
         * The indicator which determines that we are still connecting to the
         * conference which includes establishing the XMPP connection and then
         * joining the room. If truthy, then an activity/loading indicator will
         * be rendered.
         *
         * @private
         * @type {boolean}
         */
        _connecting: Boolean(connecting_),

        /**
         * The indicator which determines whether the UI is reduced (to
         * accommodate smaller display areas).
         *
         * @private
         * @type {boolean}
         */
        _reducedUI: reducedUI,

        /**
         * The indicator which determines whether the Toolbox is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolboxVisible: state['features/toolbox'].visible
    };
}

// $FlowFixMe
export default reactReduxConnect(_mapStateToProps, _mapDispatchToProps)(
    Conference);
