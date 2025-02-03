import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import AbstractHangupButton from '../../../base/toolbox/components/AbstractHangupButton';
import HangupButton from '../HangupButton';

import HangupMenuButton from './HangupMenuButton';


const HangupContainerButtons = (props: AbstractHangupButton) => {
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const endConferenceSupported = conference?.isEndConferenceSupported();

    return endConferenceSupported
        ? <HangupMenuButton
            { ...props }
            showRaiseHand = { true } />
        : <HangupButton { ...props } />;
};

export default HangupContainerButtons;
