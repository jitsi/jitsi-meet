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
  s.dependency 'JitsiWebRTC', '~> 111.0.0'

end
