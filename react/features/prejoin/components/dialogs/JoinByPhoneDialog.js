// @flow

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
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
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * The number to call in order to join the conference.
     */
    dialInNumber: string,

    /**
     * The status of the call when the meeting calls the user.
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
     * Fetches conference dial in numbers & conference id.
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
     * The dialout call is ongoing, 'CallingDialog' is shown;.
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
 * Creates the styles for the component.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        root: {
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            height: '100vh',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100vw',
            zIndex: 3,

            '& .prejoin-dialog': {
                background: '#1C2025',
                boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.5)',
                borderRadius: '5px',
                color: '#fff',
                height: '400px',
                width: '375px'
            },
            '& .prejoin-dialog--small': {
                height: '300',
                width: '400'
            },
            '& .prejoin-dialog-label': {
                fontSize: '15px',
                lineHeight: '24px'
            },
            '& .prejoin-dialog-label-num': {
                background: '#2b3b4b',
                border: '1px solid #A4B8D1',
                borderRadius: '50%',
                color: '#fff',
                display: 'inline-block',
                height: '24px',
                marginRight: '8px',
                width: '24px'
            },
            '& .prejoin-dialog-container': {

            },
            '& .prejoin-dialog-flag': {
                display: 'inline-block',
                marginRight: '8px',
                transform: 'scale(1.2)'
            },
            '& .prejoin-dialog-title': {
                display: 'inline-block',
                fontSize: '24px',
                lineHeight: '32px'
            },
            '& .prejoin-dialog-icon': {
                cursor: 'pointer'
            },
            '& .prejoin-dialog-icon > svg': {
                fill: '#A4B8D1'
            },
            '& .prejoin-dialog-btn': {
                width: '309px'
            },
            '& .prejoin-dialog-dialin-container': {
                textAlign: 'center'
            },
            '& .prejoin-dialog-delimiter': {
                background: '#5f6266',
                border: 0,
                height: '1px',
                margin: 0,
                padding: 0,
                width: '100%'
            },
            '& .prejoin-dialog-delimiter-container': {
                margin: '16px 0 24px 0',
                position: 'relative'
            },
            '& .prejoin-dialog-delimiter-txt-container': {
                position: 'absolute',
                textAlign: 'center',
                top: '-8px',
                width: '100%'
            },
            '& .prejoin-dialog-delimiter-txt': {
                background: '#1C2025',
                color: '#5f6266',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: '0 8px'
            },
            '& .prejoin-dialog .prejoin-dialog-btn.primary, & .prejoin-dialog .action-btn.prejoin-dialog-btn.text': {
                width: '310px'
            }
        }
    };
};

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
            classes,
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
        const className = clsx('prejoin-dialog', { 'prejoin-dialog--small': isCalling });

        return (
            <div className = { clsx('prejoin-dialog-container', classes.root) }>
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


export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(JoinByPhoneDialog));
