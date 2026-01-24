#!/bin/bash

################################################################################
# Release Test Runner
# Comprehensive test suite for release readiness
# 
# Usage:
#   ./scripts/run-tests.sh              # Run all tests
#   ./scripts/run-tests.sh --backend    # Backend tests only
#   ./scripts/run-tests.sh --frontend   # Frontend tests only
#   ./scripts/run-tests.sh --verbose    # Verbose output
#
# Exit Codes:
#   0 - All tests passed
#   1 - One or more tests failed
################################################################################

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERBOSE=${VERBOSE:-false}
BACKEND_ONLY=${BACKEND_ONLY:-false}
FRONTEND_ONLY=${FRONTEND_ONLY:-false}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Test results tracking
declare -A TEST_RESULTS
declare -a FAILED_TESTS
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS_COUNT=0
START_TIME=$(date +%s)

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backend)
      BACKEND_ONLY=true
      FRONTEND_ONLY=false
      shift
      ;;
    --frontend)
      FRONTEND_ONLY=true
      BACKEND_ONLY=false
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

log_section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Test execution wrapper
run_test() {
  local test_name=$1
  local test_command=$2
  local test_dir=$3

  ((TOTAL_TESTS++))
  
  log_step "Running: $test_name"

  if [ -n "$test_dir" ]; then
    pushd "$test_dir" > /dev/null || exit 1
  else
    cd "$PROJECT_ROOT"
  fi

  local start=$(date +%s%3N)

  if eval "$test_command" > /tmp/test_output.log 2>&1; then
    local end=$(date +%s%3N)
    local duration=$((end - start))
    ((PASSED_TESTS++))
    log_success "$test_name (${duration}ms)"
    TEST_RESULTS["$test_name"]=PASS
  else
    local end=$(date +%s%3N)
    local duration=$((end - start))
    ((FAILED_TESTS_COUNT++))
    FAILED_TESTS+=("$test_name")
    log_error "$test_name (${duration}ms)"
    TEST_RESULTS["$test_name"]=FAIL
    
    if [ "$VERBOSE" = true ]; then
      echo "Error output:"
      cat /tmp/test_output.log
      echo ""
    fi
  fi

  if [ -n "$test_dir" ]; then
    popd > /dev/null
  fi
}

# Lint checks
run_linting() {
  log_section "🔍 LINTING & CODE QUALITY"

  if [ "$FRONTEND_ONLY" != true ]; then
    log_step "Checking Backend code style..."
    # Backend linting would go here if ESLint/similar is set up
    log_warning "Backend linting: Not yet configured"
  fi

  if [ "$BACKEND_ONLY" != true ]; then
    run_test "Frontend ESLint" "npm run lint" "$PROJECT_ROOT/frontend"
  fi
}

# Backend tests
run_backend_tests() {
  if [ "$FRONTEND_ONLY" = true ]; then
    return
  fi

  log_section "🧪 BACKEND UNIT TESTS"

  cd "$PROJECT_ROOT/Backend"

  # Check if node_modules exist
  if [ ! -d "node_modules" ]; then
    log_warning "Backend dependencies not installed. Installing..."
    npm install --legacy-peer-deps || true
  fi

  run_test "Backend Unit Tests" "npm run test:unit" "$PROJECT_ROOT/Backend"
  run_test "Backend Data Layer Tests" "npm run test:data" "$PROJECT_ROOT/Backend"
}

# Frontend tests
run_frontend_tests() {
  if [ "$BACKEND_ONLY" = true ]; then
    return
  fi

  log_section "🎨 FRONTEND UNIT TESTS"

  cd "$PROJECT_ROOT/frontend"

  # Check if node_modules exist
  if [ ! -d "node_modules" ]; then
    log_warning "Frontend dependencies not installed. Installing..."
    npm install || true
  fi

  run_test "Frontend Unit Tests" "npm run test" "$PROJECT_ROOT/frontend"
  run_test "Frontend Coverage" "npm run test:coverage" "$PROJECT_ROOT/frontend"
}

# Type checking
run_type_checks() {
  log_section "📝 TYPE CHECKING"

  if [ "$FRONTEND_ONLY" != true ]; then
    log_step "TypeScript check (Backend)..."
    # Backend TypeScript checking
    log_warning "Backend TypeScript: Not yet configured"
  fi

  if [ "$BACKEND_ONLY" != true ]; then
    run_test "TypeScript Check (Frontend)" "npm run build" "$PROJECT_ROOT/frontend"
  fi
}

# Generate summary
print_summary() {
  END_TIME=$(date +%s)
  TOTAL_DURATION=$((END_TIME - START_TIME))
  MINUTES=$((TOTAL_DURATION / 60))
  SECONDS=$((TOTAL_DURATION % 60))

  log_section "📊 TEST SUMMARY"

  echo "Total Tests:    $TOTAL_TESTS"
  echo "Passed:         ${GREEN}$PASSED_TESTS${NC}"
  
  if [ $FAILED_TESTS_COUNT -gt 0 ]; then
    echo "Failed:         ${RED}$FAILED_TESTS_COUNT${NC}"
    echo ""
    echo "Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
      echo "  ${RED}✗${NC} $test"
    done
  else
    echo "Failed:         ${GREEN}0${NC}"
  fi

  echo ""
  echo "Total Duration: ${MINUTES}m ${SECONDS}s"
  echo ""

  if [ $FAILED_TESTS_COUNT -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED - READY FOR RELEASE${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    return 0
  else
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED - REVIEW REQUIRED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    return 1
  fi
}

# Main execution
main() {
  log_section "🚀 RELEASE READINESS TEST SUITE"
  echo "Project Root: $PROJECT_ROOT"
  echo "Verbose Mode: $VERBOSE"
  echo ""

  # Run test suites
  run_linting
  run_backend_tests
  run_frontend_tests
  run_type_checks

  # Print summary and exit with appropriate code
  if print_summary; then
    exit 0
  else
    exit 1
  fi
}

# Execute main function
main
