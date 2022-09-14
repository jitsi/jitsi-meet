import { Component } from 'react';

export type Props = {

    /**
     * An SVG icon to be rendered as the content of the label.
     */
    icon?: Function;

    /**
     * String or component that will be rendered as the label itself.
     */
    text?: string;
};

/**
 * Abstract class for the {@code Label} component.
 */
export default class Label<P extends Props, S>
    extends Component<P, S> {
}
