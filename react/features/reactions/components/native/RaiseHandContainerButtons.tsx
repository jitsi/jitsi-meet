import React from 'react';
import { useSelector } from 'react-redux';

import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { shouldDisplayReactionsButtons } from '../../functions.native';

import RaiseHandButton from './RaiseHandButton';
import ReactionsMenuButton from './ReactionsMenuButton';

const RaiseHandContainerButtons = (props: AbstractButtonProps) => {
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);

    return _shouldDisplayReactionsButtons
        ? <ReactionsMenuButton
            { ...props }
            showRaiseHand = { true } />
        : <RaiseHandButton { ...props } />;
};

export default RaiseHandContainerButtons;
