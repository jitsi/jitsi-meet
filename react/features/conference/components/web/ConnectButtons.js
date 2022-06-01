// @flow

import React, { useState, useEffect } from 'react';
import { translate } from '../../../base/i18n';
import { Icon, IconAdd, IconGem, IconBeer, IconEightStreek, IconCyclone, IconDollarGreen } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isButtonEnabled, isToolboxVisible } from '../../../toolbox/functions.web';
// import { Modal, Button } from "react-bootstrap";
import { openDialog, toggleDialog } from '../../../base/dialog';


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
  dispatch: Function,

}

/**
 * Represents a replacement for the subject, prompting the
 * sole participant to invite more participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element<any>}
 */

 const url1 = 'https://www.google.com/';
 const url2 = 'https://www.linkedin.com/';
 const url3 = 'https://www.climatekk.com/';
 const url4 = 'https://github.com/';

function ConnectButtons({
  _shouldShow,
  _toolboxVisible,
  onClick,
  t,
  dispatch,
}: Props) {
  const [timer, setTimer] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setTimer(!timer)
    }, 10000)
  }, [timer])
  return (
    true
      ? <div className={`invite-more-container${true ? '' : ' elevated'}`}>
        {timer ? <div style={{ display: 'flex', justifyContent: 'initial', alignSelf: 'flex-start' }}>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={() => {window.open(url1)}}>
            <Icon src={IconBeer} />
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={() => {window.open(url2) }}>
            <Icon src={IconGem} />
          </div>
        </div> : <div style={{ display: 'flex', justifyContent: 'initial', alignSelf: 'flex-start' }}>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={() => {window.open(url3)}}>
            <Icon src={IconEightStreek} />
          </div>
          <div style={{ borderRadius: '40%', margin: '10px' }}
            className='invite-more-button'
            onClick={() => {window.open(url4) }}>
            <Icon src={IconCyclone} />
          </div>
        </div>}
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
