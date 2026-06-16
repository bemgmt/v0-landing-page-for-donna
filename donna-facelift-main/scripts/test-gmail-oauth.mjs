import "dotenv/config";
import chalk from "chalk";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, NODE_ENV } = process.env;

const EXPECTED_PROD_REDIRECT_URI = "https://donna-interactive-grid.vercel.app/api/gmail/oauth/callback";

let hasErrors = false;

function check(description, condition, fix) {
  if (condition) {
    console.log(chalk.green(`✅ ${description}`));
  } else {
    console.error(chalk.red(`❌ ${description}`));
    console.log(chalk.yellow(`   ➡️  ${fix}`));
    hasErrors = true;
  }
}

console.log(chalk.bold.underline("Gmail OAuth Configuration Validator\n"));

// 1. Environment Variable Validation
console.log(chalk.cyan("1. Checking Environment Variables..."));
check(
  "GOOGLE_CLIENT_ID is set",
  !!GOOGLE_CLIENT_ID,
  "Set GOOGLE_CLIENT_ID in your .env file or Vercel environment variables."
);
check(
  "GOOGLE_CLIENT_SECRET is set",
  !!GOOGLE_CLIENT_SECRET,
  "Set GOOGLE_CLIENT_SECRET in your .env file or Vercel environment variables."
);
check(
  "GOOGLE_REDIRECT_URI is set",
  !!GOOGLE_REDIRECT_URI,
  "Set GOOGLE_REDIRECT_URI in your .env file or Vercel environment variables."
);

// 2. Redirect URI Validation
if (GOOGLE_REDIRECT_URI) {
  console.log(chalk.cyan("\n2. Validating Redirect URI..."));
  if (NODE_ENV === "production") {
    check(
      "GOOGLE_REDIRECT_URI is using https in production",
      GOOGLE_REDIRECT_URI.startsWith("https://"),
      "Production redirect URI must use https."
    );
    check(
      `GOOGLE_REDIRECT_URI matches the expected production URI`,
      GOOGLE_REDIRECT_URI === EXPECTED_PROD_REDIRECT_URI,
      `Expected '${EXPECTED_PROD_REDIRECT_URI}', but found '${GOOGLE_REDIRECT_URI}'. Make sure this matches the value in your Google Cloud Console.`
    );
  } else {
    check(
      "GOOGLE_REDIRECT_URI is using http for local development",
      GOOGLE_REDIRECT_URI.startsWith("http://localhost"),
      "For local development, the redirect URI should start with http://localhost."
    );
  }
}

// 3. Google Cloud Console Validation (Manual Checks)
console.log(chalk.cyan("\n3. Google Cloud Console - Manual Verification Steps:"));
console.log(
  `   1. Go to: ${chalk.blue("https://console.cloud.google.com/apis/credentials")}`
);
console.log(
  `   2. Select your project and find your OAuth 2.0 Client ID.`
);
console.log(
  `   3. Verify that the Client ID matches your ${chalk.bold("GOOGLE_CLIENT_ID")} environment variable.`
);
console.log(
  `   4. Under "Authorized redirect URIs", ensure the following URI is listed:`
);
console.log(chalk.bold.magenta(`      ${NODE_ENV === 'production' ? EXPECTED_PROD_REDIRECT_URI : GOOGLE_REDIRECT_URI}`));
if (NODE_ENV === 'production') {
    console.log(chalk.gray(`   (And for local development: http://localhost:3000/api/gmail/oauth/callback)`));
}


// 4. Network Connectivity Test
console.log(chalk.cyan("\n4. Testing Network Connectivity to Google..."));
try {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST" });
  check(
    `Successfully connected to Google OAuth endpoint (received status ${response.status})`,
    response.status === 400, // Expecting 400 for empty request
    `Could not connect to Google's token endpoint. Check your server's firewall or network settings.`
  );
} catch (error) {
  check(
    "Successfully connected to Google OAuth endpoint",
    false,
    `Failed to connect to Google's token endpoint. Error: ${error.message}`
  );
}


// Final Summary
console.log("\n" + chalk.bold.underline("Validation Summary"));
if (hasErrors) {
  console.error(chalk.red.bold("\nFound configuration errors. Please review the logs above and fix the issues."));
  process.exit(1);
} else {
  console.log(chalk.green.bold("\n✅ All checks passed! Your configuration appears to be correct."));
  console.log(chalk.gray("   Note: This script does not perform a full OAuth flow and cannot verify that your Client Secret is correct."));
}
