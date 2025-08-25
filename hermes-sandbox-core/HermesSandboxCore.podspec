require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "HermesSandboxCore"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => ".git", :tag => "#{s.version}" }

  # Include both iOS-specific files and the shared C++ core
  s.source_files = "ios/**/*.{h,m,mm,cpp}", "hermes_sandbox_core.cpp", "hermes_sandbox.h"
  s.private_header_files = "ios/**/*.h", "hermes_sandbox.h"

  install_modules_dependencies(s)
end
