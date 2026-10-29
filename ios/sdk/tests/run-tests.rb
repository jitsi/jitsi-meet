#!/usr/bin/env ruby
require 'fileutils'
require 'optparse'
require 'tmpdir'
require 'xcodeproj'

options = {}
OptionParser.new do |parser|
  parser.banner = 'Usage: ruby sdk/tests/run-tests.rb --frameworks DIR --destination DESTINATION'
  parser.on('--frameworks DIR') { |value| options[:frameworks] = value }
  parser.on('--destination DESTINATION') { |value| options[:destination] = value }
end.parse!
abort 'Both --frameworks and --destination are required' unless options[:frameworks] && options[:destination] && ARGV.empty?
frameworks = File.expand_path(options[:frameworks])
names = %w[JitsiMeetSDK hermesvm WebRTC GiphyUISDK]
names.each do |name|
  path = File.join(frameworks, "#{name}.xcframework")
  abort "Missing framework: #{path}" unless File.directory?(path) && File.file?(File.join(path, 'Info.plist'))
end
abort 'Destination must select an iOS Simulator' unless options[:destination].include?('platform=iOS Simulator')

root = File.expand_path('..', __dir__)
work = Dir.mktmpdir('jitsi-public-repro-tests-')
puts "Test workspace: #{work}"
FileUtils.mkdir_p(["#{work}/Package/Frameworks", "#{work}/src", "#{work}/tests"])
names.each { |name| FileUtils.ln_s(File.join(frameworks, "#{name}.xcframework"), "#{work}/Package/Frameworks/#{name}.xcframework") }
%w[JitsiBackgroundEffects.h JitsiBackgroundEffects+Private.h JMBackgroundFrameProcessor.h].each do |file|
  FileUtils.cp(File.join(root, 'src', file), "#{work}/src/#{file}")
end
%w[JitsiBackgroundEffectsTests.m JitsiCuratedBackgroundTests.m].each do |file|
  FileUtils.cp(File.join(__dir__, file), "#{work}/tests/#{file}")
end
FileUtils.cp(File.join(__dir__, 'TestHost.swift'), "#{work}/TestHost.swift")
targets = names.map { |name| ".binaryTarget(name: \"#{name}\", path: \"Frameworks/#{name}.xcframework\")" }.join(', ')
File.write("#{work}/Package/Package.swift", <<~SWIFT)
  // swift-tools-version: 5.9
  import PackageDescription
  let package = Package(name: "JitsiPublicSDK", platforms: [.iOS("15.1")], products: [.library(name: "JitsiPublicSDK", targets: #{names.inspect})], targets: [#{targets}])
SWIFT

project_path = "#{work}/JitsiPublicTests.xcodeproj"
project = Xcodeproj::Project.new(project_path)
app = project.new_target(:application, 'JitsiTestHost', :ios, '15.1')
tests = project.new_target(:unit_test_bundle, 'JitsiPublicTests', :ios, '15.1')
tests.add_dependency(app)
app.source_build_phase.add_file_reference(project.main_group.new_file('TestHost.swift'))
group = project.main_group.new_group('Tests', 'tests')
%w[JitsiBackgroundEffectsTests.m JitsiCuratedBackgroundTests.m].each do |file|
  tests.source_build_phase.add_file_reference(group.new_file(file))
end
package = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
package.relative_path = 'Package'
project.root_object.package_references << package
product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
product.package = package
product.product_name = 'JitsiPublicSDK'
[app, tests].each do |target|
  target.package_product_dependencies << product
  build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  build_file.product_ref = product
  target.frameworks_build_phase.files << build_file
  target.build_configurations.each do |config|
    settings = config.build_settings
    settings['GENERATE_INFOPLIST_FILE'] = 'YES'
    settings['SWIFT_VERSION'] = '5.0'
    settings['PRODUCT_BUNDLE_IDENTIFIER'] = "org.example.jitsi.#{target.name.downcase}"
    settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @loader_path/Frameworks'
  end
end
tests.build_configurations.each do |config|
  config.build_settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/JitsiTestHost.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/JitsiTestHost'
  config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_test_target(tests)
scheme.set_launch_target(app)
scheme.save_as(project_path, 'JitsiPublicTests', true)

command = ['xcodebuild', 'test', '-project', project_path, '-scheme', 'JitsiPublicTests', '-configuration', 'Debug',
           '-destination', options[:destination], '-derivedDataPath', "#{work}/DerivedData", '-resultBundlePath', "#{work}/Tests.xcresult",
           '-parallel-testing-enabled', 'NO', '-jobs', '4', 'CODE_SIGNING_ALLOWED=NO']
log_path = "#{work}/test.log"
puts "Build log: #{log_path}"
$stdout.flush
File.open(log_path, 'w') { |log| system(*command, out: log, err: [:child, :out]) }
status = $?.exitstatus
puts "xcodebuild exit status: #{status}"
exit(status || 1)
