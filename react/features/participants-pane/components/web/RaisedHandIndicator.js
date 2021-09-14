// @flow

import React from 'react';

import { Icon, IconRaisedHandHollow } from '../../../base/icons';

import { RaisedHandIndicatorBackground } from './styled';

type Props = {
    isFirst: boolean
};

export const RaisedHandIndicator = ({ isFirst }: Props) => (
    <RaisedHandIndicatorBackground isFirst = { isFirst }>
        <Icon
            size = { 15 }
            src = { IconRaisedHandHollow } />
    </RaisedHandIndicatorBackground>
);
