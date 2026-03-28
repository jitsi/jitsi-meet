import { IReduxState } from '../../app/types';
import { getSecurityUrl } from '../config/functions.any';
import { translateToHTML } from '../i18n/functions.web';

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warning.
 * @returns {string}
 */
export default function getUnsafeRoomText(state: IReduxState, t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const securityUrl = getSecurityUrl(state);
    const options = {
        recommendAction: t(`security.unsafeRoomActions.${context}`),
        securityUrl
    };

    return translateToHTML(t, 'security.insecureRoomNameWarningWeb', options);
}
