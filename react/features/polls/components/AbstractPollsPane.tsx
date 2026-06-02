import React, { ComponentType, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isCreatePollDisabled } from '../functions';

/*
 * Props that will be passed by the AbstractPollsPane to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    createMode: boolean;
    isCreatePollsDisabled: boolean;
    onCreate: () => void;
    setCreateMode: (mode: boolean) => void;
    t: Function;
};

/**
 * Higher Order Component taking in a concrete PollsPane component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollsPane = (Component: ComponentType<AbstractProps>) => () => {

    const isCreatePollsDisabled = useSelector(isCreatePollDisabled);
    const [ createMode, setCreateMode ] = useState(false);

    const onCreate = () => {
        setCreateMode(true);
    };

    const { t } = useTranslation();

    return (<Component
        createMode = { createMode }
        isCreatePollsDisabled = { isCreatePollsDisabled }
        /* eslint-disable react/jsx-no-bind */
        onCreate = { onCreate }
        setCreateMode = { setCreateMode }
        t = { t } />);

};

export default AbstractPollsPane;
