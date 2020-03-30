## General
____________

### Author
* Josh McIntyre

### Website
* jmcintyre.net

### Overview
* PwnedWallet shows the danger of using poor-entropy cryptocurrency Brainwallets

## Development
________________

### Git Workflow
* master for releases (merge development)
* development for bugfixes and new features

### Building
* make build
Build the application
* make clean
Clean the build directory

### Features
* Compute address information for a "brainwallet" phrase
* Fetch balance data from a public API to show if the address has been emptied

### Requirements
* Requires NPM for React web application

### Platforms
* Firefox
* Chrome

## Usage
____________

### Web client usage
* Enter the brainwallet "seed phrase"
* Address information will be computed by the application and displayed in a formatted table
* Balance information will be fetched and displayed in a formatted table
