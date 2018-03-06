//
//  ViewController.swift
//  ExampleAppUsingJitsiWithPiP
//
//  Created by Daniel Ornelas on 3/5/18.
//  Copyright © 2018 Atlassian Inc. All rights reserved.
//

import UIKit
import JitsiMeet

class ViewController: UIViewController {

    @IBOutlet weak var videoButton: UIButton?
    
    private var jitsiMeetManager: JitsiMeetManager?
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    // MARK: - Actions
    
    @IBAction func startMeeting(sender: Any?) {
        //let url = URL(string: "")
        self.jitsiMeetManager = JitsiMeetManager()
        jitsiMeetManager?.welcomeScreenEnabled = true
        jitsiMeetManager?.load(withUrl: nil)
    }

}

