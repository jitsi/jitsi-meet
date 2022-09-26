require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = package['name']
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.source         = { :git => package['repository']['url'], :tag => s.version }

  s.requires_arc   = true
  s.platform       = :ios, '12.4'

  s.preserve_paths = 'ios/**/*'
  s.source_files   =  'ios/**/*.{h,m,swift}'


  s.dependency 'React-Core'
  s.dependency 'ObjectiveDropboxOfficial', '6.2.3'

  s.pod_target_xcconfig = { 
    "FRAMEWORK_SEARCH_PATHS" =>  '"${PODS_ROOT}/../../node_modules/react-native-webrtc/apple"',
    "HEADER_SEARCH_PATHS" => '"${PODS_ROOT}/Headers/Private/react-native-webrtc" "${PODS_ROOT}/Headers/Public/react-native-webrtc"',
    "OTHER_LDFLAGS" => '-framework WebRTC'
  }

  s.preserve_paths = '{PODS_ROOT}/../../node_modules/react-native-webrtc/apple/*.xcframework'
  s.project_header_files = '{PODS_ROOT}/../../node_modules/react-native-webrtc/apple/**/*.h'


end
