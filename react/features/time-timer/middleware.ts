import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { participantJoined, participantLeft } from '../base/participants/actions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { START_TIME_TIMER, STOP_TIME_TIMER, TICK_TIME_TIMER } from './actionTypes';
import { setCalendarTimerDuration, startTimeTimer } from './actions';
import { DEFAULT_DURATION_SECONDS, TIME_TIMER_PARTICIPANT_ID } from './constants';

import './reducer';

let _tickInterval: ReturnType<typeof setInterval> | undefined;

function _clearTick() {
    if (_tickInterval !== undefined) {
        clearInterval(_tickInterval);
        _tickInterval = undefined;
    }
}

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const state = getState();
        const timerConfig = state['features/base/config']?.timeTimer;

        if (timerConfig?.enabled) {
            const conference = getCurrentConference(state);

            dispatch(participantJoined({
                conference,
                fakeParticipant: FakeParticipant.TimeTimer,
                id: TIME_TIMER_PARTICIPANT_ID,
                name: 'Time Timer'
            }));
            const calendarDuration = getState()['features/time-timer'].calendarDurationSeconds;
            const duration = calendarDuration ?? timerConfig.defaultDuration ?? DEFAULT_DURATION_SECONDS;

            dispatch(startTimeTimer(duration));
        }
        break;
    }
    case CONFERENCE_LEFT: {
        _clearTick();
        const conference = getCurrentConference(getState());

        dispatch(participantLeft(TIME_TIMER_PARTICIPANT_ID, conference, {
            fakeParticipant: FakeParticipant.TimeTimer
        }));
        dispatch(setCalendarTimerDuration(undefined));
        break;
    }
    case START_TIME_TIMER: {
        _clearTick();
        _tickInterval = setInterval(() => {
            dispatch({ type: TICK_TIME_TIMER });
        }, 1000);
        break;
    }
    case STOP_TIME_TIMER: {
        _clearTick();
        break;
    }
    case TICK_TIME_TIMER: {
        const { remainingSeconds } = getState()['features/time-timer'];

        if (remainingSeconds <= 0) {
            _clearTick();
        }
        break;
    }
    }

    return result;
});
