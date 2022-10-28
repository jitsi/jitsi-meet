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

export type Props = AbstractButtonProps &{

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
    dispatch: Function
};
const TokMarks = (props: Props) => {
    const notify = false;
   const notifyUser=()=>{
        if(notify){
            props.dispatch(showNotification({
                titleKey: 'Tok mark has been started',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
        }
        else {
            props.dispatch(showNotification({
                titleKey: 'Tok mark has been ended',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
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
                      onClick={() => {notifyUser()}}>
                    <NewModal6/>
                    <Icon src={IconBookmark}/>
                </div>
            </div>
        </div>
    );
}

export default TokMarks;