#!/usr/bin/env node
/**
 * Safe VAPID Key Generation Utility for Ray Sanctuary.
 * 
 * Generates genuine VAPID keys using web-push, writes them to backend/.env
 * (if not already present), and outputs configuration instructions without
 * exposing credentials in commit history.
 */

const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const envPath = path.resolve(__dirname, '../.env');
const force = process.argv.includes('--force') || process.argv.includes('-f');

function run() {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const hasPublicKey = /VAPID_PUBLIC_KEY\s*=\s*.+/i.test(envContent);
  const hasPrivateKey = /VAPID_PRIVATE_KEY\s*=\s*.+/i.test(envContent);

  if (hasPublicKey && hasPrivateKey && !force) {
    console.log('ℹ️  Valid VAPID keys already exist in backend/.env.');
    console.log('   To regenerate, run with --force: npm --prefix backend run generate-vapid-keys -- --force');
    return;
  }

  console.log('🔑 Generating genuine VAPID Web Push key pair...');
  const vapidKeys = webpush.generateVAPIDKeys();

  let updatedEnv = envContent;

  // Replace or append VAPID_PUBLIC_KEY
  if (/VAPID_PUBLIC_KEY=.*/i.test(updatedEnv)) {
    updatedEnv = updatedEnv.replace(/VAPID_PUBLIC_KEY=.*/i, `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  } else {
    updatedEnv += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
  }

  // Replace or append VAPID_PRIVATE_KEY
  if (/VAPID_PRIVATE_KEY=.*/i.test(updatedEnv)) {
    updatedEnv = updatedEnv.replace(/VAPID_PRIVATE_KEY=.*/i, `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  } else {
    updatedEnv += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
  }

  // Ensure VAPID_SUBJECT exists
  if (!/VAPID_SUBJECT=.*/i.test(updatedEnv)) {
    updatedEnv += `\nVAPID_SUBJECT=mailto:admin@ray.app`;
  }

  fs.writeFileSync(envPath, updatedEnv.trim() + '\n', 'utf8');

  console.log('✅ Genuine VAPID keys generated and securely saved to backend/.env (ignored by git).');
  console.log('\n=============================================================');
  console.log('📋 RENDER ENVIRONMENT CONFIGURATION:');
  console.log('=============================================================');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_SUBJECT=mailto:admin@ray.app`);
  console.log('VAPID_PRIVATE_KEY=[SAVED TO backend/.env - copy from your backend/.env file to Render]');
  console.log('=============================================================\n');
  console.log('⚠️  Add these 3 variables to your Render Backend Service -> Environment!');
}

run();
