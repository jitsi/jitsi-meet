import React, { Component } from 'react';

import { appNavigate } from '../../app';
import { isRoomValid } from '../../base/conference';
import { VideoTrack } from '../../base/media';
import { getLocalVideoTrack } from '../../base/tracks';

import { generateRoomWithoutSeparator } from '../roomnameGenerator';

/**
 * Base (abstract) class for container component rendering the welcome page.
 *
 * @abstract
 */
export class AbstractWelcomePage extends Component {
    /**
     * AbstractWelcomePage component's property types.
     *
     * @static
     */
    static propTypes = {
        _localVideoTrack: React.PropTypes.object,
        _room: React.PropTypes.string,
        dispatch: React.PropTypes.func
    };

    /**
     * Initializes a new AbstractWelcomePage instance, including the initial
     * state of the room name input.
     *
     * @param {Object} props - Component properties.
     */
    constructor(props) {
        super(props);

        /**
         * Save room name into component's local state.
         *
         * @type {Object}
         * @property {number|null} animateTimeoutId - Identificator for
         * letter animation timeout.
         * @property {string} generatedRoomname - Automatically generated
         * room name.
         * @property {string} room - Room name.
         * @property {string} roomPlaceholder - Room placeholder
         * that's used as a placeholder for input.
         * @property {nubmer|null} updateTimeoutId - Identificator for
         * updating generated room name.
         */
        this.state = {
            animateTimeoutId: null,
            generatedRoomname: '',
            room: '',
            roomPlaceholder: '',
            updateTimeoutId: null
        };

        // Bind event handlers so they are only bound once for every instance.
        this._animateRoomnameChanging
            = this._animateRoomnameChanging.bind(this);
        this._onJoin = this._onJoin.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._updateRoomname = this._updateRoomname.bind(this);
    }

    /**
     * This method is executed when component receives new properties.
     *
     * @inheritdoc
     * @param {Object} nextProps - New props component will receive.
     */
    componentWillReceiveProps(nextProps) {
        this.setState({ room: nextProps._room });
    }

    /**
     * This method is executed when method will be unmounted from DOM.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._clearTimeouts();
    }

    /**
     * Animates the changing of the room name.
     *
     * @param {string} word - The part of room name that should be added to
     * placeholder.
     * @private
     * @returns {void}
     */
    _animateRoomnameChanging(word) {
        let animateTimeoutId = null;
        const roomPlaceholder = this.state.roomPlaceholder + word.substr(0, 1);

        if (word.length > 1) {
            animateTimeoutId
                = setTimeout(
                        () => {
                            this._animateRoomnameChanging(
                                    word.substring(1, word.length));
                        },
                        70);
        }

        this.setState({
            animateTimeoutId,
            roomPlaceholder
        });
    }

    /**
     * Method that clears timeouts for animations and updates of room name.
     *
     * @private
     * @returns {void}
     */
    _clearTimeouts() {
        clearTimeout(this.state.animateTimeoutId);
        clearTimeout(this.state.updateTimeoutId);
    }

    /**
     * Determines whether the 'Join' button is (to be) disabled i.e. there's no
     * valid room name typed into the respective text input field.
     *
     * @protected
     * @returns {boolean} If the 'Join' button is (to be) disabled, true;
     * otherwise, false.
     */
    _isJoinDisabled() {
        return !isRoomValid(this.state.room);
    }

    /**
     * Handles joining. Either by clicking on 'Join' button
     * or by pressing 'Enter' in room name input field.
     *
     * @protected
     * @returns {void}
     */
    _onJoin() {
        const room = this.state.room || this.state.generatedRoomname;

        if (room) {
            this.props.dispatch(appNavigate(room));
        }
    }

    /**
     * Handles 'change' event for the room name text input field.
     *
     * @param {string} value - The text typed into the respective text input
     * field.
     * @protected
     * @returns {void}
     */
    _onRoomChange(value) {
        this.setState({ room: value });
    }

    /**
     * Renders a local video if any.
     *
     * @protected
     * @returns {(ReactElement|null)}
     */
    _renderLocalVideo() {
        return (
            <VideoTrack videoTrack = { this.props._localVideoTrack } />
        );
    }

    /**
     * Triggers the generation of a new room name and initiates an animation of
     * its changing.
     *
     * @protected
     * @returns {void}
     */
    _updateRoomname() {
        const generatedRoomname = generateRoomWithoutSeparator();
        const roomPlaceholder = '';
        const updateTimeoutId = setTimeout(this._updateRoomname, 10000);

        this._clearTimeouts();
        this.setState(
            {
                generatedRoomname,
                roomPlaceholder,
                updateTimeoutId
            },
            () => this._animateRoomnameChanging(generatedRoomname));
    }
}

/**
 * Selects local video track from tracks in state, local participant and room
 * and maps them to component props. It seems it's not possible to 'connect'
 * base component and then extend from it. So we export this function in order
 * to be used in child classes for 'connect'.
 *
 * @param {Object} state - Redux state.
 * @protected
 * @returns {{
 *     _localVideoTrack: (Track|undefined),
 *     _room: string
 * }}
 */
export function _mapStateToProps(state) {
    const conference = state['features/base/conference'];
    const tracks = state['features/base/tracks'];

    return {
        _localVideoTrack: getLocalVideoTrack(tracks),
        _room: conference.room
    };
}
