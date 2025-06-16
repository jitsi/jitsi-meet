import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createLiveStreamingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractStartLiveStreamDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

    /**
     * The current state of interactions with the Google API. Determines what
     * Google related UI should display.
     */
    _googleAPIState: number;

    /**
     * The email of the user currently logged in to the Google web client
     * application.
     */
    _googleProfileEmail: string;

    /**
     * The live stream key that was used before.
     */
    _streamKey?: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    navigation?: any;
}

/**
 * The type of the React {@code Component} state of
 * {@link AbstractStartLiveStreamDialog}.
 */
export interface IState {

    /**
     * Details about the broadcasts available for use for the logged in Google
     * user's YouTube account.
     */
    broadcasts?: Array<any>;

    /**
     * The error type, as provided by Google, for the most recent error
     * encountered by the Google API.
     */
    errorType?: string;

    /**
     * The boundStreamID of the broadcast currently selected in the broadcast
     * dropdown.
     */
    selectedBoundStreamID?: string;

    /**
     * The selected or entered stream key to use for YouTube live streaming.
     */
    streamKey?: string;
}

/**
 * Implements an abstract class for the StartLiveStreamDialog on both platforms.
 *
 * NOTE: Google log-in is not supported for mobile yet for later implementation
 * but the abstraction of its properties are already present in this abstract
 * class.
 */
export default class AbstractStartLiveStreamDialog<P extends IProps>
    extends Component<P, IState> {
    _isMounted: boolean;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            broadcasts: undefined,
            errorType: undefined,
            selectedBoundStreamID: undefined,
            streamKey: ''
        };

        /**
         * Instance variable used to flag whether the component is or is not
         * mounted. Used as a hack to avoid setting state on an unmounted
         * component.
         *
         * @private
         * @type {boolean}
         */
        this._isMounted = false;

        this._onCancel = this._onCancel.bind(this);
        this._onStreamKeyChange = this._onStreamKeyChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._isMounted = true;
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._isMounted = false;
    }

    /**
     * Invokes the passed in {@link onCancel} callback and closes
     * {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} True is returned to close the modal.
     */
    _onCancel() {
        sendAnalytics(createLiveStreamingDialogEvent('start', 'cancel.button'));

        return true;
    }

    /**
     * Asks the user to sign in, if not already signed in, and then requests a
     * list of the user's YouTube broadcasts.
     *
     * NOTE: To be implemented by platforms.
     *
     * @private
     * @returns {Promise}
     */
    _onGetYouTubeBroadcasts(): Promise<any> | void {
        // to be overwritten by child classes.
    }

    /**
     * Callback invoked to update the {@code StartLiveStreamDialog} component's
     * display of the entered YouTube stream key.
     *
     * @param {string} streamKey - The stream key entered in the field.
     * @private
     * @returns {void}
     */
    _onStreamKeyChange(streamKey: string) {
        this._setStateIfMounted({
            streamKey,
            selectedBoundStreamID: undefined
        });
    }

    /**
     * Invokes the passed in {@link onSubmit} callback with the entered stream
     * key, and then closes {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} False if no stream key is entered to preventing
     * closing, true to close the modal.
     */
    _onSubmit() {
        const { broadcasts, selectedBoundStreamID } = this.state;
        const key
            = (this.state.streamKey || this.props._streamKey || '').trim();

        if (!key) {
            return false;
        }

        let selectedBroadcastID = null;

        if (selectedBoundStreamID) {
            const selectedBroadcast = broadcasts?.find(
                broadcast => broadcast.boundStreamID === selectedBoundStreamID);

            selectedBroadcastID = selectedBroadcast?.id;
        }

        sendAnalytics(
            createLiveStreamingDialogEvent('start', 'confirm.button'));

        this.props._conference?.startRecording({
            broadcastId: selectedBroadcastID,
            mode: JitsiRecordingConstants.mode.STREAM,
            streamId: key
        });

        return true;
    }

    /**
     * Updates the internal state if the component is still mounted. This is a
     * workaround for all the state setting that occurs after ajax.
     *
     * @param {Object} newState - The new state to merge into the existing
     * state.
     * @private
     * @returns {void}
     */
    _setStateIfMounted(newState: IState) {
        if (this._isMounted) {
            this.setState(newState);
        }
    }
}

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _conference: Object,
 *     _googleAPIState: number,
 *     _googleProfileEmail: string,
 *     _streamKey: string
 * }}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        _conference: state['features/base/conference'].conference,
        _googleAPIState: state['features/google-api'].googleAPIState,
        _googleProfileEmail: state['features/google-api'].profileEmail,
        _streamKey: state['features/recording'].streamKey
    };
}
