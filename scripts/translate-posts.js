#!/usr/bin/env node

/**
 * Pre-build translation script.
 *
 * Reads `data/posts.json` (English posts), produces a Hindi ("hi")
 * translation of each post's `title` and `content`, and writes the
 * result to `data/posts-translated.json`. That file backs the
 * `/hi/[slug]` route (see app/hi/[slug]/page.tsx).
 *
 * Wired up as an npm "prebuild" hook in package.json, so it runs
 * automatically before `next build`. It can also be run directly:
 *
 *   node scripts/translate-posts.js
 *   npm run translate
 *
 * Translation strategy (in order of preference):
 *   1. A curated local dictionary of known-good Hindi translations
 *      for this repo's sample posts (instant, free, offline).
 *   2. Optionally, a live call to the free LibreTranslate API for
 *      any post not covered by the dictionary — enabled by setting
 *      USE_LIVE_TRANSLATION=true (off by default, see README).
 *   3. A last-resort local "mock" translator that does simple
 *      dictionary-based word substitution, so the build NEVER fails
 *      just because a translation source is unavailable.
 *
 * The build should never break because a third-party translation
 * API is down, rate-limited, or blocked by a network policy — hence
 * live translation is opt-in and every path has an offline fallback.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const SOURCE_FILE = path.join(DATA_DIR, 'posts.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'posts-translated.json');

const USE_LIVE_TRANSLATION = process.env.USE_LIVE_TRANSLATION === 'true';
const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';
const LIVE_TRANSLATION_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// 1. Curated dictionary — hand-written Hindi translations for the sample
//    posts that ship with this repo. Keyed by the exact English title so we
//    can look up title + content together.
// ---------------------------------------------------------------------------
const DICTIONARY = {
  'Getting Started with Next.js': {
    title: 'Next.js के साथ शुरुआत करें',
    content:
      'Next.js एक React फ्रेमवर्क है जो सर्वर-साइड रेंडरिंग, स्टैटिक साइट जनरेशन और भी बहुत कुछ शुरुआत से ही उपलब्ध कराता है। यह फ़ाइल-आधारित राउटिंग, API रूट्स और ऑप्टिमाइज़्ड इमेज हैंडलिंग जैसी शक्तिशाली सुविधाएं प्रदान करता है। चाहे आप एक साधारण ब्लॉग बना रहे हों या एक जटिल वेब एप्लिकेशन, Next.js आपको न्यूनतम कॉन्फ़िगरेशन के साथ तेज़, SEO-फ्रेंडली पेज बनाने के उपकरण देता है। App Router नेस्टेड लेआउट और सर्वर कंपोनेंट्स का उपयोग करके आपके एप्लिकेशन को संरचित करने का एक नया तरीका प्रस्तुत करता है, जिससे समृद्ध, इंटरैक्टिव अनुभव बनाना पहले से कहीं ज़्यादा आसान हो जाता है।',
  },
  'Understanding Static Site Generation': {
    title: 'स्टैटिक साइट जनरेशन को समझना',
    content:
      'स्टैटिक साइट जनरेशन (SSG) का मतलब है पेजों को रिक्वेस्ट के समय के बजाय कंपाइल के समय बनाना। यह तरीका पहले से रेंडर की गई HTML फ़ाइलें बनाता है जिन्हें CDN से तुरंत सर्व किया जा सकता है, जिससे पेज बेहद तेज़ी से लोड होते हैं और SEO भी बेहतरीन रहता है। Next.js में, आप बिल्ड टाइम पर डायनामिक रूट्स को पहले से रेंडर करने के लिए generateStaticParams का उपयोग कर सकते हैं। परिणामस्वरूप स्टैटिक HTML पेजों का एक सेट तैयार होता है जिसे कहीं भी डिप्लॉय किया जा सकता है — किसी सर्वर की ज़रूरत नहीं। SSG उस कंटेंट के लिए आदर्श है जो बार-बार नहीं बदलता, जैसे ब्लॉग पोस्ट, डॉक्यूमेंटेशन और मार्केटिंग पेज।',
  },
  'Styling with Tailwind CSS': {
    title: 'Tailwind CSS के साथ स्टाइलिंग',
    content:
      'Tailwind CSS एक यूटिलिटी-फर्स्ट CSS फ्रेमवर्क है जो आपको अपनी HTML छोड़े बिना कस्टम डिज़ाइन बनाने देता है। अलग CSS फ़ाइलें लिखने के बजाय, आप छोटी, संयोजन-योग्य यूटिलिटी क्लासेस का उपयोग करके सीधे अपने मार्कअप में स्टाइल्स बनाते हैं। यह तरीका आपके स्टाइल्स को कंपोनेंट्स के साथ ही रखता है, अनुपयोगी CSS को खत्म करता है, और एक सुसंगत डिज़ाइन सिस्टम बनाए रखना आसान बनाता है। Tailwind में एक शक्तिशाली कॉन्फ़िगरेशन फ़ाइल भी शामिल है जो आपको अपने ब्रांड के अनुसार रंग, स्पेसिंग, टाइपोग्राफी और अन्य चीज़ों को कस्टमाइज़ करने देती है। डार्क मोड सपोर्ट और रिस्पॉन्सिव यूटिलिटीज़ जैसी सुविधाओं के साथ, Tailwind Next.js प्रोजेक्ट्स के लिए एक बेहतरीन साथी है।',
  },
  'Deploying Your First App': {
    title: 'अपना पहला ऐप डिप्लॉय करना',
    content:
      'फ्रेमवर्क की स्टैटिक एक्सपोर्ट क्षमताओं और व्यापक होस्टिंग सपोर्ट की बदौलत Next.js एप्लिकेशन को डिप्लॉय करना बेहद आसान है। आप Netlify, Vercel या किसी भी स्टैटिक फ़ाइल होस्ट पर डिप्लॉय कर सकते हैं। डिप्लॉय करने से पहले, सुनिश्चित करें कि आपका बिल्ड लोकली पास हो रहा है और अगर आप SSG का उपयोग कर रहे हैं तो सभी डायनामिक रूट्स generateStaticParams द्वारा कवर किए गए हैं। एक बार आपका बिल्ड तैयार हो जाने पर, आउटपुट फ़ोल्डर में वह सब कुछ होता है जिसकी आपको ज़रूरत है — HTML, CSS, JavaScript और एसेट्स। अपना कोड एक रिपॉज़िटरी में पुश करें, उसे अपने होस्टिंग प्रोवाइडर से कनेक्ट करें, और कुछ ही मिनटों में अपनी साइट को लाइव होते देखें।',
  },
};

// ---------------------------------------------------------------------------
// 2. Last-resort mock translator. Used only when a post isn't in the
//    DICTIONARY and the live API is disabled/unreachable. It does simple
//    word-level substitution for common English -> Hindi tech vocabulary so
//    the pipeline always produces *something* for /hi/[slug] rather than
//    failing the build. Real posts should be added to DICTIONARY, or
//    translated live, for production-quality copy.
// ---------------------------------------------------------------------------
const MOCK_WORD_MAP = {
  the: '',
  a: 'एक',
  an: 'एक',
  is: 'है',
  are: 'हैं',
  and: 'और',
  with: 'के साथ',
  your: 'आपका',
  you: 'आप',
  to: 'को',
  for: 'के लिए',
  app: 'ऐप',
  apps: 'ऐप्स',
  blog: 'ब्लॉग',
  post: 'पोस्ट',
  posts: 'पोस्ट्स',
  page: 'पेज',
  pages: 'पेज्स',
  build: 'बिल्ड',
  deploy: 'डिप्लॉय',
  deploying: 'डिप्लॉय करना',
};

function mockTranslate(text) {
  const translatedWords = text.split(/\s+/).map((rawWord) => {
    const stripped = rawWord.replace(/[.,!?;:()]/g, '');
    const lower = stripped.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MOCK_WORD_MAP, lower)) {
      const hindiWord = MOCK_WORD_MAP[lower];
      return hindiWord ? rawWord.replace(stripped, hindiWord) : '';
    }
    return rawWord;
  });
  return `[मॉक अनुवाद] ${translatedWords.filter(Boolean).join(' ')}`;
}

// ---------------------------------------------------------------------------
// 3. Optional live translation via the free LibreTranslate API. No API key
//    required. Disabled by default (USE_LIVE_TRANSLATION=true to enable) so
//    the build stays fast, deterministic, and offline-friendly by default.
// ---------------------------------------------------------------------------
async function liveTranslate(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIVE_TRANSLATION_TIMEOUT_MS);

  try {
    const response = await fetch(LIBRETRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'hi',
        format: 'text',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data.translatedText !== 'string') {
      throw new Error('LibreTranslate response missing translatedText');
    }
    return data.translatedText;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Orchestration: dictionary -> (optional) live API -> mock fallback.
// ---------------------------------------------------------------------------
async function translateField({ text, dictionaryValue, fieldLabel, postTitle }) {
  if (dictionaryValue) {
    return { text: dictionaryValue, source: 'dictionary' };
  }

  if (USE_LIVE_TRANSLATION) {
    try {
      const translated = await liveTranslate(text);
      return { text: translated, source: 'live-api' };
    } catch (err) {
      console.warn(
        `  ⚠ Live translation failed for "${postTitle}" (${fieldLabel}): ${err.message}. Falling back to mock translation.`
      );
    }
  }

  return { text: mockTranslate(text), source: 'mock' };
}

async function translatePost(post) {
  const dictionaryEntry = DICTIONARY[post.title];

  const [translatedTitle, translatedContent] = await Promise.all([
    translateField({
      text: post.title,
      dictionaryValue: dictionaryEntry && dictionaryEntry.title,
      fieldLabel: 'title',
      postTitle: post.title,
    }),
    translateField({
      text: post.content,
      dictionaryValue: dictionaryEntry && dictionaryEntry.content,
      fieldLabel: 'content',
      postTitle: post.title,
    }),
  ]);

  console.log(
    `  ✓ ${post.slug} — title:${translatedTitle.source}, content:${translatedContent.source}`
  );

  return {
    id: post.id,
    slug: post.slug, // same slug is reused under /hi/[slug]
    title: translatedTitle.text,
    content: translatedContent.text,
    date: post.date,
    lang: 'hi',
  };
}

async function main() {
  console.log('🌐 Translating posts to Hindi...');
  console.log(
    `   Live translation: ${USE_LIVE_TRANSLATION ? `ENABLED (${LIBRETRANSLATE_URL})` : 'disabled (set USE_LIVE_TRANSLATION=true to enable)'}`
  );

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`✖ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
  /** @type {Array<{id:number, slug:string, title:string, content:string, date:string, lang?:string}>} */
  const posts = JSON.parse(rawData);

  // Only translate posts that are English (or have no lang field, which we
  // treat as the default/English source language).
  const englishPosts = posts.filter((post) => !post.lang || post.lang === 'en');

  if (englishPosts.length === 0) {
    console.log('No English posts found — nothing to translate.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  const translatedPosts = [];
  for (const post of englishPosts) {
    // Sequential loop (not Promise.all across posts) to stay gentle on the
    // free LibreTranslate rate limits when live translation is enabled.
    // eslint-disable-next-line no-await-in-loop
    const translated = await translatePost(post);
    translatedPosts.push(translated);
  }

  translatedPosts.sort((a, b) => (a.date < b.date ? 1 : -1));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translatedPosts, null, 2) + '\n');
  console.log(`✅ Wrote ${translatedPosts.length} translated post(s) to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error('✖ Translation script failed:', err);
  process.exit(1);
});
