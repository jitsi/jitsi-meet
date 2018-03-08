//  Copyright © 2018 Jitsi. All rights reserved.

public enum JitsiMeetPresentationUpdate {
    
    /// A system traitCollectionChange (usually screen rotation)
    case traitChange
    /// Meeting wants to enter PiP mode
    case enterPiP
}

public protocol JitsiMeetViewControllerDelegate: class {
    
    /// Notifies a change of the meeting presentation style.
    ///
    /// - Parameter to: The presentation state that will be changed to
    func performPresentationUpdate(to: JitsiMeetPresentationUpdate)
    func meetingStarted()
    func meetingEnded(wasFailure: Bool)
}

/// Wrapper ViewController of a JitsiMeetView
///
/// Is suggested to override this class and implement some customization
/// on how to handle the JitsiMeetView delegate events
open class JitsiMeetViewController: UIViewController {
    
    open weak var delegate: JitsiMeetViewControllerDelegate?
    
    private(set) var jitsiMeetView: JitsiMeetView = JitsiMeetView()
    
    override open func loadView() {
        super.loadView()
        self.view = jitsiMeetView
    }
    
    open override func viewDidLoad() {
        super.viewDidLoad()
        
        jitsiMeetView.delegate = self
    }
    
    open override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        delegate?.performPresentationUpdate(to: .traitChange)
    }
}

extension JitsiMeetViewController: JitsiMeetViewDelegate {
    
    open func conferenceWillJoin(_ data: [AnyHashable : Any]!) {
        // do something
    }
    
    open func conferenceJoined(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.meetingStarted()
        }
    }
    
    open func conferenceWillLeave(_ data: [AnyHashable : Any]!) {
        // do something
    }
    
    open func conferenceLeft(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.meetingEnded(wasFailure: true)
        }
    }
    
    open func conferenceFailed(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.meetingEnded(wasFailure: true)
        }
    }
    
    open func loadConfigError(_ data: [AnyHashable : Any]!) {
        // do something
    }
    
    open func enterPicture(inPicture data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.performPresentationUpdate(to: .enterPiP)
        }
    }
}
