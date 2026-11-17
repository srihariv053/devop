// ==============================================================================
// SubSentry AI - Merchant Normalization Engine
// Normalized patterns for Indian Banking, UPI AutoPay, OTT, and Global SaaS
// ==============================================================================

import { SubscriptionCategory } from '../types';

export interface NormalizedMerchantResult {
  raw: string;
  normalizedName: string;
  category: SubscriptionCategory;
  cancellationUrl?: string;
  cancellationInstructions?: string;
  isProbableSubscription: boolean;
}

interface MerchantRule {
  pattern: RegExp;
  normalizedName: string;
  category: SubscriptionCategory;
  cancellationUrl?: string;
  cancellationInstructions?: string;
}

const KNOWN_MERCHANTS: MerchantRule[] = [
  // Video & OTT
  {
    pattern: /(netflix|nflx)/i,
    normalizedName: 'Netflix',
    category: 'Streaming',
    cancellationUrl: 'https://www.netflix.com/youraccount',
    cancellationInstructions: 'Visit Account Settings > Cancel Membership. Access continues until billing cycle ends.'
  },
  {
    pattern: /(hotstar|disney\+?\s*hotstar)/i,
    normalizedName: 'Disney+ Hotstar',
    category: 'Streaming',
    cancellationUrl: 'https://www.hotstar.com/in/mypage',
    cancellationInstructions: 'Go to My Space > Help & Settings > Subscriptions > Cancel Subscription.'
  },
  {
    pattern: /(amazon\s*prime|amzn\s*prime|prime\s*video)/i,
    normalizedName: 'Amazon Prime',
    category: 'Shopping',
    cancellationUrl: 'https://www.amazon.in/mc/manage',
    cancellationInstructions: 'Go to Amazon.in > Your Account > Prime Membership > Manage Membership > End Membership.'
  },
  {
    pattern: /(jiocinema|jio\s*cinema)/i,
    normalizedName: 'JioCinema Premium',
    category: 'Streaming',
    cancellationUrl: 'https://www.jiocinema.com/subscription',
    cancellationInstructions: 'Open JioCinema app > Profile > My Subscription > Cancel AutoPay in UPI app.'
  },
  {
    pattern: /(sony\s*liv|sonyliv)/i,
    normalizedName: 'SonyLIV',
    category: 'Streaming',
    cancellationUrl: 'https://www.sonyliv.com/my-account',
    cancellationInstructions: 'Go to My Account > Manage Subscription > Cancel Plan.'
  },
  {
    pattern: /(zee5|zee\s*entertainment)/i,
    normalizedName: 'Zee5',
    category: 'Streaming',
    cancellationUrl: 'https://www.zee5.com/myaccount/subscription',
    cancellationInstructions: 'Go to Profile > My Subscriptions > Cancel Automatic Renewal.'
  },
  {
    pattern: /(youtube\s*premium|yt\s*premium|google\s*youtube)/i,
    normalizedName: 'YouTube Premium',
    category: 'Streaming',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    cancellationInstructions: 'Go to YouTube > Purchases and memberships > Manage membership > Deactivate.'
  },

  // Music Streaming
  {
    pattern: /(spotify)/i,
    normalizedName: 'Spotify',
    category: 'Music',
    cancellationUrl: 'https://www.spotify.com/in/account/overview/',
    cancellationInstructions: 'Log into Spotify Account page > Your plan > Change plan > Cancel Premium.'
  },
  {
    pattern: /(apple\s*music|itunes\s*music)/i,
    normalizedName: 'Apple Music',
    category: 'Music',
    cancellationUrl: 'https://support.apple.com/en-in/HT202039',
    cancellationInstructions: 'Open Settings on iPhone > Apple ID > Subscriptions > Apple Music > Cancel.'
  },
  {
    pattern: /(gaana|wynk|jiosaavn|saavn)/i,
    normalizedName: 'JioSaavn Pro',
    category: 'Music',
    cancellationUrl: 'https://www.jiosaavn.com/pro',
    cancellationInstructions: 'Cancel via UPI AutoPay mandate in Google Pay/PhonePe or in app settings.'
  },

  // AI & Productivity Software
  {
    pattern: /(openai|chatgpt)/i,
    normalizedName: 'ChatGPT Plus',
    category: 'Software',
    cancellationUrl: 'https://chatgpt.com/#settings/Subscription',
    cancellationInstructions: 'Click Profile > My Plan > Manage My Subscription > Cancel Plan.'
  },
  {
    pattern: /(github|gh\s*sponsors)/i,
    normalizedName: 'GitHub Pro',
    category: 'Software',
    cancellationUrl: 'https://github.com/settings/billing',
    cancellationInstructions: 'Go to GitHub Settings > Billing and plans > Change plan > Downgrade.'
  },
  {
    pattern: /(microsoft|msft|office365|onedrive)/i,
    normalizedName: 'Microsoft 365',
    category: 'Software',
    cancellationUrl: 'https://account.microsoft.com/services',
    cancellationInstructions: 'Log into Microsoft Services & Subscriptions > Manage > Cancel subscription.'
  },
  {
    pattern: /(google\s*one|google\s*storage|gsuite|google\s*workspace)/i,
    normalizedName: 'Google One',
    category: 'Cloud storage',
    cancellationUrl: 'https://one.google.com/settings',
    cancellationInstructions: 'Go to Google One Settings > Cancel membership.'
  },
  {
    pattern: /(notion\s*labs|notion)/i,
    normalizedName: 'Notion Plus',
    category: 'Software',
    cancellationUrl: 'https://www.notion.so/settings/billing',
    cancellationInstructions: 'Settings & Members > Billing > Downgrade to Free plan.'
  },
  {
    pattern: /(canva)/i,
    normalizedName: 'Canva Pro',
    category: 'Software',
    cancellationUrl: 'https://www.canva.com/settings/billing-and-teams',
    cancellationInstructions: 'Account Settings > Billing & Teams > Cancel subscription.'
  },
  {
    pattern: /(dropbox)/i,
    normalizedName: 'Dropbox',
    category: 'Cloud storage',
    cancellationUrl: 'https://www.dropbox.com/account/plan',
    cancellationInstructions: 'Account Settings > Plan > Cancel plan.'
  },
  {
    pattern: /(claude|anthropic)/i,
    normalizedName: 'Claude Pro',
    category: 'Software',
    cancellationUrl: 'https://claude.ai/settings/billing',
    cancellationInstructions: 'Settings > Billing > Cancel subscription.'
  },

  // Food, Delivery & Quick Commerce Memberships
  {
    pattern: /(swiggy\s*one|swiggy)/i,
    normalizedName: 'Swiggy One',
    category: 'Food delivery',
    cancellationUrl: 'https://www.swiggy.com/my-account',
    cancellationInstructions: 'Open Swiggy App > Account > Swiggy One > Manage Auto-Renewal > Turn Off.'
  },
  {
    pattern: /(zomato\s*gold|zomato)/i,
    normalizedName: 'Zomato Gold',
    category: 'Food delivery',
    cancellationUrl: 'https://www.zomato.com',
    cancellationInstructions: 'Open Zomato App > Profile > Zomato Gold > Manage Membership.'
  },
  {
    pattern: /(zepto\s*pass|zepto)/i,
    normalizedName: 'Zepto Pass',
    category: 'Shopping',
    cancellationUrl: 'https://www.zeptonow.com',
    cancellationInstructions: 'In Zepto App > Profile > Pass > Disable Auto-renewal mandate.'
  },
  {
    pattern: /(bbdaily|bigbasket|bb\s*star)/i,
    normalizedName: 'BigBasket BBstar',
    category: 'Shopping',
    cancellationUrl: 'https://www.bigbasket.com',
    cancellationInstructions: 'Go to BBstar membership section > Auto-Renewal Settings.'
  },

  // Fitness & Health
  {
    pattern: /(cult\.?fit|curefit)/i,
    normalizedName: 'Cult.fit Elite/PRO',
    category: 'Fitness',
    cancellationUrl: 'https://www.cult.fit/me/orders',
    cancellationInstructions: 'Open Cult app > Profile > My Orders / Memberships > Pause or Cancel AutoPay.'
  },

  // Utilities, Broadband, DTH & Telecom
  {
    pattern: /(airtel\s*broadband|airtel\s*autopay|airtel\s*postpaid)/i,
    normalizedName: 'Airtel Xstream Fiber / Postpaid',
    category: 'Utilities',
    cancellationUrl: 'https://www.airtel.in/airtel-thanks-app',
    cancellationInstructions: 'Airtel Thanks App > Manage Services > AutoPay settings > Revoke UPI Mandate.'
  },
  {
    pattern: /(jio\s*fiber|jio\s*autopay)/i,
    normalizedName: 'JioFiber Broadband',
    category: 'Utilities',
    cancellationUrl: 'https://www.jio.com/myaccount',
    cancellationInstructions: 'MyJio app > JioFiber > AutoPay > Turn off Auto-Debit.'
  },
  {
    pattern: /(tata\s*play|tata\s*sky)/i,
    normalizedName: 'Tata Play DTH',
    category: 'Utilities',
    cancellationUrl: 'https://www.tataplay.com',
    cancellationInstructions: 'Manage account or delete mandate in banking app.'
  },

  // Finance, Insurance & Investments
  {
    pattern: /(lic\s*india|lic\s*premium|life\s*insurance)/i,
    normalizedName: 'LIC Life Insurance Premium',
    category: 'Finance',
    cancellationInstructions: 'Insurance mandates must be altered through your LIC portal or branch.'
  },
  {
    pattern: /(hdfc\s*life|hdfc\s*ergo)/i,
    normalizedName: 'HDFC Life Insurance',
    category: 'Finance',
    cancellationInstructions: 'Contact HDFC Life or visit net banking mandate management.'
  },
  {
    pattern: /(zerodha|kite\s*zerodha)/i,
    normalizedName: 'Zerodha Account Maintenance (AMC)',
    category: 'Finance',
    cancellationInstructions: 'Quarterly AMC deduction for Zerodha Trading & Demat Account.'
  },
  {
    pattern: /(groww\s*invest|groww)/i,
    normalizedName: 'Groww SIP AutoPay',
    category: 'Finance',
    cancellationInstructions: 'Groww App > Mutual Funds > SIPs > Select SIP > Cancel SIP.'
  }
];

export function normalizeMerchant(rawDescription: string): NormalizedMerchantResult {
  const cleanRaw = rawDescription.trim();

  for (const merchant of KNOWN_MERCHANTS) {
    if (merchant.pattern.test(cleanRaw)) {
      return {
        raw: cleanRaw,
        normalizedName: merchant.normalizedName,
        category: merchant.category,
        cancellationUrl: merchant.cancellationUrl,
        cancellationInstructions: merchant.cancellationInstructions,
        isProbableSubscription: true
      };
    }
  }

  // Fallback heuristic: clean up common bank payment noise
  // e.g., "UPI/4293848/PAYTM/COFFEE" -> "Paytm"
  let fallbackName = cleanRaw
    .replace(/^(UPI|NEFT|IMPS|POS|ACH|NACH|E-MANDATE|SI|INB)\/+/i, '')
    .replace(/[0-9*#-]+/g, ' ')
    .replace(/\s+(IN|MUMBAI|BANGALORE|HYDERABAD|DELHI|PUNE|CHENNAI|BLR|HYD|GURGAON)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (fallbackName.length < 2) {
    fallbackName = cleanRaw;
  }

  return {
    raw: cleanRaw,
    normalizedName: fallbackName,
    category: 'Other',
    isProbableSubscription: false
  };
}
