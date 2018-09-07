/* @flow */

import AbstractContainer from '../AbstractContainer';

/**
 * Represents a container of React/Web {@link Component} children with a style.
 *
 * @extends AbstractContainer
 */
export default class Container extends AbstractContainer {
    /**
     * {@code Container} component's property types.
     *
     * @static
     */
    static propTypes = AbstractContainer.propTypes;

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { visible = true } = this.props;

        return visible ? super._render('div') : null;
    }
}
