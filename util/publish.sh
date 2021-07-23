#!/bin/bash

# Example call of this script:
# ./util/perform-release.sh [RELEASE_VERSION] [NEXT_DEV_VERSION] [RELEASE_MESSAGE]

# Example: ./util/perform-release.sh 1.0.0 1.0.1-SNAPSHOT "Test123 Test456"

# Stop at first command failure.
set -e

# Get the current directory.
SCRIPTDIR=$(dirname "$0")

# Load our functions
. "$SCRIPTDIR"/functions.bash.sh

# Check availability of some needed tools.
chkcmd "mvn"

# The project name
PROJECT_NAME="SHOGun admin client"

################################################################################
thickbox "Performing a release for $PROJECT_NAME"
################################################################################

# Check if the input parameter RELEASE_VERSION is valid.
RELEASE_VERSION="$1"
if [[ ! $RELEASE_VERSION =~ ^([0-9]+\.[0-9]+\.[0-9][0-9]?)$ ]]; then
    echo "Error: RELEASE_VERSION must be in X.Y.Z format, but was $RELEASE_VERSION"
    exit 1
fi

# Check if the input parameter DEVELOPMENT_VERSION is valid.
DEVELOPMENT_VERSION="$2"
if [[ ! $DEVELOPMENT_VERSION =~ ^([0-9]+\.[0-9]+\.[0-9][0-9]?)(\-SNAPSHOT)$ ]]; then
    echo "Error: DEVELOPMENT_VERSION must be in X.Y.Z-SNAPSHOT format, but was $DEVELOPMENT_VERSION"
    exit 1
fi

# Check if the input parameter RELEASE_MESSAGE is valid.
RELEASE_MESSAGE="$3"
if [[ -z $RELEASE_MESSAGE ]]; then
    echo "Error: RELEASE_MESSAGE must be set"
    exit 1
fi

COMMIT_PREFIX="[AUTOCOMMIT]"
RELEASE_COMMIT_MSG="$COMMIT_PREFIX Set version for the release ($RELEASE_VERSION)"
PREPARE_NEXT_DEV_ITERATION_COMMIT_MSG="$COMMIT_PREFIX Set version for the next development iteration ($DEVELOPMENT_VERSION)"

pushd "$SCRIPTDIR"/..

# Set the release version.
#-------------------------------------------------------------------------------
title "Setting the release version ($RELEASE_VERSION)…"
mvn versions:set -DnewVersion="$RELEASE_VERSION"
success

# Build/Verify the module.
#-------------------------------------------------------------------------------
title "Building the module…"
mvn verify
success

# Commit the release version (checkin I of II).
#-------------------------------------------------------------------------------
title "Running the commit of the release version with message $RELEASE_COMMIT_MSG…"
mvn scm:checkin -Dmessage="$RELEASE_COMMIT_MSG"
success

# Create the release tag name.
RELEASE_TAG="v$RELEASE_VERSION"

# Create a new tag for the release version.
#-------------------------------------------------------------------------------
title "Creating a new tag with the tag $RELEASE_TAG…"
mvn scm:tag -Dtag="$RELEASE_TAG" -Dmessage="$RELEASE_MESSAGE"
success

# Deploy to nexus
title "Deploying to nexus now…"
mvn clean deploy
success

# Set the next development version.
#-------------------------------------------------------------------------------
title "Setting the version to the next development iteration ($DEVELOPMENT_VERSION)…"
mvn versions:set -DnewVersion="$DEVELOPMENT_VERSION"
success

# Commit the next development version (checkin II of II).
#-------------------------------------------------------------------------------
title "Running the commit of the development release version with message $PREPARE_NEXT_DEV_ITERATION_COMMIT_MSG…"
mvn scm:checkin -Dmessage="$PREPARE_NEXT_DEV_ITERATION_COMMIT_MSG"
success

popd

box "SUCCESS"
