import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import HangupButton from '../HangupButton';

import HangupMenuButton from './HangupMenuButton';

const HangupContainerButtons = (props: AbstractButtonProps) => {
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const endConferenceSupported = conference?.isEndConferenceSupported();

    return endConferenceSupported

        // @ts-ignore
        ? <HangupMenuButton { ...props } />
        : <HangupButton { ...props } />;
};

export default HangupContainerButtons;
