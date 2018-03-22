/*
 * Copyright @ 2017-present Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

public enum JitsiMeetPresentationUpdate {
    
    /// The conference wants to enter Picture-in-Picture
    case enterPictureInPicture
    
    /// A screen size change (usually screen rotation)
    case sizeChange
}

public protocol JitsiMeetViewControllerDelegate: class {
    
    /// Notifies a change of the conference presentation style.
    ///
    /// - Parameter to: The presentation state that will be changed to
    func performPresentationUpdate(to: JitsiMeetPresentationUpdate)
    
    /// The conference started
    func conferenceStarted()
    
    /// The conference ended
    ///
    /// - Parameter didFail: The reason of ending the conference
    func conferenceEnded(didFail: Bool)
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
 
    open override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        delegate?.performPresentationUpdate(to: .sizeChange)
    }
}

extension JitsiMeetViewController: JitsiMeetViewDelegate {
    
    open func conferenceWillJoin(_ data: [AnyHashable : Any]!) {
        // do something
    }
    
    open func conferenceJoined(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceStarted()
        }
    }
    
    open func conferenceWillLeave(_ data: [AnyHashable : Any]!) {
        // do something
    }
    
    open func conferenceLeft(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceEnded(didFail: false)
        }
    }
    
    open func conferenceFailed(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceEnded(didFail: true)
        }
    }
    
    open func loadConfigError(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceEnded(didFail: true)
        }
    }
    
    open func enterPicture(inPicture data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
           self.delegate?.performPresentationUpdate(to: .enterPictureInPicture)
        }
    }
}
