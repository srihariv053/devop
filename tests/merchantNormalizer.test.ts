import test from 'node:test';
import assert from 'node:assert';
import { normalizeMerchant } from '../src/lib/algorithms/merchantNormalizer';

test('Merchant Normalizer identifies Netflix from raw bank narration', () => {
  const result = normalizeMerchant('POS 4029 NETFLIX MUMBAI IN');
  assert.strictEqual(result.normalizedName, 'Netflix');
  assert.strictEqual(result.category, 'Streaming');
  assert.strictEqual(result.isProbableSubscription, true);
  assert.ok(result.cancellationUrl?.includes('netflix.com'));
});

test('Merchant Normalizer identifies Spotify India and cancellation URL', () => {
  const result = normalizeMerchant('UPI/432091/SPOTIFY INDIA/MANDATE');
  assert.strictEqual(result.normalizedName, 'Spotify');
  assert.strictEqual(result.category, 'Music');
  assert.ok(result.cancellationUrl?.includes('spotify.com'));
});

test('Merchant Normalizer identifies Swiggy One membership', () => {
  const result = normalizeMerchant('SWIGGY ONE MEMBERSHIP HYDERABAD');
  assert.strictEqual(result.normalizedName, 'Swiggy One');
  assert.strictEqual(result.category, 'Food delivery');
});

test('Merchant Normalizer identifies ChatGPT Plus SaaS', () => {
  const result = normalizeMerchant('POS 3042 OPENAI*CHATGPT SUBSCRIPTION SAN FRANCISCO');
  assert.strictEqual(result.normalizedName, 'ChatGPT Plus');
  assert.strictEqual(result.category, 'Software');
});

test('Merchant Normalizer fallback cleans generic UPI narration', () => {
  const result = normalizeMerchant('UPI/4293848/LOCAL BAKERY/MUMBAI');
  assert.strictEqual(result.isProbableSubscription, false);
  assert.ok(result.normalizedName.toLowerCase().includes('local bakery'));
});
