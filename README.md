# Get Started
1. Clone Repo
2. nvm install 11.10.1
3. nvm use 11.10.1
4. npm install
5. make dev
6. Navigate to localhost:8080 or localhost:8081 if you have jane serving its webpack bundle to 8080 already

## iOS
1. Run `pod install` inside `/ios`
  * If `glog` won't install:
    * Try: `xcode-select --switch /Applications/Xcode.app`
  * If you get `Error: EMFILE: too many open files, watch`:
    * `brew update`
    * `brew install watchman`
2. Run `npm run ios` in `/` (can run `npm run ios:8` to launch in an iPhone 8 simulator)
