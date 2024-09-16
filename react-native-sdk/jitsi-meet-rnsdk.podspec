require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'jitsi-meet-rnsdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.source         = { :git => package['repository']['url'], :tag => s.version }

  s.requires_arc   = true
  s.platform       = :ios, '15.1'

  s.preserve_paths = 'ios/**/*'
  s.source_files   =  'ios/**/*.{h,m}'

  s.dependency 'React-Core'
  s.dependency 'react-native-webrtc'

  s.dependency 'ObjectiveDropboxOfficial', '6.2.3'

  s.script_phase = {
      :name => 'Copy Sound Files',
      :script => '
          SOURCE_PATH="${PODS_TARGET_SRCROOT}/sounds/"
          TARGET_PATH=$(dirname "${CONFIGURATION_BUILD_DIR}")
          PROJECT_NAME=$(basename $(dirname $(dirname "${PROJECT_DIR}"))).app
          cp -R "${SOURCE_PATH}" "${TARGET_PATH}/${PROJECT_NAME}"
      ',
  }
end
