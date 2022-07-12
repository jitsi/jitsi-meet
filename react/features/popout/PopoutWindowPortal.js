import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from '../base/redux';
import { getParticipantDisplayName } from '../base/participants';
import { PopoutContent } from './PopoutContent';
import { closePopout } from './actions';

class PopoutWindowPortal extends React.PureComponent {
    constructor(props) {
        super(props);
        this.containerEl = document.createElement('div');
        this.externalWindow = null;
    }
    
    render() {
        return ReactDOM.createPortal(<PopoutContent participantId={this.props.participantId} />, this.containerEl);
    }
  
    componentDidMount() {
        this.externalWindow = window.open('', this.props.participantId, 'width=600,height=400,left=200,top=200');  
        this.externalWindow.window.document.body.appendChild(this.containerEl);
        this.externalWindow.document.title = this.props.participantName;

        copyStyles(document, this.externalWindow.window.document);

        this.externalWindow.addEventListener('beforeunload', () => this.props.dispatch(closePopout(this.props.participantId)));
    }
  
    componentWillUnmount() {
        this.externalWindow.close();
    }
}

export default connect(mapStateToProps)(PopoutWindowPortal);


function mapStateToProps(state, ownProps) {
    const { participantId } = ownProps;
    return {
        participantName: getParticipantDisplayName(state, participantId)
    }
}

function copyStyles(sourceDoc, targetDoc) {
    Array.from(sourceDoc.styleSheets).forEach(styleSheet => {
        if (styleSheet.cssRules) { // true for inline styles
            const newStyleEl = sourceDoc.createElement('style');
    
            Array.from(styleSheet.cssRules).forEach(cssRule => {
                newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
            });
    
            targetDoc.head.appendChild(newStyleEl);
        } else if (styleSheet.href) { // true for stylesheets loaded from a URL
            const newLinkEl = sourceDoc.createElement('link');
    
            newLinkEl.rel = 'stylesheet';
            newLinkEl.href = styleSheet.href;
            targetDoc.head.appendChild(newLinkEl);
        }
    });
}
