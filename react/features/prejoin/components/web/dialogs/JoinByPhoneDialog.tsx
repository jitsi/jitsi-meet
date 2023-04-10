import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { updateDialInNumbers } from '../../../../invite/actions.web';
import { getConferenceId, getDefaultDialInNumber } from '../../../../invite/functions';
import {
    dialOut as dialOutAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    openDialInPage as openDialInPageAction
} from '../../../actions.web';
import { getDialOutStatus, getFullDialOutNumber } from '../../../functions';

import CallingDialog from './CallingDialog';
import DialInDialog from './DialInDialog';
import DialOutDialog from './DialOutDialog';

interface IProps {

    /**
     * The number to call in order to join the conference.
     */
    dialInNumber: string | null;

    /**
     * The action by which the meeting calls the user.
     */
    dialOut: Function;

    /**
     * The number the conference should call.
     */
    dialOutNumber: string;

    /**
     * The status of the call when the meeting calls the user.
     */
    dialOutStatus: string;

    /**
     * Fetches conference dial in numbers & conference id.
     */
    fetchConferenceDetails: Function;

    /**
     * Joins the conference without audio.
     */
    joinConferenceWithoutAudio: Function;

    /**
     * Closes the dialog.
     */
    onClose: (e?: React.MouseEvent) => void;

    /**
     * Opens a web page with all the dial in numbers.
     */
    openDialInPage: (e?: React.MouseEvent) => void;

    /**
     * The passCode of the conference used when joining a meeting by phone.
     */
    passCode?: string | number;
}

type State = {

    /**
     * The dialout call is ongoing, 'CallingDialog' is shown;.
     */
    isCalling: boolean;

    /**
     * If should show 'DialInDialog'.
     */
    showDialIn: boolean;

    /**
     * If should show 'DialOutDialog'.
     */
    showDialOut: boolean;
};

/**
 * This is the dialog shown when a user wants to join with phone audio.
 */
class JoinByPhoneDialog extends PureComponent<IProps, State> {
    /**
     * Initializes a new {@code JoinByPhoneDialog} instance.
     *
     * @param {IProps} props - The props of the component.
     * @inheritdoc
     */
    constructor(props: IProps) {
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
 * @param {Object} _ownProps - Component's own props.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, _ownProps: any) {
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
