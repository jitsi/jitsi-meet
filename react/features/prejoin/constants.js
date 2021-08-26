// @flow

export type PREJOIN_SCREEN_STATE = "hidden" | "loading" | true;


type PREJOIN_SCREEN_STATE_TYPE = {
    HIDDEN: PREJOIN_SCREEN_STATE,
    LOADING: PREJOIN_SCREEN_STATE,
    VISIBLE: PREJOIN_SCREEN_STATE
  }

/**
 * Enum of possible prejoin screen states.
 */
export const PREJOIN_SCREEN_STATES: PREJOIN_SCREEN_STATE_TYPE = {
    HIDDEN: 'hidden',
    LOADING: 'loading',
    VISIBLE: true // backwards compatibility with old boolean implementation
};
