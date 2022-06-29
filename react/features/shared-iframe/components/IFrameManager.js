/* @flow */
import React from 'react';

import { sendAnalytics, createSharedIFrameEvent as createEvent } from '../../analytics';
import { connect } from '../../base/redux';
import { dockToolbox } from '../../toolbox/actions.web';


/**
 * The type of the React {@link PureComponent} props of {@link IFrameManager}.
 */
export type Props = {

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function,

    /**
     * If the iframe is shared by the local user he is the owner.
     * Passed in from the parent component.
     */
    isOwner: boolean,

    /**
     * The iframe url passed in from the parent component.
     */
    iFrameUrl: string,
}

/**
 * Manager of shared iframe.
 */
class IFrameManager extends React.PureComponent<Props> {

    /**
     * Initializes a new instance of IFrameManager.
     *
     * @returns {void}
     */
    constructor() {
        super();
        this.iFrameRef = React.createRef();
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props._dockToolbox(true);
        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        const { iFrameUrl } = this.props;

        if (prevProps.iFrameUrl !== iFrameUrl) {
            sendAnalytics(createEvent('started'));
        }

        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        sendAnalytics(createEvent('stopped'));

        if (this.dispose) {
            this.dispose();
        }

        this.props._dockToolbox(false);
    }

    /**
     * Processes new properties.
     *
     * @returns {void}
     */
    processUpdatedProps() {
        const { isOwner } = this.props;

        if (isOwner) {
            return;
        }
    }

    /**
     * Disposes current iframe player.
     */
    dispose: () => void;

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { iFrameUrl } = this.props;

        return (<iframe
            frameBorder = { 0 }
            height = '100%'
            id = 'sharedIFrame'
            ref = { this.iFrameRef }
            scrolling = 'no'
            src = { iFrameUrl }
            width = '100%' />);
    }
}


/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Props}
 */
function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
    return {
        _dockToolbox: value => {
            dispatch(dockToolbox(value));
        }
    };
}

export default connect(() => {
    // TODO: Refactor to use dispatch directly (also remove the flow statement)
    return {};
}, _mapDispatchToProps)(IFrameManager);
