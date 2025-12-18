#!/usr/bin/env node

/**
 * Generate Test Summary
 *
 * This script parses Playwright JSON test results and generates
 * a markdown summary saved to tmp/test-results/summary.md
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '../tmp/test-results/results.json');
const SUMMARY_FILE = path.join(__dirname, '../tmp/test-results/summary.md');

function generateSummary() {
  // Check if results file exists
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('❌ No test results found at:', RESULTS_FILE);
    console.log('Run tests first: npm run test:e2e');
    process.exit(1);
  }

  // Read and parse results
  const rawData = fs.readFileSync(RESULTS_FILE, 'utf8');
  const results = JSON.parse(rawData);

  // Extract statistics
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
  };

  const failedTests = [];
  const flakyTests = [];

  // Process test suites
  results.suites.forEach(suite => {
    processSuite(suite, stats, failedTests, flakyTests);
  });

  // Calculate duration in seconds
  stats.duration = Math.round((results.stats?.duration || 0) / 1000);

  // Generate markdown
  const timestamp = new Date().toISOString();
  const summary = generateMarkdown(stats, failedTests, flakyTests, timestamp);

  // Save summary
  fs.writeFileSync(SUMMARY_FILE, summary, 'utf8');

  console.log('✅ Test summary generated:', SUMMARY_FILE);
  console.log(`📊 Stats: ${stats.passed}/${stats.total} passed, ${stats.failed} failed, ${stats.flaky} flaky`);

  // Exit with error code if tests failed
  if (stats.failed > 0) {
    process.exit(1);
  }
}

function processSuite(suite, stats, failedTests, flakyTests, suiteName = '') {
  const currentSuiteName = suiteName ? `${suiteName} > ${suite.title}` : suite.title;

  // Process specs in this suite
  if (suite.specs) {
    suite.specs.forEach(spec => {
      stats.total++;

      const testName = `${currentSuiteName} > ${spec.title}`;
      const testResults = spec.tests[0]?.results || [];

      // Check test status
      const hasFailure = testResults.some(r => r.status === 'failed' || r.status === 'timedOut');
      const hasPass = testResults.some(r => r.status === 'passed');

      if (hasFailure && hasPass) {
        stats.flaky++;
        flakyTests.push({
          name: testName,
          file: spec.file,
          results: testResults,
        });
      } else if (hasFailure) {
        stats.failed++;
        failedTests.push({
          name: testName,
          file: spec.file,
          results: testResults,
        });
      } else if (hasPass) {
        stats.passed++;
      } else if (testResults.some(r => r.status === 'skipped')) {
        stats.skipped++;
      }
    });
  }

  // Process nested suites
  if (suite.suites) {
    suite.suites.forEach(nestedSuite => {
      processSuite(nestedSuite, stats, failedTests, flakyTests, currentSuiteName);
    });
  }
}

function generateMarkdown(stats, failedTests, flakyTests, timestamp) {
  let md = `# Playwright Test Results\n\n`;
  md += `**Generated:** ${timestamp}\n\n`;

  // Summary
  md += `## 📊 Summary\n\n`;
  md += `| Status | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| ✅ Passed | ${stats.passed} |\n`;
  md += `| ❌ Failed | ${stats.failed} |\n`;
  md += `| ⚠️  Flaky | ${stats.flaky} |\n`;
  md += `| ⏭️  Skipped | ${stats.skipped} |\n`;
  md += `| **📝 Total** | **${stats.total}** |\n`;
  md += `| ⏱️  Duration | ${stats.duration}s |\n\n`;

  // Pass rate
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  md += `**Pass Rate:** ${passRate}%\n\n`;

  // Failed tests
  if (failedTests.length > 0) {
    md += `## ❌ Failed Tests (${failedTests.length})\n\n`;
    failedTests.forEach((test, index) => {
      md += `### ${index + 1}. ${test.name}\n\n`;
      md += `**File:** \`${test.file}\`\n\n`;

      test.results.forEach((result, resultIndex) => {
        if (result.status === 'failed' || result.status === 'timedOut') {
          md += `**Attempt ${resultIndex + 1}:** ${result.status}\n\n`;

          if (result.error) {
            md += `**Error:**\n\`\`\`\n${result.error.message || 'Unknown error'}\n\`\`\`\n\n`;
          }

          if (result.status === 'timedOut') {
            md += `⏱️ **Timeout:** Test exceeded ${result.duration}ms\n\n`;
          }
        }
      });

      md += `---\n\n`;
    });
  }

  // Flaky tests
  if (flakyTests.length > 0) {
    md += `## ⚠️ Flaky Tests (${flakyTests.length})\n\n`;
    md += `These tests failed on first attempt but passed on retry.\n\n`;
    flakyTests.forEach((test, index) => {
      md += `${index + 1}. **${test.name}**\n`;
      md += `   - File: \`${test.file}\`\n`;
      md += `   - Attempts: ${test.results.map(r => r.status).join(' → ')}\n\n`;
    });
  }

  // Recommendations
  if (failedTests.length > 0 || flakyTests.length > 0) {
    md += `## 💡 Recommendations\n\n`;

    if (failedTests.length > 0) {
      md += `### Failed Tests\n`;
      md += `1. Review error messages above\n`;
      md += `2. Check if elements are loading in time\n`;
      md += `3. Verify selectors are correct\n`;
      md += `4. Consider increasing timeouts if needed\n\n`;
    }

    if (flakyTests.length > 0) {
      md += `### Flaky Tests\n`;
      md += `1. Add explicit waits for elements\n`;
      md += `2. Use \`waitForLoadState('networkidle')\`\n`;
      md += `3. Increase element-specific timeouts\n`;
      md += `4. Check for race conditions\n\n`;
    }
  }

  return md;
}

// Run the script
try {
  generateSummary();
} catch (error) {
  console.error('❌ Error generating summary:', error);
  process.exit(1);
}
