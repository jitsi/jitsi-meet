/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

import ConferenceID from './ConferenceID';
import NumbersList from './NumbersList';

declare var config: Object;

/**
 * The type of the React {@code Component} props of {@link DialInSummary}.
 */
type Props = {

    /**
     * Additional CSS classnames to append to the root of the component.
     */
    className: string,

    /**
     * Whether or not numbers should include links with the telephone protocol.
     */
    clickableNumbers: boolean,

    /**
     * The name of the conference to show a conferenceID for.
     */
    room: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link DialInSummary}.
 */
type State = {

    /**
     * The numeric ID of the conference, used as a pin when dialing in.
     */
    conferenceID: ?string,

    /**
     * An error message to display.
     */
    error: string,

    /**
     * Whether or not the app is fetching data.
     */
    loading: boolean,

    /**
     * The dial-in numbers. entered by the local participant.
     */
    numbers: ?Array<Object>,

    /**
     * Whether or not dial-in is allowed.
     */
    numbersEnabled: ?boolean
}

/**
 * Displays a page listing numbers for dialing into a conference and pin to
 * the a specific conference.
 *
 * @extends Component
 */
class DialInSummary extends Component<Props, State> {
    state = {
        conferenceID: null,
        error: '',
        loading: true,
        numbers: null,
        numbersEnabled: null
    };

    /**
     * Initializes a new {@code DialInSummary} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onGetNumbersSuccess = this._onGetNumbersSuccess.bind(this);
        this._onGetConferenceIDSuccess
            = this._onGetConferenceIDSuccess.bind(this);
        this._setErrorMessage = this._setErrorMessage.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const getNumbers = this._getNumbers()
            .then(this._onGetNumbersSuccess)
            .catch(this._setErrorMessage);

        const getID = this._getConferenceID()
            .then(this._onGetConferenceIDSuccess)
            .catch(this._setErrorMessage);

        Promise.all([ getNumbers, getID ])
            .then(() => {
                this.setState({ loading: false });
            });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        let className = '';
        let contents;

        const { conferenceID, error, loading, numbersEnabled } = this.state;

        if (loading) {
            contents = '';
        } else if (numbersEnabled === false) {
            contents = this.props.t('info.dialInNotSupported');
        } else if (error) {
            contents = error;
        } else {
            className = 'has-numbers';
            contents = [
                conferenceID
                    ? <ConferenceID
                        conferenceID = { conferenceID }
                        key = 'conferenceID' />
                    : null,
                <NumbersList
                    clickableNumbers = { this.props.clickableNumbers }
                    conferenceID = { conferenceID }
                    key = 'numbers'
                    numbers = { this.state.numbers } />
            ];
        }

        return (
            <div className = { `${this.props.className} ${className}` }>
                { contents }
            </div>
        );
    }

    /**
     * Creates an AJAX request for the conference ID.
     *
     * @private
     * @returns {Promise}
     */
    _getConferenceID() {
        const { room } = this.props;
        const { dialInConfCodeUrl, hosts } = config;
        const mucURL = hosts && hosts.muc;

        if (!dialInConfCodeUrl || !mucURL || !room) {
            return Promise.resolve();
        }

        const conferenceIDURL
            = `${dialInConfCodeUrl}?conference=${room}@${mucURL}`;

        return fetch(conferenceIDURL)
            .then(response => response.json())
            .catch(() => Promise.reject(this.props.t('info.genericError')));
    }

    /**
     * Creates an AJAX request for dial-in numbers.
     *
     * @private
     * @returns {Promise}
     */
    _getNumbers() {
        const { dialInNumbersUrl } = config;

        if (!dialInNumbersUrl) {
            return Promise.reject(this.props.t('info.dialInNotSupported'));
        }

        return fetch(dialInNumbersUrl)
            .then(response => response.json())
            .catch(() => Promise.reject(this.props.t('info.genericError')));
    }

    _onGetConferenceIDSuccess: (Object) => void;

    /**
     * Callback invoked when fetching the conference ID succeeds.
     *
     * @param {Object} response - The response from fetching the conference ID.
     * @private
     * @returns {void}
     */
    _onGetConferenceIDSuccess(response = {}) {
        const { conference, id } = response;

        if (!conference || !id) {
            return;
        }

        this.setState({ conferenceID: id });
    }

    _onGetNumbersSuccess: (Object) => void;

    /**
     * Callback invoked when fetching dial-in numbers succeeds. Sets the
     * internal to show the numbers.
     *
     * @param {Object} response - The response from fetching dial-in numbers.
     * @param {Array|Object} response.numbers - The dial-in numbers.
     * @param {boolean} reponse.numbersEnabled - Whether or not dial-in is
     * enabled.
     * @private
     * @returns {void}
     */
    _onGetNumbersSuccess({ numbers, numbersEnabled }) {
        this.setState({
            numbersEnabled,
            numbers
        });
    }

    _setErrorMessage: (string) => void;

    /**
     * Sets an error message to display on the page instead of content.
     *
     * @param {string} error - The error message to display.
     * @private
     * @returns {void}
     */
    _setErrorMessage(error) {
        this.setState({
            error
        });
    }
}

export default translate(DialInSummary);
