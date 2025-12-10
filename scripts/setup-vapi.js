#!/usr/bin/env node

/**
 * Vapi.ai Setup Script
 * Helps you configure Vapi.ai for RefillRadar pharmacy calling
 */

console.log('🎙️ RefillRadar Vapi.ai Setup Guide')
console.log('===================================\n')

console.log('📋 Step 1: Get Vapi.ai Credentials')
console.log('1. Go to https://dashboard.vapi.ai')
console.log('2. Sign up or log in to your account')
console.log('3. Get your API key from the dashboard')
console.log('4. Purchase a phone number for outbound calls\n')

console.log('🤖 Step 2: Create Assistant')
console.log('1. In Vapi dashboard, click "Create Assistant"')
console.log('2. Copy the configuration from scripts/vapi-assistant-config.json')
console.log('3. Paste it into the assistant creation form')
console.log('4. Save and note the Assistant ID\n')

console.log('⚙️ Step 3: Update Environment Variables')
console.log('Add these to your .env file:')
console.log('')
console.log('# Vapi.ai Configuration')
console.log('VAPI_API_KEY=your_vapi_api_key_here')
console.log('VAPI_PHONE_NUMBER=+1234567890  # Your Vapi phone number')
console.log('VAPI_ASSISTANT_ID=your_assistant_id_here')
console.log('')

console.log('🌐 Step 4: Deploy to Production')
console.log('1. Deploy your app to Vercel/production')
console.log('2. Update NEXT_PUBLIC_BASE_URL=https://refillradar.com')
console.log('3. Vapi webhook URL: https://refillradar.com/api/vapi/webhook\n')

console.log('🧪 Step 5: Test Your Setup')
console.log('1. Restart your development server')
console.log('2. Go to admin panel: https://refillradar.com/admin')
console.log('3. Start a pharmacy search with real phone number')
console.log('4. Monitor console logs for Vapi call progress\n')

console.log('📞 Important Notes:')
console.log('- Test with your own phone number first!')
console.log('- Respect pharmacy hours (9 AM - 7 PM)')
console.log('- Be prepared to handle pharmacy opt-out requests')
console.log('- Monitor call costs in Vapi dashboard')
console.log('- Real calls will only work in production (NODE_ENV=production)\n')

console.log('💡 For local testing, the system uses mock calls automatically')
console.log('💡 Real Vapi calls happen only in production with valid API key')

const fs = require('fs')
const path = require('path')

// Check if .env file exists and show current status
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  console.log('\n🔍 Current .env status:')
  console.log('VAPI_API_KEY:', envContent.includes('VAPI_API_KEY=your_') ? '❌ Not set' : '✅ Configured')
  console.log('VAPI_PHONE_NUMBER:', envContent.includes('VAPI_PHONE_NUMBER=your_') ? '❌ Not set' : '✅ Configured')  
  console.log('VAPI_ASSISTANT_ID:', envContent.includes('VAPI_ASSISTANT_ID=your_') ? '❌ Not set' : '✅ Configured')
  console.log('NEXT_PUBLIC_BASE_URL:', envContent.includes('https://refillradar.com') ? '✅ Production domain' : '⚠️ Localhost')
} else {
  console.log('\n❌ .env file not found')
}

console.log('\n🚀 Ready to make real AI calls to pharmacies!')
console.log('📖 Need help? Check the Vapi.ai docs: https://docs.vapi.ai')