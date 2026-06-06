import React from 'react';
import { useSelector } from 'react-redux';

import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import RaiseHandButton from '../../../toolbox/components/native/RaiseHandButton';
import { shouldDisplayReactionsButtons } from '../../functions.native';

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
