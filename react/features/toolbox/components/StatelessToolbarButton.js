/* @flow */

import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';

type MapOfAttributes = { [key: string]: * };


/* eslint-disable flowtype/space-before-type-colon */

/**
 * Takes toolbar button props and maps them to HTML attributes to set.
 *
 * @param {Object} props - Props set to the React component.
 * @returns {MapOfAttributes}
 */
function getButtonAttributesByProps(props: Object = {})
        : MapOfAttributes {
    // XXX Make sure to not modify props.classNames because that'd be bad
    // practice.
    const classNames = (props.classNames && [ ...props.classNames ]) || [];

    props.toggled && classNames.push('toggled');
    props.unclickable && classNames.push('unclickable');

    const result: MapOfAttributes = {
        className: classNames.join(' '),
        'data-container': 'body',
        'data-placement': 'bottom',
        id: props.id
    };

    if (!props.enabled) {
        result.disabled = 'disabled';
    }

    if (props.hidden) {
        result.style = { display: 'none' };
    }

    if (props.tooltipText) {
        result.content = props.tooltipText;
    }

    return result;
}

/* eslint-enable flowtype/space-before-type-colon */

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
export default class StatelessToolbarButton extends AbstractToolbarButton {
    _onClick: Function;

    /**
     * Toolbar button component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractToolbarButton.propTypes,

        /**
         * Object describing button.
         */
        button: React.PropTypes.object.isRequired,

        /**
         * Handler for button's reference.
         */
        createRefToButton: React.PropTypes.func
    };

    /**
     * Initializes new ToolbarButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind methods to save the context
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        const { button } = this.props;
        const attributes = getButtonAttributesByProps(button);

        return (
            <a
                { ...attributes }
                onClick = { this._onClick }
                ref = { this.props.createRefToButton }>
                { this._renderInnerElementsIfRequired() }
                { this._renderChildComponentIfRequired() }
            </a>
        );
    }

    /**
     * Wrapper on on click handler props for current button.
     *
     * @param {Event} event - Click event object.
     * @returns {void}
     * @private
     */
    _onClick(event: Event): void {
        const {
            button,
            onClick
        } = this.props;
        const {
            enabled,
            unclickable
        } = button;

        if (enabled && !unclickable && onClick) {
            onClick(event);
        }
    }

    /**
     * Render any configured child component for the toolbar button.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderChildComponentIfRequired(): ReactElement<*> | null {
        if (this.props.button.childComponent) {
            const Child = this.props.button.childComponent;

            return <Child />;
        }

        return null;
    }

    /**
     * If toolbar button should contain children elements
     * renders them.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderInnerElementsIfRequired(): ReactElement<*> | null {
        if (this.props.button.html) {
            return this.props.button.html;
        }

        return null;
    }
}
