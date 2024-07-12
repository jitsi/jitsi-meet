import React from 'react';

export interface INotificationProps {
    appearance?: string;
    concatText?: boolean;
    customActionHandler?: Function[];
    customActionNameKey?: string[];
    customActionType?: string[];
    description?: string | React.ReactNode;
    descriptionArguments?: Object;
    descriptionKey?: string;
    disableClosing?: boolean;
    hideErrorSupportLink?: boolean;
    icon?: string;
    maxLines?: number;
    sticky?: boolean;
    title?: string;
    titleArguments?: {
        [key: string]: string | number;
    };
    titleKey?: string;
    uid?: string;
}
