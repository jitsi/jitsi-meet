//
//  JitsiViewController.swift
//  PiPApp
//
//  Created by Daniel Ornelas on 3/5/18.
//  Copyright © 2018 Atlassian Inc. All rights reserved.
//

import JitsiMeet
import UIKit

final class JitsiViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        guard let jitsiView = self.view as? JitsiMeetView else { return }
        
        jitsiView.welcomePageEnabled = true
        jitsiView.load(nil)
        
        // TODO: delete me, this is only testing access to swift object in SDK
        let jitsiManager = JitsiManager()
        jitsiManager.testMe()
    }
}
