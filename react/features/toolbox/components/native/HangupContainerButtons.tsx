import React from 'react';
import { useSelector } from 'react-redux';

import AbstractHangupButton from "../../../base/toolbox/components/AbstractHangupButton";
import HangupMenuButton from "./HangupMenuButton";
import HangupButton from "../HangupButton";
import {IReduxState} from "../../../app/types";

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
