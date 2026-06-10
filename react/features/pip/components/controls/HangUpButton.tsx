import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { IconHangup } from '../../../base/icons/svg';
import { leaveConference } from '../../../base/conference/actions';
import { exitPiP } from '../../actions';

/**
 * Hangup button for Document PiP controls.
 * Dispatches directly to Redux for state changes.
 */
const HangUpButton: React.FC = () => {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(exitPiP());
        dispatch(leaveConference());
    }, [ dispatch ]);

    return (
        <button
            className = 'doc-pip-btn hangup'
            onClick = { handleClick }
            title = 'Leave call'
            type = 'button'>
            <IconHangup />
        </button>
    );
};

export default HangUpButton;
