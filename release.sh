#!/bin/bash

# Release script for Tuff MCP Manager
# Creates a new GitHub release by bumping version and pushing a tag

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Prompt for version bump type
echo ""
echo "Select version bump type:"
echo "  1) patch (${MAJOR}.${MINOR}.$((PATCH + 1)))"
echo "  2) minor (${MAJOR}.$((MINOR + 1)).0)"
echo "  3) major ($((MAJOR + 1)).0.0)"
echo "  4) custom"
read -p "Enter choice [1-4]: " CHOICE

case $CHOICE in
  1)
    NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
    ;;
  2)
    NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
    ;;
  3)
    NEW_VERSION="$((MAJOR + 1)).0.0"
    ;;
  4)
    read -p "Enter custom version: " NEW_VERSION
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Confirm
read -p "Continue with release v${NEW_VERSION}? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# Update package.json version
echo "Updating package.json..."
npm version "$NEW_VERSION" --no-git-tag-version

# Commit version bump
echo "Committing version bump..."
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "chore: bump version to ${NEW_VERSION}"

# Create and push tag
echo "Creating tag v${NEW_VERSION}..."
git tag "v${NEW_VERSION}"

# Push commit and tag
echo "Pushing to origin..."
git push origin main
git push origin "v${NEW_VERSION}"

echo ""
echo -e "${GREEN}Release v${NEW_VERSION} created successfully!${NC}"
echo "GitHub Actions will now build and publish the release."
echo "Check progress at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
