/**
 * @type {string}
 */
import { _getSymbolDescription } from './functions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE
} from '../../base/conference';
import { LOAD_CONFIG_ERROR } from '../../base/config';

export const WILL_JOIN = _getSymbolDescription(CONFERENCE_WILL_JOIN);

export const CONFIG_ERROR = _getSymbolDescription(LOAD_CONFIG_ERROR);

export const JOINED = _getSymbolDescription(CONFERENCE_JOINED);

export const WILL_LEAVE = _getSymbolDescription(CONFERENCE_WILL_LEAVE);

export const LEFT = _getSymbolDescription(CONFERENCE_LEFT);

export const FAILED = _getSymbolDescription(CONFERENCE_FAILED);


