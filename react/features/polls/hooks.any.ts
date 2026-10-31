import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { openDialog } from '../base/dialog/actions';

import { closePoll as closePollAction } from './actions';
import ClosePollDialog from './components/ClosePollDialog';
import { canClosePoll } from './functions';

/**
 * Returns whether the local participant can close the poll and a function that asks them to confirm and closes it.
 * Closing cannot be undone and ends the poll for everyone, thus it is confirmed first.
 *
 * @param {string} pollId - The id of the poll.
 * @returns {{ canClose: boolean, closePoll: Function }}
 */
export function useClosePoll(pollId: string) {
    const dispatch = useDispatch();
    const canClose = useSelector((state: IReduxState) => canClosePoll(state, pollId));
    const closePoll = useCallback(() => {
        dispatch(openDialog('ClosePollDialog', ClosePollDialog, {
            onSubmit: () => dispatch(closePollAction(pollId))
        }));
    }, [ dispatch, pollId ]);

    return {
        canClose,
        closePoll
    };
}
