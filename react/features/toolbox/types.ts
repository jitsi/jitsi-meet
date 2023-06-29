import { ComponentType } from 'react';

export interface IToolboxButton {
    Content: ComponentType<any>;
    alias?: string;
    group: number;
    key: string;
}
