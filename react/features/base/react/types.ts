import React from 'react';
import { GestureResponderEvent } from 'react-native';

export interface IIconButtonProps {
    accessibilityLabel?: string;
    color?: string;
    disabled?: boolean;
    onPress?: (e?: GestureResponderEvent) => void;
    size?: number | string;
    src: Function;
    style?: Object | undefined;
    tapColor?: string;
    type?: string;
}

/**
 * Item data for <tt>NavigateSectionList</tt>.
 */
export type Item = {

    /**
     * The avatar URL or icon name.
     */
    avatar?: string;

    /**
     * The color base of the avatar.
     */
    colorBase: string;

    /**
     * An optional react element to append to the end of the Item.
     */
    elementAfter?: React.ReactNode;

    /**
     * Unique ID of the item.
     */
    id: string;

    key?: string;

    /**
     * Lines[0] - date
     * lines[1] - duration
     * lines[2] - server name.
     */
    lines: Array<string>;

    /**
     * Item title.
     */
    title: string;

    type: string;

    /**
     * Item url.
     */
    url: string;
};

/**
 * Web implementation of section data for NavigateSectionList.
 */
export type Section = {

    /**
     * Optional properties added only to fix some flow errors thrown by React
     * SectionList.
     */
    ItemSeparatorComponent?: React.ComponentType<any>;

    /**
     * Array of items in the section.
     */
    data: ReadonlyArray<Item>;

    /**
     * Unique key for the section.
     */
    key?: string;

    keyExtractor?: (item: Object) => string;

    renderItem?: (info: Object) => null | React.ReactElement<any>;

    /**
     * Section title.
     */
    title: string;

};

/**
 * Native implementation of section data for NavigateSectionList.
 *
 * When react-native's SectionList component parses through an array of sections
 * it passes the section nested within the section property of another object
 * to the renderSection method (on web for our own implementation of SectionList
 * this nesting is not implemented as there is no need for nesting).
 */
export type SectionListSection = {
    section: Section;
};
