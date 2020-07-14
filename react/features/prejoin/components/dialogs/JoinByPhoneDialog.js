// @flow

import React, { PureComponent } from 'react';

import { connect } from '../../../base/redux';
import {
    getConferenceId,
    getDefaultDialInNumber,
    updateDialInNumbers
} from '../../../invite';
import {
    dialOut as dialOutAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    openDialInPage as openDialInPageAction
} from '../../actions';
import { getDialOutStatus, getFullDialOutNumber } from '../../functions';

import CallingDialog from './CallingDialog';
import DialInDialog from './DialInDialog';
import DialOutDialog from './DialOutDialog';

type Props = {

    /**
     * The number to call in order to join the conference.
     */
    dialInNumber: string,

    /**
     * The status of the call when the meeting calss the user.
     */
    dialOutStatus: string,

    /**
     * The action by which the meeting calls the user.
     */
    dialOut: Function,

    /**
     * The number the conference should call.
     */
    dialOutNumber: string,

    /**
     * Fetches conference dial in numbers & conference id
     */
    fetchConferenceDetails: Function,

    /**
     * Joins the conference without audio.
     */
    joinConferenceWithoutAudio: Function,

    /**
     * Closes the dialog.
     */
    onClose: Function,

    /**
     * Opens a web page with all the dial in numbers.
     */
    openDialInPage: Function,

    /**
     * The passCode of the conference used when joining a meeting by phone.
     */
    passCode: string,
};

type State = {

    /**
     * The dialout call is ongoing, 'CallingDialog' is shown;
     */
    isCalling: boolean,

    /**
     * If should show 'DialInDialog'.
     */
    showDialIn: boolean,

    /**
     * If should show 'DialOutDialog'.
     */
    showDialOut: boolean
}

/**
 * This is the dialog shown when a user wants to join with phone audio.
 */
class JoinByPhoneDialog extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code JoinByPhoneDialog} instance.
     *
     * @param {Props} props - The props of the component.
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            isCalling: false,
            showDialOut: true,
            showDialIn: false
        };

        this._dialOut = this._dialOut.bind(this);
        this._showDialInDialog = this._showDialInDialog.bind(this);
        this._showDialOutDialog = this._showDialOutDialog.bind(this);
    }

    _dialOut: () => void;

    /**
     * Meeting calls the user & shows the 'CallingDialog'.
     *
     * @returns {void}
     */
    _dialOut() {
        const { dialOut, joinConferenceWithoutAudio } = this.props;

        this.setState({
            isCalling: true,
            showDialOut: false,
            showDialIn: false
        });
        dialOut(joinConferenceWithoutAudio, this._showDialOutDialog);
    }

    _showDialInDialog: () => void;

    /**
     * Shows the 'DialInDialog'.
     *
     * @returns {void}
     */
    _showDialInDialog() {
        this.setState({
            isCalling: false,
            showDialOut: false,
            showDialIn: true
        });
    }

    _showDialOutDialog: () => void;

    /**
     * Shows the 'DialOutDialog'.
     *
     * @returns {void}
     */
    _showDialOutDialog() {
        this.setState({
            isCalling: false,
            showDialOut: true,
            showDialIn: false
        });
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props.fetchConferenceDetails();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            dialOutStatus,
            dialInNumber,
            dialOutNumber,
            joinConferenceWithoutAudio,
            passCode,
            onClose,
            openDialInPage
        } = this.props;
        const {
            _dialOut,
            _showDialInDialog,
            _showDialOutDialog
        } = this;
        const { isCalling, showDialOut, showDialIn } = this.state;
        const className = isCalling
            ? 'prejoin-dialog prejoin-dialog--small'
            : 'prejoin-dialog';

        return (
            <div className = 'prejoin-dialog-container'>
                <div className = { className }>
                    {showDialOut && (
                        <DialOutDialog
                            onClose = { onClose }
                            onSubmit = { _dialOut }
                            onTextButtonClick = { _showDialInDialog } />
                    )}
                    {showDialIn && (
                        <DialInDialog
                            number = { dialInNumber }
                            onBack = { _showDialOutDialog }
                            onPrimaryButtonClick = { joinConferenceWithoutAudio }
                            onSmallTextClick = { openDialInPage }
                            onTextButtonClick = { onClose }
                            passCode = { passCode } />
                    )}
                    {isCalling && (
                        <CallingDialog
                            number = { dialOutNumber }
                            onClose = { onClose }
                            status = { dialOutStatus } />
                    )}
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    return {
        dialInNumber: getDefaultDialInNumber(state),
        dialOutNumber: getFullDialOutNumber(state),
        dialOutStatus: getDialOutStatus(state),
        passCode: getConferenceId(state)
    };
}

const mapDispatchToProps = {
    dialOut: dialOutAction,
    fetchConferenceDetails: updateDialInNumbers,
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    openDialInPage: openDialInPageAction
};


export default connect(mapStateToProps, mapDispatchToProps)(JoinByPhoneDialog);
