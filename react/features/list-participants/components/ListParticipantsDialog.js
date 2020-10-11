// @flow

import React from 'react';
import { connect } from 'react-redux';

import CopyButton from '../../base/buttons/CopyButton';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';


import { getParticipants } from '../../base/participants';


import Header from './Header';

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The list of paticipants the conference.
     */
    paticipantsList: Object
};

/**
 * Allow users to embed a jitsi meeting in an iframe.
 *
 * @returns {React$Element<any>}
 */
function ListParticipants({ t, paticipantsList }: Props) {
    /**
     * Get the list of participants for a jitsi meeting.
     *
     * @returns {string} The list of participants.
     */

    const getList = () => {
       let list = "";
       paticipantsList.map((obj, index)=>{
            if(obj && obj.name){
    	        list += (index + 1) + " : " + obj.name + "\n";
    	    }else{
    	        list += (index + 1) + " : " + "No Name Specified" + "\n";
    	    }
       })
       return list;
    };

    return (
        <Dialog
            customHeader = { Header }
            hideCancelButton = { true }
            submitDisabled = { true }
            width = 'small'>
            <div className = 'list-participants-dialog'>
                <textarea
                    className = 'list-participants-code'
                    readOnly = { true }
                    value = { getList() } />
                <CopyButton
                    className = 'list-participants-copy'
                    displayedText = { t('dialog.copy') }
                    textOnCopySuccess = { t('dialog.copied') }
                    textOnHover = { t('dialog.copy') }
                    textToCopy = { getList() } />
            </div>
        </Dialog>
    );
}

const mapStateToProps = state => {
    return {
        paticipantsList: getParticipants(state)
    };
};

export default translate(connect(mapStateToProps)(ListParticipants));
