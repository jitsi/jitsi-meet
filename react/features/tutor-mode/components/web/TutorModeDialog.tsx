import React from 'react';

import { connect } from 'react-redux';
import { translate } from '../../../base/react/translation';
import { toggleDialog } from '../../../base/dialog/actions';
import AbstractDialog, { IProps as AbstractDialogProps } from '../../../base/dialog/components/web/AbstractDialog';
import { IReduxState } from '../../../app/types';
import {
    enableTutorMode,
    disableTutorMode,
    setTutorModeListenTargets
} from '../../actions';
import {
    isLocalParticipantTutor,
    isTutorModeEnabled,
    isTutorModeStudent,
    getTutorId,
    getLocalParticipantId
} from '../../functions.any';
import { TUTOR_MODE_REQUEST_TIMEOUT } from '../../constants';
import logger from '../../logger';

interface IProps extends AbstractDialogProps {
    /**
     * Whether tutor mode is currently enabled.
     */
    enabled: boolean;

    /**
     * Whether the local participant is the tutor.
     */
    isTutor: boolean;

    /**
     * Whether the local participant is a student in tutor mode.
     */
    isStudent: boolean;

    /**
     * The tutor's participant id.
     */
    tutorId: string | undefined;

    /**
     * The local participant's id.
     */
    localId: string | undefined;

    /**
     * Whether a tutor-mode request is pending.
     */
    pending: boolean;

    /**
     * The last tutor-mode error, if any.
     */
    error: string | null;
}

/**
 * Dialog for managing tutor-centered room mode.
 */
class TutorModeDialog extends React.PureComponent<IProps> {

    /**
     * Handles toggling tutor mode.
     */
    _onToggleTutorMode = () => {
        const { dispatch, enabled } = this.props;

        if (enabled) {
            dispatch(disableTutorMode());
        } else {
            dispatch(enableTutorMode());
        }

        dispatch(toggleDialog('TutorModeDialog', null));
    };

    /**
     * Handles setting the listen target.
     */
    _onSetListenTarget = (target: string | null) => {
        const { dispatch } = this.props;
        dispatch(setTutorModeListenTargets(target ? [ target ] : null));
    };

    override render() {
        const {
            enabled,
            isTutor,
            isStudent,
            tutorId,
            localId,
            pending,
            error,
            t
        } = this.props;

        if (isStudent) {
            return (
                <AbstractDialog
                    ok = { { action: () => this.props.dispatch(toggleDialog('TutorModeDialog', null)) } }
                    titleKey = { 'tutorMode.dialog.title' }
                    width = { 380 }
                >
                    <div className = "tutor-mode-student-info">
                        <p>{ t('tutorMode.dialog.enabled') }</p>
                        <p>{ t('tutorMode.dialog.description') }</p>
                        { tutorId && <p>{ t('tutorMode.dialog.tutorIs', { name: tutorId }) }</p> }
                    </div>
                </AbstractDialog>
            );
        }

        if (!isTutor) {
            return null;
        }

        return (
            <AbstractDialog
                ok = { { action: () => this.props.dispatch(toggleDialog('TutorModeDialog', null)) } }
                titleKey = { 'tutorMode.dialog.title' }
                width = { 380 }
            >
                <div className = "tutor-mode-dialog">
                    <div className = "tutor-mode-toggle">
                        <button
                            className = { `tutor-mode-toggle-button ${enabled ? 'active' : ''}` }
                            onClick = { this._onToggleTutorMode }
                            disabled = { pending }
                        >
                            { enabled ? t('tutorMode.dialog.disable') : t('tutorMode.dialog.enable') }
                        </button>
                    </div>

                    { enabled && (
                        <div className = "tutor-mode-controls">
                            <h3>{ t('tutorMode.dialog.listenToEveryone') }</h3>
                            <button
                                onClick = { () => this._onSetListenTarget(null) }
                                className = "tutor-mode-control-button"
                            >
                                { t('tutorMode.dialog.listenToEveryone') }
                            </button>

                            <h3>{ t('tutorMode.dialog.speakToEveryone') }</h3>
                            <button
                                onClick = { () => this._onSetListenTarget(null) }
                                className = "tutor-mode-control-button"
                            >
                                { t('tutorMode.dialog.speakToEveryone') }
                            </button>
                        </div>
                    )}

                    { error && (
                        <div className = "tutor-mode-error">
                            { t(error) }
                        </div>
                    )}
                </div>
            </AbstractDialog>
        );
    }
}

/**
 * Maps Redux state to component props.
 */
function _mapStateToProps(state: IReduxState) {
    const { error, listenTo, pending } = state['features/tutor-mode'];

    return {
        enabled: isTutorModeEnabled(state),
        isTutor: isLocalParticipantTutor(state),
        isStudent: isTutorModeStudent(state),
        tutorId: getTutorId(state),
        localId: getLocalParticipantId(state),
        pending,
        error
    };
}

export default connect(_mapStateToProps)(translate(TutorModeDialog));
