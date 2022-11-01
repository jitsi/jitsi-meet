import React from 'react';
import {NewModal6, NewModal7} from "../../../Modal";
import {Icon, IconBookmark, IconTicket} from "../../../base/icons";
import {openDialog} from "../../../base/dialog";
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID,
    showNotification
} from "../../../notifications";
import type {AbstractButtonProps} from "../../../base/toolbox/components";
import {getLocalizedDurationFormatter, translate} from "../../../base/i18n";
import {connect} from "../../../base/redux";
import {getConferenceTimestamp} from "../../../base/conference";

export type Props = AbstractButtonProps & {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The URL of the conference.
     */
    url: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
    /**
     * Value of current conference time.
     */
    timerValue: string,
    /**
     * The UTC timestamp representing the time when first participant joined.
     */
    _startTimestamp: ?number,
};

const TokMarks = (props: Props) => {
    let notify = true;
    let tokMarkStartTime = 0;
    let tokMarkEndTime = 0;


    const notifyUser = () => {
        if (notify) {
            tokMarkStartTime = getLocalizedDurationFormatter(new Date().getTime()-props._startTimestamp);
            console.log('ClickTImer22',getLocalizedDurationFormatter(new Date().getTime()-props._startTimestamp));
            props.dispatch(showNotification({
                titleKey: 'Tok mark has been started',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            notify = false;
        } else {
            tokMarkEndTime = getLocalizedDurationFormatter(new Date().getTime()-props._startTimestamp);
            console.log('ClickTImer66',getLocalizedDurationFormatter(new Date().getTime()-props._startTimestamp));
            props.dispatch(showNotification({
                titleKey: 'Tok mark has been ended',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            notify = true;
        }
    }
    return (
        <div className={`invite-more-container${true ? '' : ' elevated'}`}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start'
            }}>
                <div style={{
                    borderRadius: '40%',
                    margin: '10px'
                }}
                     className="invite-more-button"
                     onClick={() => {
                         notifyUser()
                     }}>
                    <Icon src={IconBookmark}/>
                </div>
            </div>
        </div>
    );
};
export function _mapStateToProps(state: Object) {

    return {
        _startTimestamp: getConferenceTimestamp(state)
    };
}
export default translate(connect(_mapStateToProps)(TokMarks));