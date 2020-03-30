# This file contains a make script for the PwnedWallet application
#
# Author: Josh McIntyre
#

# This block defines makefile variables
SRC_FILES=src/*
BUILD_DIR=build

# This rule builds the application
build: $(SRC_FILES)
	npm run build

# This rule cleans the build directory
clean: $(BUILD_DIR)
	rm $(BUILD_DIR)/*
	rmdir $(BUILD_DIR)
