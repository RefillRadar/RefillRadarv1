#!/usr/bin/env node

console.log('🔧 QStash Environment Variables Check')
console.log('=====================================')

const qstashToken = process.env.QSTASH_TOKEN
const qstashUrl = process.env.QSTASH_URL  
const qstashSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY

console.log('QSTASH_TOKEN:', qstashToken ? '✅ SET' : '❌ NOT SET')
console.log('QSTASH_URL:', qstashUrl ? '✅ SET' : '❌ NOT SET')
console.log('QSTASH_CURRENT_SIGNING_KEY:', qstashSigningKey ? '✅ SET' : '❌ NOT SET')

if (qstashToken && qstashUrl && qstashSigningKey) {
  console.log('\n🎉 QStash fully configured!')
  console.log('✅ Ready for production queue processing')
} else {
  console.log('\n⚠️ QStash not fully configured')
  console.log('Missing variables need to be added to .env.local')
}

console.log('\n📝 Example .env.local format:')
console.log('QSTASH_TOKEN=qstash_...')
console.log('QSTASH_URL=https://qstash.upstash.io/...')  
console.log('QSTASH_CURRENT_SIGNING_KEY=sig_...')