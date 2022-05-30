// @flow

import React, { useState } from 'react';
import { translate } from '../../../base/i18n';
import { Icon, IconAdd,IconGem,IconBeer,IconEightStreek,IconCyclone,IconDollarGreen } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isButtonEnabled, isToolboxVisible } from '../../../toolbox/functions.web';
// import { Modal, Button } from "react-bootstrap";
import { openDialog, toggleDialog } from '../../../base/dialog';
import { NewModal1 } from '../../../Modal';
import { NewModal2 } from '../../../Modal';
import { NewModal3 } from '../../../Modal';
import { NewModal4 } from '../../../Modal';
import { NewModal5 } from '../../../Modal';


declare var interfaceConfig: Object;

type Props = {

  /**
   * Whether to show the option to invite more people.
   */
  _shouldShow: boolean,

  /**
   * Whether the toolbox is visible.
   */
  _toolboxVisible: boolean,

  /**
   * Handler to open the invite dialog.
   */
  onClick: Function,

  /**
   * Invoked to obtain translated strings.
   */
  t: Function,
  dispatch : Function,

}

/**
 * Represents a replacement for the subject, prompting the
 * sole participant to invite more participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element<any>}
 */

 
function ConnectButtons({
  _shouldShow,
  _toolboxVisible,
  onClick,
  t,
  dispatch,
}: Props) {
  return (
    true
      ? <div className={`invite-more-container${true ? '' : ' elevated'}`}>
        <div style={{ display: 'flex', justifyContent: 'initial', alignSelf: 'flex-start' }}>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={()=> { dispatch(openDialog(NewModal1))}}>
            <Icon src={IconBeer}/>
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={()=> { dispatch(openDialog(NewModal2))}}>
            <Icon src={IconGem} />
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={()=> { dispatch(openDialog(NewModal3))}}>
            <Icon src={IconEightStreek} />
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={()=> { dispatch(openDialog(NewModal4))}}>
            <Icon src={IconCyclone} />
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={()=> { dispatch(openDialog(NewModal5))}}>
            <Icon src={IconDollarGreen} />
          </div>
        </div>
      </div> : null
  );
}


/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
  // const participantCount = getParticipantCount(state);
  // const isAlone = participantCount === 1;
  // const hide = interfaceConfig.HIDE_INVITE_MORE_HEADER;

  return {
    _shouldShow: isButtonEnabled('invite', state),
    // _toolboxVisible: isToolboxVisible(state)
  };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */

export default translate(connect(mapStateToProps)(ConnectButtons));
