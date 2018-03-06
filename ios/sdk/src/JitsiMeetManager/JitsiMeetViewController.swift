//  Copyright © 2018 Jitsi. All rights reserved.


/// Wrapper ViewController of a JitsiMeetView
///
/// TODO: should consider refactor and move out several logic of the JitsiMeetView to
/// this class
open class JitsiMeetViewController: UIViewController {
    
    private(set) var jitsiMeetView: JitsiMeetView = JitsiMeetView()
    
    override open func loadView() {
        super.loadView()
        self.view = jitsiMeetView
    }
}
