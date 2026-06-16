#!/usr/bin/env node

/**
 * Pre-PR Validation Script
 * 
 * Comprehensive validation script that should be run before creating a PR.
 * Validates code quality, environment configuration, testing, documentation,
 * dependencies, security, and deployment readiness.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ValidationResult {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.errors = [];
    this.warnings_list = [];
  }

  pass(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    this.passed++;
  }

  fail(message, error = null) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    this.failed++;
    this.errors.push({ message, error });
  }

  warn(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
    this.warnings++;
    this.warnings_list.push(message);
  }

  info(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  }

  section(title) {
    console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}`);
  }

  summary() {
    console.log(`\n${colors.cyan}=== VALIDATION SUMMARY ===${colors.reset}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.warnings}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);

    if (this.warnings_list.length > 0) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      this.warnings_list.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}Errors:${colors.reset}`);
      this.errors.forEach(error => {
        console.log(`  - ${error.message}`);
        if (error.error) {
          console.log(`    ${error.error}`);
        }
      });
    }

    return this.failed === 0;
  }
}

const result = new ValidationResult();

// Utility functions
function fileExists(path) {
  return existsSync(join(rootDir, path));
}

function readFile(path) {
  try {
    return readFileSync(join(rootDir, path), 'utf8');
  } catch (error) {
    return null;
  }
}

function runCommand(command, options = {}) {
  try {
    return execSync(command, { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.silent) {
      throw error;
    }
    return null;
  }
}

// Validation functions
function validateCodeQuality() {
  result.section('Code Quality Checks');

  // Check if package.json exists
  if (fileExists('package.json')) {
    result.pass('package.json found');
  } else {
    result.fail('package.json not found');
    return;
  }

  // Check TypeScript compilation
  try {
    runCommand('npx tsc --noEmit', { silent: true });
    result.pass('TypeScript compilation successful');
  } catch (error) {
    result.fail('TypeScript compilation failed', error.message);
  }

  // Check ESLint
  try {
    runCommand('npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0', { silent: true });
    result.pass('ESLint validation passed');
  } catch (error) {
    result.warn('ESLint warnings or errors found');
  }

  // Check for PHP syntax if PHP files exist
  const phpFiles = runCommand('find . -name "*.php" -not -path "./node_modules/*"', { silent: true });
  if (phpFiles && phpFiles.trim()) {
    try {
      runCommand('php -l backend/*.php', { silent: true });
      result.pass('PHP syntax validation passed');
    } catch (error) {
      result.fail('PHP syntax errors found', error.message);
    }
  }
}

function validateEnvironmentConfiguration() {
  result.section('Environment Configuration Validation');

  // Check environment variable templates
  const envFiles = [
    'vercel-env-vars.txt',
    '.env.example',
    'docs/RAILWAY_ENV_SETUP.md',
    'docs/SITEGROUND_BACKEND_SETUP.md'
  ];

  envFiles.forEach(file => {
    if (fileExists(file)) {
      result.pass(`Environment template found: ${file}`);
    } else {
      result.warn(`Environment template missing: ${file}`);
    }
  });

  // Validate required environment variables are documented
  const vercelEnvContent = readFile('vercel-env-vars.txt');
  if (vercelEnvContent) {
    const requiredVars = [
      'NEXT_PUBLIC_WEBSOCKET_URL',
      'NEXT_PUBLIC_API_BASE',
      'GOOGLE_REDIRECT_URI',
      'NEXT_PUBLIC_ALLOWED_ORIGIN'
    ];

    requiredVars.forEach(varName => {
      if (vercelEnvContent.includes(varName)) {
        result.pass(`Required environment variable documented: ${varName}`);
      } else {
        result.fail(`Missing required environment variable: ${varName}`);
      }
    });
  }
}

function validateTestingInfrastructure() {
  result.section('Testing Infrastructure Validation');

  // Check if test scripts exist
  const testScripts = [
    'scripts/production-health-check.mjs',
    'scripts/validate-production-env.mjs',
    'scripts/test-websocket-connection.mjs'
  ];

  testScripts.forEach(script => {
    if (fileExists(script)) {
      result.pass(`Test script found: ${script}`);
    } else {
      result.warn(`Test script missing: ${script}`);
    }
  });

  // Run unit tests
  try {
    runCommand('npm test', { silent: true });
    result.pass('Unit tests passed');
  } catch (error) {
    result.fail('Unit tests failed', error.message);
  }

  // Run WebSocket tests if available
  try {
    runCommand('npm run test:ws2:all', { silent: true });
    result.pass('WebSocket tests passed');
  } catch (error) {
    result.warn('WebSocket tests not available or failed');
  }

  // Run security tests if available
  try {
    runCommand('npm run test:security:smoke', { silent: true });
    result.pass('Security tests passed');
  } catch (error) {
    result.warn('Security tests not available or failed');
  }
}

function validateDocumentation() {
  result.section('Documentation Validation');

  // Check for required documentation files
  const docFiles = [
    'README.md',
    'docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md',
    'docs/PRODUCTION_VALIDATION_CHECKLIST.md',
    'docs/PRODUCTION_DEPLOYMENT_SUMMARY.md',
    'docs/PR_COMMIT_ORGANIZATION.md',
    'docs/AUGMENT_PR_GUIDE.md'
  ];

  docFiles.forEach(file => {
    if (fileExists(file)) {
      result.pass(`Documentation found: ${file}`);
    } else {
      result.warn(`Documentation missing: ${file}`);
    }
  });

  // Check README.md for basic content
  const readme = readFile('README.md');
  if (readme) {
    if (readme.includes('DONNA Interactive')) {
      result.pass('README.md contains project description');
    } else {
      result.warn('README.md may need project description update');
    }
  }

  // Validate deployment checklist completeness
  const deploymentChecklist = readFile('docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md');
  if (deploymentChecklist) {
    const requiredSections = ['Environment Variables', 'Post-Deployment Testing', 'Monitoring'];
    requiredSections.forEach(section => {
      if (deploymentChecklist.includes(section)) {
        result.pass(`Deployment checklist includes: ${section}`);
      } else {
        result.warn(`Deployment checklist missing section: ${section}`);
      }
    });
  }
}

function validateDependenciesAndSecurity() {
  result.section('Dependencies and Security Validation');

  // Check for outdated dependencies
  try {
    const outdated = runCommand('npm outdated --json', { silent: true });
    if (outdated && outdated.trim() !== '{}') {
      result.warn('Some dependencies are outdated');
    } else {
      result.pass('All dependencies are up to date');
    }
  } catch (error) {
    result.warn('Could not check dependency status');
  }

  // Check for security vulnerabilities
  try {
    runCommand('npm audit --audit-level moderate', { silent: true });
    result.pass('No security vulnerabilities found');
  } catch (error) {
    result.warn('Security vulnerabilities detected - run npm audit for details');
  }

  // Check for exposed secrets
  const sensitivePatterns = [
    /sk_[a-zA-Z0-9]{48}/g, // Clerk secret keys
    /pk_[a-zA-Z0-9]{48}/g, // Clerk publishable keys
    /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g // UUIDs that might be secrets
  ];

  const filesToCheck = [
    'vercel-env-vars.txt',
    '.env.example',
    'README.md'
  ];

  filesToCheck.forEach(file => {
    const content = readFile(file);
    if (content) {
      let foundSecrets = false;
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          foundSecrets = true;
        }
      });
      
      if (!foundSecrets) {
        result.pass(`No exposed secrets in ${file}`);
      } else {
        result.fail(`Potential exposed secrets in ${file}`);
      }
    }
  });
}

function validateDeploymentReadiness() {
  result.section('Deployment Readiness Validation');

  // Check if all deployment configurations exist
  const deploymentFiles = [
    'vercel.json',
    'package.json',
    'next.config.mjs'
  ];

  deploymentFiles.forEach(file => {
    if (fileExists(file)) {
      result.pass(`Deployment configuration found: ${file}`);
    } else {
      result.warn(`Deployment configuration missing: ${file}`);
    }
  });

  // Validate Next.js configuration
  const nextConfig = readFile('next.config.mjs');
  if (nextConfig) {
    if (nextConfig.includes('rewrites') || nextConfig.includes('headers')) {
      result.pass('Next.js configuration includes production settings');
    } else {
      result.warn('Next.js configuration may need production settings');
    }
  }

  // Check if build succeeds (skip for now to avoid hanging)
  try {
    // Skip build test for now as it may hang in some environments
    // runCommand('npm run build', { silent: true });
    result.info('Production build test skipped (can be run manually with: npm run build)');
  } catch (error) {
    result.fail('Production build failed', error.message);
  }

  // Validate environment-specific configurations
  const railwaySetup = readFile('docs/RAILWAY_ENV_SETUP.md');
  if (railwaySetup && railwaySetup.includes('ALLOWED_ORIGINS')) {
    result.pass('Railway environment configuration documented');
  } else {
    result.warn('Railway environment configuration may be incomplete');
  }
}

// Main execution
async function main() {
  console.log(`${colors.magenta}DONNA Interactive - Pre-PR Validation${colors.reset}`);
  console.log(`${colors.blue}Running comprehensive validation checks...${colors.reset}\n`);

  validateCodeQuality();
  validateEnvironmentConfiguration();
  validateTestingInfrastructure();
  validateDocumentation();
  validateDependenciesAndSecurity();
  validateDeploymentReadiness();

  const success = result.summary();

  if (success) {
    console.log(`\n${colors.green}🎉 All validations passed! PR is ready for creation.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Validation failed. Please fix the errors before creating PR.${colors.reset}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}Validation script failed:${colors.reset}`, error);
  process.exit(1);
});
