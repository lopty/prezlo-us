import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { census, states, trust, usps } from './src/states.mjs';
import { renderStateMap } from './src/state-map.mjs';
import { guides, industries } from './src/editorial.mjs';
import { industryPlans, statePlans } from './src/lead-plans.mjs';
import { buildStateIndustryPage } from './src/state-industry.mjs';

const origin = process.env.PREZLO_SITE_ORIGIN || 'https://us.prezlo.io';
const brand = 'https://prezlo.io';
const audit = brand + '/audit';
const trial = brand + '/auth?mode=register';
const pricing = brand + '/pricing';
const docsUrl = brand + '/docs';
const output = 'dist';
const buildDate = new Date().toISOString().slice(0, 10);
const arrow = '<svg class="arrow" aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10h12m-5-5 5 5-5 5"/></svg>';
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (label, href, mode = '') => `<a class="button ${mode}" href="${e(href)}">${label}${arrow}</a>`;
const sectionLabel = label => `<p class="label">${label}</p>`;
const logo = '<a class="archio-brand" href="/" aria-label="Prezlo United States home">Prezlo USA</a>';
const navLinks = [['Workflow','/#how'],['Industries','/industries/'],['States','/regions/'],['Guides','/guides/'],['Pricing',pricing]];

function nav(route) {
  return navLinks.map(([name,path]) => {
    const current = path === route ? ' aria-current="page"' : route?.startsWith(path) && path.startsWith('/') ? ' aria-current="location"' : '';
    const href = route === '/' && path === '/#how' ? '#how' : path;
    return `<a href="${href}"${current}>${name}</a>`;
  }).join('');
}
const findGuide = slug => guides.find(guide => guide.slug === slug);
const findState = slug => states.find(state => state.slug === slug);
const findIndustry = slug => industries.find(industry => industry.slug === slug);

const homeIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const starSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const checkSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const crossSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function header(route) {
  return `<a class="skip" href="#main">Skip to content</a><header class="archio-topbar"><div class="archio-topbar-inner">
    ${logo}
    <div class="archio-topbar-right">
      <a class="archio-live-pill" href="${e(audit)}"><span class="archio-pulser" aria-hidden="true"></span><span>AI audits live</span></a>
      <span class="archio-vdivider" aria-hidden="true"></span>
      <a class="archio-top-link" href="/regions/">50 States</a>
      <span class="archio-vdivider" aria-hidden="true"></span>
      <a class="archio-top-link" href="/industries/">11 Industries</a>
      <span class="archio-vdivider" aria-hidden="true"></span>
      <a class="archio-top-link" href="${e(brand)}/auth">Log in</a>
    </div>
    <details class="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation">${nav(route)}<a href="${e(brand)}/auth">Log in</a><a class="archio-btn-primary" href="${e(audit)}">Get AI Audit ${arrow}</a></nav></details>
    </div></header>
    <nav class="archio-float-nav" aria-label="Floating site navigation"><div class="archio-float-shell">
      <a class="archio-float-home" href="/" aria-label="Home">${homeIcon}</a>
      <div class="archio-float-links">${nav(route)}</div>
      <a class="archio-btn-primary archio-btn-nav" href="${e(audit)}">Get AI Audit</a>
    </div></nav>`;
}

const footerButtons = [
  ['Platform', '/#how'],
  ['Industries', '/industries/'],
  ['50 States', '/regions/'],
  ['Field Guides', '/guides/'],
  ['Docs & Devy', docsUrl],
  ['Trust API', trust],
  ['Pricing', pricing]
];

const footer = `<footer class="archio-footer"><div class="archio-footer-inner">
  <a class="archio-footer-mail" href="${e(brand)}">prezlo.io · United States</a>
  <div class="archio-footer-divider" aria-hidden="true"></div>
  <div class="archio-footer-statement">${logo}<p>Help your US business get understood, trusted, and recommended by ChatGPT, Gemini, Perplexity, and Claude.</p></div>
  <nav class="archio-footer-nav" aria-label="Footer navigation">${footerButtons.map(([name, path]) => `<a class="archio-btn-clean" href="${e(path)}">${name}</a>`).join('')}<a class="archio-btn-primary" href="${e(audit)}">Get Started ${arrow}</a></nav>
  <div class="archio-footer-legal"><span>© Prezlo United States</span><span>${states.length} US States · ${industries.length} Industries · ${states.length * industries.length} Local Playbooks</span></div>
  <div class="archio-footer-wordmark" aria-hidden="true">Prezlo</div>
</div></footer>`;

function cta(heading = 'See how AI describes your business.') {
  return `<section class="block compact"><div class="wrap cta"><div><h2>${heading}</h2><p>Start with a real offer, a target market and the questions your buyers ask across ChatGPT, Gemini, and Perplexity.</p></div><div class="buttons">${btn('Get an AI audit',audit)}${btn('Start a trial',trial,'outline')}</div></div></section>`;
}

const scenarios = [
  ['Service business', 'Who repairs rooftop AC in Austin?', '/regions/texas/service-businesses/','Commercial HVAC service page','Confirm which rooftop units and Austin ZIPs the crew services.'],
  ['Local business', 'Which location near Worcester runs an evening hybrid program?', '/regions/massachusetts/education/','Campus program listing','Put evening cohort dates and campus intake on the Worcester page.'],
  ['Financial advisory', 'Which financial adviser near Dallas works with business owners planning a sale?', '/regions/texas/financial-services/','Texas advisory firm record','Publish pre-sale advisory scope, IAPD link, and consultation format.']
];

function exampleConsole() {
  return `<div class="console-frame"><div class="console">
    <div class="console-head"><span><i class="status-dot"></i> Sample audit</span><span class="mono">Buyer search</span></div>
    <div class="example-tabs" data-example-tabs>${scenarios.map(([tab],i) => `<button type="button" data-example="${i}" aria-label="${tab}">${['Services','Local','Finance'][i]}</button>`).join('')}</div>
    ${scenarios.map(([tab,query,route,source,finding],i) => `<div class="example" data-panel="${i}"${i ? ' hidden' : ''}><p>“${query}”</p><div class="example-meta"><div><strong>${source}</strong><small>${finding}</small></div><a href="${route}" aria-label="Read the ${tab.toLowerCase()} example">${arrow}</a></div></div>`).join('')}
  </div></div>`;
}

function stateLink(state) {
  return `<a class="state-link" href="${state.route}" data-state="${state.name.toLowerCase()} ${state.code.toLowerCase()}"><span class="state-code">${state.code}</span><strong>${state.name}</strong>${arrow}</a>`;
}

function guideLink(guide) {
  const tone = guide.category.toLowerCase().replaceAll(' ', '-');
  return `<a class="guide-card guide-tone-${e(tone)}" href="${guide.route}" data-guide-category="${e(guide.category)}">${sectionLabel(guide.category)}<h3>${guide.name}</h3><p>${guide.description}</p><span class="card-arrow">${arrow}</span></a>`;
}

const industryIcons = {
  'service-businesses':'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/>',
  'local-businesses':'<path d="M3 10h18M5 10v9h14v-9M4 10l1.5-5h13L20 10"/><path d="M10 19v-5h4v5"/>',
  'legal':'<path d="M12 3v17m-7-4h14M6 7l6-3 6 3M4 13l2-6 2 6a2 2 0 0 1-4 0Zm12 0 2-6 2 6a2 2 0 0 1-4 0Z"/>',
  'accounting':'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2"/>',
  'financial-services':'<path d="M3 20h18M6 16v-4m6 4V8m6 8V5"/><path d="m5 10 7-5 7 3"/>',
  'real-estate':'<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z"/>',
  'healthcare':'<path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="4"/>',
  'education':'<path d="m2 9 10-4 10 4-10 4-10-4Z"/><path d="M6 11.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  'travel':'<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  'logistics':'<path d="M1 4h13v11H1zM14 8h4l4 4v3h-8z"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  'marketing-agencies':'<path d="m3 11 12-5v12L3 13v-2Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path d="M6 14v4a1 1 0 0 0 1 1h2"/>'
};

function industryIcon(slug) {
  const d = industryIcons[slug] || industryIcons['service-businesses'];
  return `<span class="medallion"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg></span>`;
}

const workflow = [
  {id:'audit',name:'Measure AI Recommendation',title:'See who appears in AI answers',copy:'Track buyer prompts across ChatGPT, Gemini, Perplexity, and Claude, and inspect every cited URL.',link:'Explore Measure AI Recommendation',path:brand+'/features/track-and-measure'},
  {id:'evidence',name:'Entity Positioning',title:'Build verified entity records',copy:'Align business scope, locations, and credentials into canonical records AI systems trust and cite.',link:'Explore Entity Positioning',path:brand+'/features/get-found-and-verified'},
  {id:'coverage',name:'Local coverage',title:'Map all 50 states and 11 industries',copy:'Publish distinct local proof across metros, counties, and verticals without thin duplicate pages.',link:'Browse 550 state-industry pages',path:'/regions/'},
  {id:'testing',name:'Recommendation Diagnostics',title:'Diagnose gaps and compare rivals',copy:'See why competitors get recommended first and turn citation gaps into reviewable website fixes.',link:'Explore Recommendation Diagnostics',path:brand+'/features/diagnose-and-fix'},
  {id:'intake',name:'Authority Building',title:'Publish answers and earn citations',copy:'Ship evidence-backed guides, outreach citations, and structured metadata across your CMS.',link:'Explore Authority Building',path:brand+'/features/connect-and-transact'},
  {id:'leads',name:'Autonomous Growth & Devy',title:'Automate weekly GEO improvements',copy:'Let Devy draft reviewable updates, sync approved facts via Trust API, and measure qualified leads.',link:'Explore Devy and Docs',path:docsUrl}
];

const workflowIcons = {
  audit:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
  evidence:'<path d="M8 3h6l4 4v14H6V3Zm5 0v5h5M9 12h6m-6 4h6"/>',
  coverage:'<path d="M19 10c0 5-7 10-7 10s-7-5-7-10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  testing:'<path d="M4 8h14m-4-4 4 4-4 4m6 4H6m4-4-4 4 4 4"/>',
  intake:'<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 10h8"/>',
  leads:'<path d="M4 20h16M7 16v-4m5 4V8m5 8V4"/>'
};

function workflowIcon(id) {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${workflowIcons[id]}</svg>`;
}

const homeFaqs = [
  ['What does Prezlo help US businesses achieve in AI search?', 'Prezlo helps businesses get understood, trusted, and recommended by AI assistants including ChatGPT, Gemini, Perplexity, Claude, and Grok. It measures real prompt answers, benchmarks competitors, structures verified entity profiles, diagnoses citation gaps, builds authority, and automates reviewable website updates through Devy and connected CMS workflows.'],
  ['What should I bring to an AI visibility audit?', 'Start with your website, one high-margin offer you can fulfill, a target state or metro market, and the real questions prospective buyers ask before calling or booking.'],
  ['Why does Prezlo build dedicated pages for each state and industry?', 'A financial advisory buyer in Dallas needs SEC IAPD disclosures and succession planning clarity, while a commercial HVAC buyer in Phoenix needs dispatch ZIPs and rooftop equipment scope. Dedicated state-industry playbooks eliminate vague doorway copy and give buyers and AI systems exact local proof.'],
  ['How do I know whether AI search brought me a qualified lead?', 'Track observed recommendations, attributable visits, CTA clicks, received inquiries, and sales-confirmed fit as separate stages. Your receiving team confirms location, scope, and timing in your CRM or booking tool.']
];

function home() {
  const serviceCards = [
    {
      title: 'Measure AI Recommendation',
      copy: 'Track real buyer prompts across ChatGPT, Gemini, and Perplexity to see which firms get cited first.',
      href: brand + '/features/track-and-measure',
      icon: workflowIcon('audit'),
      imgs: [
        ['/assets/service-analytics.jpg', 'AI search visibility dashboard'],
        ['/assets/hero-workspace.jpg', 'Prezlo prompt analytics studio']
      ]
    },
    {
      title: 'Entity Verification',
      copy: 'Structure licensing, service areas, and Schema.org proof so AI assistants trust your business.',
      href: brand + '/features/get-found-and-verified',
      icon: workflowIcon('evidence'),
      imgs: [
        ['/assets/local-businesses.jpg', 'Verified local business records'],
        ['/assets/service-businesses.jpg', 'Field service coverage proof']
      ]
    },
    {
      title: 'Competitor Benchmark',
      copy: 'Compare visibility score, citation authority, and prompt share against rivals in your exact state.',
      href: brand + '/features/compare-and-benchmark',
      icon: workflowIcon('testing'),
      imgs: [
        ['/assets/marketing-agencies.jpg', 'Agency competitor citation review'],
        ['/assets/buyer-search.jpg', 'Buyer comparison workflow']
      ]
    },
    {
      title: 'Autonomous Growth',
      copy: 'Diagnose citation gaps and let Devy publish reviewable fixes across WordPress, Shopify, or GitHub.',
      href: brand + '/features/diagnose-and-fix',
      icon: workflowIcon('leads'),
      imgs: [
        ['/assets/studio-owner.jpg', 'US practice growth review'],
        ['/assets/hero-strategy.jpg', 'Executive strategy planning']
      ]
    }
  ];

  const compareRows = [
    ['Track real buyer prompts across 7 AI engines', false, true],
    ['Benchmark local state & metro competitors automatically', false, true],
    ['Verified Schema.org JSON-LD & Trust API endpoints', false, true],
    ['Dedicated 50-state x 11-industry local coverage proof', false, true],
    ['Reviewable CMS updates shipped through Devy', false, true],
    ['Pipeline attribution from AI mention to qualified lead', false, true]
  ];

  const featuredCombos = [
    ['/regions/texas/financial-services/', 'Texas · Financial Services', 'Financial advisory in Texas', 'Pre-sale business owner exit planning, SEC IAPD proof, and Dallas & Austin consultation workflows.'],
    ['/regions/california/healthcare/', 'California · Healthcare', 'Healthcare clinics in California', 'Multi-site NPI verification, Los Angeles & Bay Area specialist intake, and patient scheduling schema.'],
    ['/regions/new-york/legal/', 'New York · Legal Services', 'Legal practices in New York', 'Borough & Albany jurisdiction clarity, bar verification links, and conflict screening fields.'],
    ['/regions/florida/local-businesses/', 'Florida · Local Businesses', 'Multi-branch local in Florida', 'Miami, Tampa, and Orlando branch hours, parking access, and same-day booking availability.'],
    ['/regions/georgia/logistics/', 'Georgia · Logistics & Freight', 'Freight & warehousing in Georgia', 'Savannah port to Atlanta corridor lanes, dock appointment proof, and USDA/FMC numbers.'],
    ['/regions/illinois/service-businesses/', 'Illinois · Service Businesses', 'Commercial service in Illinois', 'Chicagoland dispatch ZIPs, emergency SLAs, and commercial HVAC & electrical licensing.']
  ];

  const featuredGuides = [
    { ...findGuide('get-recommended-by-chatgpt-and-gemini'), img: '/assets/buyer-search.jpg' },
    { ...findGuide('ai-visibility-audit-checklist'), img: '/assets/studio-owner.jpg' }
  ];

  const marqueeItems = [
    'ChatGPT Search', 'Google Gemini', 'Perplexity AI', 'Anthropic Claude',
    'xAI Grok', 'DeepSeek', 'Meta AI', '50 US States',
    '11 Core Industries', '550 Local Playbooks', 'Trust API & MCP'
  ];

  return `<div class="archio-landing">
    <section class="archio-hero">
      <div class="archio-hero-surface">
        <div class="archio-hero-glow" aria-hidden="true"></div>
        <div class="archio-hero-grid">
          <div class="archio-hero-left">
            <p class="archio-eyebrow"><i class="flag" aria-hidden="true"></i> US AI SEARCH PLATFORM</p>
            <h1>Business growth via AI search</h1>
            <p class="archio-hero-sub">Get understood, verified, and recommended by ChatGPT, Gemini, and Perplexity across all 50 US states.</p>
            <div class="archio-hero-ctas">
              <a class="archio-btn-primary" href="${e(audit)}">Get Started ${arrow}</a>
              <a class="archio-btn-secondary" href="/regions/">50 States ${arrow}</a>
            </div>
            <div class="archio-hero-rule" aria-hidden="true"></div>
            <div class="archio-hero-trust">
              <div class="archio-stars" aria-label="7 AI search engines monitored">${starSvg.repeat(5)}</div>
              <span class="archio-rating-label">Monitored across 7 AI engines · 550 US playbooks</span>
            </div>
          </div>
          <div class="archio-hero-right">
            <div class="archio-hero-photos">
              <div class="archio-hero-card-img"><img src="/assets/hero-strategy.jpg" width="800" height="1200" alt="US business leaders reviewing AI search growth metrics" fetchpriority="high"></div>
              <div class="archio-hero-card-img"><img src="/assets/hero-workspace.jpg" width="800" height="1200" alt="Prezlo analytics workspace in minimalist architectural studio" fetchpriority="high"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-sand" id="how">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Our Capabilities</p>
          <h2>Built to earn AI recommendations</h2>
          <p>Explore how Prezlo connects real buyer prompts to verified company proof across every state.</p>
        </header>
        <div class="archio-cards-grid">
          ${serviceCards.map(card => `<a class="archio-frosted-card" href="${e(card.href)}" data-reveal>
            <div class="archio-card-top">
              <span class="archio-icon-box">${card.icon}</span>
              <h3>${card.title}</h3>
              <p>${card.copy}</p>
            </div>
            <div class="archio-card-thumbs">
              ${card.imgs.map(([src, alt]) => `<div class="archio-card-thumb"><img src="${src}" width="640" height="440" alt="${e(alt)}" loading="lazy"></div>`).join('')}
            </div>
          </a>`).join('')}
        </div>
        <div class="archio-summary-box" data-reveal>
          <h3>Plus automated growth and verified publishing across your stack</h3>
          <div class="archio-tag-cloud">
            <a href="${e(brand)}/features/connect-and-transact">Authority Building</a>
            <a href="${e(brand)}/features/grow-and-automate">Autonomous Growth</a>
            <a href="${e(docsUrl)}/use-devy">Devy Agent</a>
            <a href="${e(trust)}">Trust API</a>
            <a href="${e(brand)}/mcp">MCP Integration</a>
            <a href="${e(docsUrl)}/connect-websites">WordPress &amp; Shopify</a>
            <a href="/industries/">11 US Industries</a>
            <a href="/regions/">50 US States</a>
          </div>
          <div class="archio-hero-ctas">
            <a class="archio-btn-primary" href="${e(docsUrl)}">Explore Prezlo Docs ${arrow}</a>
            <a class="archio-btn-clean" href="/industries/">All 11 Industries</a>
          </div>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-white">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Why Prezlo</p>
          <h2>Built on verified prompt evidence, not SEO guesswork</h2>
          <p>Stop guessing why AI assistants recommend competitors. Inspect cited pages, verify entity facts, and ship fixes buyers can trust.</p>
        </header>
        <div class="archio-why-grid">
          <div class="archio-why-item" data-reveal>
            <span class="archio-icon-box">${workflowIcon('audit')}</span>
            <h4>Real Prompt Monitoring</h4>
            <p>Measure how ChatGPT, Gemini, Perplexity, and Claude answer high-intent buyer questions in your target cities and counties.</p>
          </div>
          <div class="archio-why-item" data-reveal>
            <span class="archio-icon-box">${workflowIcon('evidence')}</span>
            <h4>Canonical Entity Proof</h4>
            <p>Connect licensing, service ZIPs, pricing format, and Schema.org structured data so AI engines cite your business directly.</p>
          </div>
          <div class="archio-why-item" data-reveal>
            <span class="archio-icon-box">${workflowIcon('leads')}</span>
            <h4>Sales-Confirmed Pipeline</h4>
            <p>Separate observed AI citations from received inquiries and qualified bookings so leadership sees real revenue impact.</p>
          </div>
        </div>
        <div class="archio-marquee-wrap" aria-label="Supported AI models and US coverage">
          <div class="archio-marquee-track">
            ${[...marqueeItems, ...marqueeItems].map(item => `<span class="archio-marquee-item"><i class="archio-marquee-dot" aria-hidden="true"></i>${item}</span>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-sand">
      <div class="archio-wrap">
        <div class="archio-process-split">
          <div class="archio-sticky-copy" data-reveal="left">
            <p class="archio-eyebrow">Proven Workflow</p>
            <h2>A structured process for winning local AI search</h2>
            <p>Our step-by-step system replaces vague content checklists with verifiable prompt measurement, structured entity proof, and qualified intake.</p>
            <div class="archio-hero-ctas">
              <a class="archio-btn-primary" href="${e(audit)}">Get AI Audit ${arrow}</a>
              <a class="archio-btn-secondary" href="${e(trial)}">Start Free Trial</a>
            </div>
            <div class="archio-hero-trust">
              <div class="archio-stars" aria-hidden="true">${starSvg.repeat(5)}</div>
              <span style="font-size:14px;color:var(--archio-muted);">Designed for multi-state &amp; local US teams</span>
            </div>
          </div>
          <div class="archio-step-stack">
            <article class="archio-step-card" data-reveal>
              <div class="archio-step-num">1</div>
              <div>
                <h4>Measure current AI answers and rivals</h4>
                <p>Run real buyer questions naming your services and cities. Capture full AI responses, cited URLs, and which competitors win top placement.</p>
              </div>
            </article>
            <article class="archio-step-card" data-reveal>
              <div class="archio-step-num">2</div>
              <div>
                <h4>Publish verified entity and local coverage pages</h4>
                <p>Replace generic thin pages with state and industry playbooks detailing exact metro coverage, credentials, Schema.org markup, and qualification rules.</p>
              </div>
            </article>
            <article class="archio-step-card" data-reveal>
              <div class="archio-step-num">3</div>
              <div>
                <h4>Automate updates with Devy and measure leads</h4>
                <p>Approve structured pull requests directly to your CMS or repository, keep Trust API current, and track attributable referrals through closed pipeline.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-white">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Platform Comparison</p>
          <h2>Why dedicated AI visibility infrastructure beats manual checking</h2>
          <p>Manually typing a single prompt once gives an incomplete snapshot. Prezlo operationalizes measurement, schema integrity, and continuous fixes.</p>
        </header>
        <div class="archio-compare-frame" data-reveal>
          <div class="archio-compare-row archio-compare-head">
            <div class="archio-compare-cell">Capability</div>
            <div class="archio-compare-cell">Manual Prompt Checks</div>
            <div class="archio-compare-cell">Prezlo Platform</div>
          </div>
          ${compareRows.map(([label, manual, prezlo]) => `<div class="archio-compare-row">
            <div class="archio-compare-cell">${label}</div>
            <div class="archio-compare-cell"><span class="${manual ? 'archio-badge-yes' : 'archio-badge-no'}" aria-label="${manual ? 'Included' : 'Not included'}">${manual ? checkSvg : crossSvg}</span></div>
            <div class="archio-compare-cell"><span class="${prezlo ? 'archio-badge-yes' : 'archio-badge-no'}" aria-label="Included in Prezlo">${checkSvg}</span></div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-sand">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">US States &amp; Verticals</p>
          <h2>550 contextual playbooks across all 50 states</h2>
          <p>Explore high-intent state and industry blueprints covering local buyer prompts, public verification standards, and lead handoff.</p>
        </header>
        <div class="archio-showcase-grid">
          ${['service-businesses', 'local-businesses', 'marketing-agencies'].map(slug => {
            const item = findIndustry(slug);
            return `<a class="archio-market-card" href="${item.route}" data-reveal>
              <div class="archio-market-img"><img src="/assets/${slug}.jpg" width="724" height="565" alt="${e(item.name)}" loading="lazy"></div>
              <div class="archio-market-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="archio-card-link">Explore 50 states ${arrow}</span>
              </div>
            </a>`;
          }).join('')}
        </div>
        <div class="archio-state-strip">
          ${featuredCombos.map(([href, tag, title, desc]) => `<a class="archio-playbook-pill" href="${href}" data-reveal>
            <span class="archio-meta-tag">${tag}</span>
            <strong>${title}</strong>
            <small>${desc}</small>
          </a>`).join('')}
        </div>
        <div class="archio-hero-ctas" style="justify-content:center;margin-top:36px;">
          <a class="archio-btn-primary" href="/regions/">Browse All 50 States ${arrow}</a>
          <a class="archio-btn-clean" href="/industries/">Browse All 11 Industries</a>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-white">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Field Guides</p>
          <h2>Insights that grow verified AI citations</h2>
          <p>Practical US playbooks on earning recommendations in ChatGPT and Gemini, structuring local evidence, and measuring qualified pipeline.</p>
        </header>
        <div class="archio-blog-grid">
          ${featuredGuides.map(g => `<a class="archio-blog-card" href="${g.route}" data-reveal>
            <div class="archio-blog-inner">
              <div class="archio-blog-thumb"><img src="${g.img}" width="1200" height="750" alt="${e(g.name)}" loading="lazy"></div>
              <div class="archio-blog-rule" aria-hidden="true"></div>
              <div class="archio-blog-copy">
                <span class="archio-blog-cat">${e(g.category)}</span>
                <h3>${e(g.name)}</h3>
                <p>${e(g.description)}</p>
                <div class="archio-blog-footer">
                  <span>Read field guide</span>
                  <span class="archio-round-arrow" aria-hidden="true">${arrow}</span>
                </div>
              </div>
            </div>
          </a>`).join('')}
        </div>
        <div class="archio-hero-ctas" style="justify-content:center;margin-top:36px;">
          <a class="archio-btn-secondary" href="/guides/">View All 18 Field Guides ${arrow}</a>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-sand">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Questions &amp; Answers</p>
          <h2>Your questions, answered clearly</h2>
          <p>Common questions from US business leaders, marketing directors, and agency teams evaluating Prezlo for AI search growth.</p>
        </header>
        <div class="archio-faq-grid">
          <aside class="archio-faq-portrait" data-reveal>
            <img src="/assets/faq-portrait.jpg" width="900" height="1200" alt="Executive overlooking US skyline at twilight" loading="lazy">
            <div class="archio-faq-quote">
              <blockquote>“Our goal is to turn opaque AI recommendations into verifiable local proof and qualified customer conversations.”</blockquote>
              <span>Prezlo United States · AI Recommendation Operations</span>
            </div>
          </aside>
          <div class="archio-faq-list" data-reveal>
            ${homeFaqs.map(([q, a], idx) => `<details class="archio-faq-item"${idx === 0 ? ' open' : ''}><summary><span>${e(q)}</span><span class="archio-faq-plus" aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="archio-section archio-section-white">
      <div class="archio-wrap">
        <header class="archio-section-head" data-reveal>
          <p class="archio-eyebrow">Start With Confidence</p>
          <h2>Built for high-trust US categories</h2>
          <p>Launch your first state and industry playbook in minutes or connect your full website stack for automated GEO execution.</p>
        </header>
        <div class="archio-practices-grid">
          <article class="archio-practice-card" data-reveal>
            <div class="archio-practice-photo"><img src="/assets/studio-owner.jpg" width="724" height="565" alt="Service and advisory firm leader" loading="lazy"></div>
            <div class="archio-practice-meta">
              <strong>Financial &amp; Advisory Firms</strong>
              <span>SEC IAPD, fiduciary positioning &amp; exit planning</span>
              <a href="/industries/financial-services/">Open Financial Playbook ${arrow}</a>
            </div>
          </article>
          <article class="archio-practice-card" data-reveal>
            <div class="archio-practice-photo"><img src="/assets/service-businesses.jpg" width="724" height="565" alt="Commercial field and home service team" loading="lazy"></div>
            <div class="archio-practice-meta">
              <strong>Commercial &amp; Field Services</strong>
              <span>Dispatch ZIPs, emergency SLAs &amp; contractor proof</span>
              <a href="/industries/service-businesses/">Open Services Playbook ${arrow}</a>
            </div>
          </article>
          <article class="archio-practice-card" data-reveal>
            <div class="archio-practice-photo"><img src="/assets/local-businesses.jpg" width="724" height="565" alt="Multi-location retail and neighborhood clinic" loading="lazy"></div>
            <div class="archio-practice-meta">
              <strong>Multi-Location Local &amp; Health</strong>
              <span>Branch hours, NPI records &amp; same-day booking</span>
              <a href="/industries/local-businesses/">Open Local Playbook ${arrow}</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>`;
}

function industryLink(i) {
  return `<a class="tile editorial-card tone-${i.tone}" href="${i.route}"><div class="industry-tile-head">${industryPhotos[i.slug] ? editorialPhoto(industryPhotos[i.slug]) : `<div class="tile-icon-row">${industryIcon(i.slug)}<span class="label">${e(i.displayTag)}</span></div>`}<h3>${i.name}</h3><p>${i.description}</p></div><div class="industry-preview"><span class="mono">Buyer question</span><p>“${i.question}”</p></div><span class="tile-action">Explore ${i.name.toLowerCase()} across 50 states ${arrow}</span></a>`;
}

const directories = {
  '/regions/': {name:'States',title:'AI Search & Lead Generation by US State',description:'Explore all 50 US states and 550 state-industry AI visibility playbooks with local buyer prompts, coverage evidence, and lead qualification guides.', intro:'Explore all 50 US state hubs. Every state opens 11 industry-specific AI search playbooks covering local buyer prompts, public verification, and lead handoff.', label:'United States · 50 states · 550 playbooks', kind:'states'},
  '/industries/': {name:'Industries',title:'AI Search & Lead Generation by Industry',description:'AI visibility, verified entity positioning, and lead generation across 11 US industries and all 50 states with Prezlo.', intro:'A freight quote, a fiduciary advisory call, and a clinic booking require different proof. Pick your industry to explore workflow blueprints and all 50 state markets.', label:'Solutions · 11 industries', kind:'industries'},
  '/guides/': {name:'Guides',title:'Field Guides for AI Search, GEO & Lead Generation',description:'18 practical guides on getting recommended by ChatGPT and Gemini, entity positioning, Schema.org, llms.txt, Trust API, and measuring AI leads.', intro:'Use these playbooks to measure AI answers, structure verified entities, connect Devy and your CMS, and track qualified referrals.', label:'Resources · 18 playbooks', kind:'guides'}
};

const industryPhotos = {
  'service-businesses':'service-businesses',
  'local-businesses':'local-businesses',
  'marketing-agencies':'marketing-agencies'
};

function editorialPhoto(name) {
  return `<img src="/assets/${name}.jpg" alt="" loading="lazy">`;
}

function directoryHero(page) {
  const photo = {states:'buyer-search',industries:'marketing-agencies',guides:'studio-owner'}[page.kind];
  return `<section class="directory-hero ${page.kind}"><div class="wrap editorial-hero">
    <div>${sectionLabel(page.label)}<h1>${page.title}</h1><p>${page.intro}</p></div>
    <div class="editorial-photo ${page.kind}-photo">${editorialPhoto(photo)}</div>
  </div></section>`;
}

function directory(route) {
  const page = directories[route];
  if (page.kind === 'states') return stateDirectory(page);
  let content;
  if (page.kind === 'industries') {
    content = `<div class="tile-grid">${industries.map(industryLink).join('')}</div>`;
  } else {
    const categories = ['All', ...new Set(guides.map(g => g.category))];
    content = `<div class="filter-bar" data-guide-filter>
      <div class="example-tabs ready" role="tablist" aria-label="Filter guides by category">${categories.map((cat, idx) => `<button type="button" data-category="${e(cat)}" aria-selected="${idx === 0 ? 'true' : 'false'}">${e(cat)}</button>`).join('')}</div>
      <p class="filter-count" data-guide-count>${guides.length} playbooks</p>
    </div>
    <div class="guide-grid" data-guide-list>${guides.map(guideLink).join('')}</div>`;
  }
  return `${directoryHero(page)}<section class="block"><div class="wrap">${content}</div></section>${cta()}`;
}

function stateDirectory(page) {
  const areas = ['Northeast','Midwest','South','West'];
  return `<section class="state-directory"><div class="wrap">
    <header class="atlas-heading">${sectionLabel(page.label)}<h1>${page.title}</h1><p>${page.intro}</p></header>
    <div class="atlas-grid">
      <div class="atlas-panel">
        <div class="atlas-legend">${areas.map(area => `<span class="${area.toLowerCase()}">${area}</span>`).join('')}</div>
        ${renderStateMap(states)}
        <small class="atlas-credit">Boundaries from <a href="https://github.com/topojson/us-atlas">U.S. Atlas</a>, based on U.S. Census Bureau data.</small>
      </div>
      <div class="atlas-index">
        <h2>Find a state</h2>
        <div class="atlas-search" hidden data-search><label class="sr-only" for="state-search">Search states</label><input type="search" id="state-search" placeholder="Name or abbreviation" autocomplete="off"><p aria-live="polite" data-count>50 states</p></div>
        <div class="atlas-results">${areas.map(area => `<section class="atlas-region" data-state-group><h3>${area}</h3><div>${states.filter(state => state.area === area).map(state => `<a href="${state.route}" data-state="${state.name.toLowerCase()}" data-state-code="${state.code}"><span>${state.name}</span><small>${state.code}</small>${arrow}</a>`).join('')}</div></section>`).join('')}</div>
      </div>
    </div>
  </div></section>${cta()}`;
}

function faqSection(items, heading = 'Frequently asked questions') {
  return `<section class="block landing-faq"><div class="wrap lead-faq faq"><h2>${heading}</h2>
    ${items.map(([question,answer]) => `<details><summary>${e(question)}</summary><p>${e(answer)}</p></details>`).join('')}
  </div></section>`;
}

function leadApproach(heading, steps) {
  return `<section class="block lead-approach"><div class="wrap"><header class="section-head"><h2>${heading}</h2></header>
    <div class="evidence-grid steps">${steps.map(([title,copy]) => `<div><h3>${title}</h3><p>${copy}</p></div>`).join('')}</div>
  </div></section>`;
}

function leadNext(heading,copy) {
  return `<section class="block compact"><div class="wrap cta lead-next"><div>${sectionLabel('Next step')}<h2>${heading}</h2><p>${copy}</p></div><div class="buttons">${btn('Get an AI audit',audit)}${btn('Start a trial',trial,'light-outline')}</div></div></section>`;
}

function stateFaqs(s) {
  return [
    [`How can a business in ${s.name} get recommended by ChatGPT and Gemini?`, `Publish clear coverage across ${s.first}, ${s.second}, and ${s.third} by ${s.jurisdictionUnit}, verify your business credentials, and use Prezlo to track local prompts, fix citation gaps, and deploy structured data.`],
    [`What should I test first for ${s.industry} in ${s.name}?`, `Ask: "${s.question}" Save the full answer and check whether the cited page names your ${s.name} coverage and exact next step.`],
    [`What should a ${s.name} landing page explain about ${s.first}, ${s.second}, and ${s.third}?`, statePlans[s.code].evidence],
    [`When should I count a ${s.name} inquiry as qualified?`, statePlans[s.code].lead]
  ];
}

function statePage(s) {
  const plan = statePlans[s.code];
  const nearby = states.filter(candidate => candidate.area === s.area && candidate.code !== s.code)
    .sort((a,b) => Math.abs(states.indexOf(a)-states.indexOf(s)) - Math.abs(states.indexOf(b)-states.indexOf(s))).slice(0,3);
  const industryByService = {'small business legal services':'legal','business legal services':'legal','freight forwarding':'logistics','freight and warehousing':'logistics','commercial freight':'logistics','warehousing':'logistics','business accounting':'accounting','professional education':'education'};
  const primaryIndustry = findIndustry(industryByService[s.industry] || 'service-businesses');
  const faqs = stateFaqs(s);

  return `<section class="detail-hero state-hero ${s.area.toLowerCase()}"><div class="wrap">
    <div class="detail-intro">${sectionLabel(`${s.area} · United States · ${s.code}`)}<h1>AI search and lead generation in ${s.name}</h1><p>Help buyers across ${s.first}, ${s.second}, and ${s.third} verify fit and choose your ${s.name} business in ChatGPT, Gemini, and Perplexity.</p><div class="buttons center-buttons">${btn('Get an AI audit',audit)}${btn(`Browse ${s.name} industries`,'#state-industries','outline')}</div></div>
    <div class="detail-pair">
      <div class="market-panel">
        <p>${s.name} market context</p>
        <h2>${s.first}, ${s.second}, and ${s.third}</h2>
        <p>${s.scenario}</p>
        <p>${s.marketContext}</p>
        <dl class="brief-meta">
          <div><dt>Local unit</dt><dd>${s.jurisdictionUnit}</dd></div>
          <div><dt>Playbooks</dt><dd>${industries.length} industries in ${s.name}</dd></div>
          <div><dt>Flagship sector</dt><dd><a href="/regions/${s.slug}/${primaryIndustry.slug}/">${primaryIndustry.name} in ${s.name}</a></dd></div>
        </dl>
      </div>
      <div class="question-card">${sectionLabel(`Buyer question in ${s.name}`)}<blockquote>“${s.question}”</blockquote>
        <dl class="question-facts"><div><dt>Next step</dt><dd>${s.action}</dd></div><div><dt>What to confirm</dt><dd>${s.fields}</dd></div></dl>
      </div>
    </div>
  </div></section>

  <section class="block soft-blush-band" id="state-industries"><div class="wrap">
    <header class="section-head section-row">
      <div>${sectionLabel(`${s.name} industry directory`)}<h2>AI search playbooks for every industry in ${s.name}</h2><p>Open a dedicated ${s.name} industry guide for local buyer prompts across ${s.first}, ${s.second}, and ${s.third}, verification rules, and lead qualification.</p></div>
      <div class="inline-search" data-inline-filter>
        <label class="sr-only" for="state-ind-filter">Filter industries in ${s.name}</label>
        <input type="search" id="state-ind-filter" placeholder="Search ${s.name} industries..." autocomplete="off">
      </div>
    </header>
    <div class="combo-grid" data-filter-grid>
      ${industries.map(ind => `<a class="combo-card editorial-card tone-${ind.tone}" href="/regions/${s.slug}/${ind.slug}/" data-filter-item="${e((ind.name + ' ' + ind.displayTag + ' ' + ind.serviceList.join(' ')).toLowerCase())}">
        <div class="combo-top">${industryIcon(ind.slug)}<span class="label">${e(ind.displayTag)}</span></div>
        <strong>${ind.name} in ${s.name}</strong>
        <span>${e(ind.serviceList[0])} and ${e(ind.serviceList[1])} across ${s.first} and ${s.second}</span>
        <span class="tile-action">Open ${s.name} playbook ${arrow}</span>
      </a>`).join('')}
    </div>
  </div></section>

  ${leadApproach('How Prezlo approaches AI search in '+s.name,[
    ['Measure and benchmark local prompts', `Test buyer questions naming ${s.first}, ${s.second}, and ${s.third} across ChatGPT, Gemini, Perplexity, and Claude. Capture full answers, cited URLs, and rival ${s.name} providers.`],
    ['Verify entities and service evidence',plan.evidence + ' Align business names and credentials with Prezlo Entity Positioning.'],
    ['Convert and qualify local leads',plan.lead + ' Track observed recommendation separately from qualified pipeline.']
  ])}

  <section class="block local-checks"><div class="wrap"><div class="section-head"><h2>What to publish before asking for a ${s.name} lead</h2><p>Give every ${s.name} service page an owner who confirms current ${s.jurisdictionUnit} coverage and availability. Use matching facts across your intake form and public sources.</p><a class="under" href="/guides/service-area-evidence/">Build a service-area evidence record ${arrow}</a></div><div class="steps evidence-grid"><div><h3>Metro and ${s.jurisdictionUnit} coverage</h3><p>${s.decision}</p></div><div><h3>Qualified intake</h3><p>For a ${s.action}, start with ${s.fields}. Ask the team receiving the request to record whether it can accept the inquiry.</p></div><div><h3>Public verification</h3><p>Check public place names in the <a href="${census}">Census Gazetteer Files</a>, confirm mailing boundaries with <a href="${usps}">USPS ZIP Code Lookup</a>, and reference <a href="https://www.usa.gov/state-governments">${s.name} state resources</a>.</p></div></div></div></section>

  <section class="block"><div class="wrap"><header class="section-head section-row"><div><h2>Keep exploring</h2><p>More state hubs from the ${s.area} region.</p></div>${btn('All 50 states','/regions/','outline')}</header><div class="state-list">${nearby.map(stateLink).join('')}</div><div class="detail-links"><a href="${primaryIndustry.route}">${primaryIndustry.name} hub ${arrow}</a><a href="/guides/track-ai-referral-leads/">Lead measurement ${arrow}</a><a href="/guides/get-recommended-by-chatgpt-and-gemini/">Get recommended by ChatGPT and Gemini ${arrow}</a></div></div></section>

  ${faqSection(faqs, `Frequently asked questions about AI search in ${s.name}`)}
  ${leadNext(`Start with one ${s.name} market`,`Bring the page that describes your offer, one buyer question from ${s.first} or ${s.second}, and the team criteria for accepting a ${s.action}.`)}`;
}

function industryFaqs(i) {
  const plan = industryPlans[i.slug];
  return [
    [`Which buyer question should ${i.name.toLowerCase()} teams test first?`, plan.prompt],
    [`How does Prezlo help ${i.name.toLowerCase()} get recommended by ChatGPT and Gemini?`, `Prezlo measures real buyer prompts across major AI assistants, compares your citations against ${i.name.toLowerCase()} competitors, structures ${i.schemaType} entity records, and prepares reviewable website updates via Devy.`],
    ['What public evidence do buyers and AI assistants verify before contacting us?', `${i.credentialSignals}. ${i.checks[0]}.`],
    ['What does a qualified inquiry look like?', plan.lead]
  ];
}

function industryPage(i) {
  const plan = industryPlans[i.slug];
  const guide = findGuide(i.guide);
  const photo = industryPhotos[i.slug];
  const faqs = industryFaqs(i);
  const areas = ['Northeast','Midwest','South','West'];
  const industryVisual = photo
    ? `<div class="editorial-photo">${editorialPhoto(photo)}</div>`
    : `<div class="market-panel"><p>Example buyer decision</p><h2>${i.angle}</h2><p>${i.example}</p><dl class="brief-meta"><div><dt>Schema type</dt><dd class="mono-inline">${e(i.schemaType)}</dd></div><div><dt>Key buyers</dt><dd>${e(i.buyerRoles)}</dd></div><div><dt>Intake fields</dt><dd>${e(i.intakeFields)}</dd></div></dl></div>`;
  return `<section class="detail-hero industry-hero"><div class="wrap">
    <div class="detail-intro">${sectionLabel(`Industry playbook · ${i.displayTag}`)}<h1>AI search and lead generation for ${i.name.toLowerCase()}</h1><p>${i.description} Explore the workflow and open localized playbooks for all 50 US states.</p><div class="buttons center-buttons">${btn('Get an AI audit',audit)}${btn('Browse all 50 states','#industry-states','outline')}</div></div>
    <div class="detail-pair">${industryVisual}<div class="question-card">${sectionLabel('High-intent buyer question')}<blockquote>“${plan.prompt}”</blockquote><dl class="question-facts"><div><dt>Core services</dt><dd>${e(i.serviceList.slice(0,2).join(', '))}</dd></div><div><dt>Target action</dt><dd>${e(i.actionVerb)}</dd></div></dl></div></div>
  </div></section>

  <section class="block local-checks"><div class="wrap"><div class="section-head">${sectionLabel('Diagnostic checklist')}<h2>Help AI and buyers verify fit early</h2><p>${i.aiFailureMode}</p></div><ol class="steps evidence-grid industry-checks">${i.checks.map(check => `<li><strong>${check}.</strong></li>`).join('')}</ol></div></section>

  ${leadApproach('How Prezlo approaches '+i.name.toLowerCase(),[
    ['Run matched buyer prompt tests',plan.approach],
    ['Verify entity and public credentials',`Publish ${i.schemaType} structured data and verify ${i.credentialSignals}. Record the exact claim, cited URL, and approval owner.`],
    ['Qualify and measure inquiries',plan.lead]
  ])}

  <section class="block" id="industry-states"><div class="wrap">
    <header class="section-head section-row">
      <div>${sectionLabel('50-state playbooks')}<h2>${i.name} AI search by US state</h2><p>Every state carries unique metro prompt examples, local jurisdiction rules, and intake flows tailored for ${i.name.toLowerCase()}.</p></div>
      <div class="inline-search" data-inline-filter>
        <label class="sr-only" for="ind-state-filter">Filter states for ${i.name}</label>
        <input type="search" id="ind-state-filter" placeholder="Search state or metro..." autocomplete="off">
      </div>
    </header>
    <div class="region-groups">
      ${areas.map(area => `<div class="region-group" data-filter-group>
        <h3>${area}</h3>
        <div class="state-combo-list" data-filter-grid>
          ${states.filter(s => s.area === area).map(s => `<a class="state-link" href="/regions/${s.slug}/${i.slug}/" data-filter-item="${e((s.name + ' ' + s.code + ' ' + s.first + ' ' + s.second + ' ' + s.third).toLowerCase())}"><span class="state-code">${s.code}</span><span><strong>${s.name}</strong><small>${s.first}, ${s.second}</small></span>${arrow}</a>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div></section>

  <section class="block qualification-band"><div class="wrap split"><div><h2>What counts as a qualified inquiry?</h2><p>${i.qualification}</p><p>Capture <strong>${i.intakeFields}</strong> upfront, and record CTA click, received inquiry, and accepted ${i.actionVerb} separately.</p><a class="under" href="/guides/track-ai-referral-leads/">Read the measurement guide ${arrow}</a></div>${guideLink(guide)}</div></section>
  ${faqSection(faqs, `Frequently asked questions for ${i.name.toLowerCase()}`)}
  ${leadNext('Start your AI visibility audit',plan.next)}`;
}

function articlePage(g) {
  const related = findGuide(g.related);
  const sources = g.slug === 'service-area-evidence'
    ? [['US Census Gazetteer Files',census],['USPS ZIP Code Lookup',usps],['Prezlo Documentation',docsUrl]]
    : [['Prezlo Growth Platform',brand],['Prezlo Documentation',docsUrl],['Prezlo Trust API',trust],['Prezlo Pricing',pricing]];
  const featuredStates = ['texas', 'california', 'new-york', 'florida'].map(slug => findState(slug));
  return `<article><header class="directory-hero article-hero"><div class="wrap">${sectionLabel(g.category + ' guide')}<h1>${g.name}</h1><p>${g.description}</p><p class="byline">Published by Prezlo · Updated ${buildDate}</p></div></header>
    <div class="wrap article-grid block"><div class="prose">
      <div class="takeaways-box">${sectionLabel('Key takeaways')}<ul>${g.sections.map(([title]) => `<li>${e(title)}</li>`).join('')}</ul></div>
      ${g.sections.map(([title,copy],i) => `<section id="part-${i+1}"><h2>${title}</h2><p>${copy}</p></section>`).join('')}
      <section class="next-step" id="practice">${sectionLabel('Put it into practice')}<h2>${g.action}</h2><p>${g.actionCopy}</p></section>
      <section class="source-links"><h2>References and Prezlo docs</h2><ul>${sources.map(([text,href]) => `<li><a href="${href}">${text}</a></li>`).join('')}</ul></section>
      <section class="source-links"><h2>Apply this playbook by state</h2><div class="detail-links">${featuredStates.map(s => `<a href="${s.route}">${s.name} ${arrow}</a>`).join('')}<a href="/industries/">All 11 industries ${arrow}</a></div></section>
    </div>
    <aside aria-label="Article navigation"><div><h2>In this guide</h2>${g.sections.map(([title],i) => `<a href="#part-${i+1}">${title}</a>`).join('')}<a href="#practice">${g.action}</a></div>${guideLink(related)}</aside></div>
  </article>${cta()}`;
}

const homepage = {
  route:'/',
  name:'United States',
  title:'AI Search & Lead Generation for US Businesses',
  description:'Get your US business recommended by ChatGPT, Gemini, and Perplexity. Explore 50 state hubs, 550 state-industry playbooks, and verified lead tracking with Prezlo.',
  kind:'homepage',
  faqs: homeFaqs,
  body:home()
};

const statePages = states.map(s => ({
  ...s,
  title:`AI Search & Lead Generation in ${s.name}`,
  description:`Get recommended by AI search in ${s.name} across ${s.first}, ${s.second}, and ${s.third}. Explore 11 ${s.name} industry playbooks, verification rules, and lead tracking.`,
  kind:'state',
  parent:'/regions/',
  faqs: stateFaqs(s),
  areaServed: s.name,
  body:statePage(s)
}));

const industryPages = industries.map(i => ({
  ...i,
  title:`AI Search & Lead Generation for ${i.name}`,
  description:`${i.description} Browse ${i.name.toLowerCase()} AI visibility playbooks across all 50 US states, ${i.schemaType} schema tips, and qualified lead intake.`,
  kind:'industry',
  parent:'/industries/',
  faqs: industryFaqs(i),
  body:industryPage(i)
}));

const stateIndustryPages = states.flatMap(s =>
  industries.map(i => buildStateIndustryPage(s, i, states, industries, findGuide))
);

const pages = [
  homepage,
  ...Object.entries(directories).map(([route,p]) => ({...p,route,kind: p.kind === 'states' ? 'directory-states' : p.kind === 'industries' ? 'directory-industries' : 'directory-guides',body:directory(route)})),
  ...statePages,
  ...industryPages,
  ...stateIndustryPages,
  ...guides.map(g => ({...g,title:g.name,kind:'article',parent:'/guides/',body:articlePage(g)}))
];

const notFound = {name:'Page not found',title:'Page not found',description:'Find a state, industry or guide from Prezlo USA.',body:`<section class="directory-hero"><div class="wrap"><h1>Page not found</h1><p>Explore the 50 state hubs, 550 state-industry playbooks, or return to the US homepage.</p><div class="buttons">${btn('Back to homepage','/')}${btn('Find a state','/regions/','outline')}</div></div></section>`};

function crumbs(p) {
  const items = [{name:'United States',route:'/'}];
  if (p.parent) {
    const parent = directories[p.parent] || pages.find(page => page.route === p.parent);
    if (parent.parent) items.push({name:directories[parent.parent].name,route:parent.parent});
    items.push({name:parent.name,route:p.parent});
  }
  items.push({name:p.name,route:p.route});
  return items;
}

function schema(p) {
  const graph = [
    {
      '@type':'Organization',
      '@id':brand+'/#organization',
      name:'Prezlo',
      url:brand,
      description:'Prezlo is trust infrastructure and an AI recommendation operations platform that helps businesses get understood, trusted, and recommended by ChatGPT, Gemini, Perplexity, Claude, and Grok.'
    },
    {
      '@type':'SoftwareApplication',
      '@id':brand+'/#software',
      name:'Prezlo',
      applicationCategory:'BusinessApplication',
      operatingSystem:'Web',
      url:brand,
      featureList:['Measure AI Recommendation','Competitors Benchmark','Entity Positioning','Recommendation Diagnostics','Authority Building','Autonomous Growth Agent'],
      publisher:{'@id':brand+'/#organization'}
    },
    {
      '@type':'WebSite',
      '@id':origin+'/#website',
      name:'Prezlo United States',
      url:origin+'/',
      inLanguage:'en-US',
      publisher:{'@id':brand+'/#organization'}
    },
    {
      '@type':'WebPage',
      '@id':origin+p.route+'#webpage',
      name:p.title,
      description:p.description,
      url:origin+p.route,
      dateModified:buildDate,
      inLanguage:'en-US',
      isPartOf:{'@id':origin+'/#website'}
    }
  ];

  if (p.route !== '/') {
    graph.push({
      '@type':'BreadcrumbList',
      itemListElement:crumbs(p).map((c,i) => ({'@type':'ListItem',position:i+1,name:c.name,item:origin+c.route}))
    });
  }

  if (p.kind === 'article') {
    graph.push({
      '@type':'Article',
      headline:p.title,
      description:p.description,
      articleSection:p.category,
      datePublished:buildDate,
      dateModified:buildDate,
      mainEntityOfPage:{'@id':origin+p.route+'#webpage'},
      author:{'@id':brand+'/#organization'},
      publisher:{'@id':brand+'/#organization'},
      inLanguage:'en-US'
    });
  }

  if (p.kind === 'state-industry' || p.kind === 'state') {
    graph.push({
      '@type':'Service',
      name:p.title,
      description:p.description,
      serviceType:p.schemaType || 'AI Visibility & Lead Generation',
      provider:{'@id':brand+'/#organization'},
      areaServed:{'@type':'State',name:p.areaServed}
    });
  }

  if (p.kind?.startsWith('directory-')) {
    const listItems = p.kind === 'directory-states' ? states : p.kind === 'directory-industries' ? industries : guides;
    graph.push({
      '@type':'CollectionPage',
      '@id':origin+p.route+'#collection',
      name:p.title,
      description:p.description,
      mainEntity:{
        '@type':'ItemList',
        numberOfItems:listItems.length,
        itemListElement:listItems.map((item, idx) => ({'@type':'ListItem',position:idx+1,name:item.name,url:origin+item.route}))
      }
    });
  }

  if (p.faqs?.length) {
    graph.push({
      '@type':'FAQPage',
      mainEntity:p.faqs.map(([q, a]) => ({
        '@type':'Question',
        name:q,
        acceptedAnswer:{'@type':'Answer',text:a}
      }))
    });
  }

  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
}

function render(p) {
  const fullTitle = p.title + ' | Prezlo USA';
  const socialImage = origin + '/assets/buyer-search.jpg';
  const breadcrumbs = p.route && p.route !== '/' ? `<nav class="wrap breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs(p).map((c,i,items) => i === items.length-1 ? `<li aria-current="page">${e(c.name)}</li>` : `<li><a href="${c.route}">${e(c.name)}</a></li>`).join('')}</ol></nav>` : '';
  return `<!doctype html>
<html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title><meta name="description" content="${e(p.description)}">
${p.route ? `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><link rel="canonical" href="${e(origin+p.route)}"><meta property="og:site_name" content="Prezlo United States"><meta property="og:locale" content="en_US"><meta property="og:url" content="${e(origin+p.route)}"><meta property="og:title" content="${e(fullTitle)}"><meta property="og:description" content="${e(p.description)}"><meta property="og:type" content="${p.kind === 'article' ? 'article':'website'}"><meta property="og:image" content="${e(socialImage)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(fullTitle)}"><meta name="twitter:description" content="${e(p.description)}"><meta name="twitter:image" content="${e(socialImage)}"><script type="application/ld+json">${schema(p)}</script>` : '<meta name="robots" content="noindex">'}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://api.fontshare.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;600;700&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&family=Satisfy&display=swap"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script>
</head><body>${header(p.route)}${breadcrumbs}<main id="main"${p.route === '/' ? '' : ' class="inner-page"'}>${p.body}</main>${footer}</body></html>`;
}

function buildLlmsTxt() {
  const lines = [
    '# Prezlo United States (us.prezlo.io)',
    '',
    '> Prezlo helps US businesses across all 50 states and 11 core industries get understood, trusted, and recommended by ChatGPT, Gemini, Perplexity, Claude, and Grok, and convert AI referrals into qualified leads.',
    '',
    '## Core Platform Capabilities (prezlo.io)',
    `- Measure AI Recommendation: ${brand}/features/track-and-measure`,
    `- Competitors Benchmark: ${brand}/features/compare-and-benchmark`,
    `- Entity Positioning: ${brand}/features/get-found-and-verified`,
    `- Recommendation Diagnostics: ${brand}/features/diagnose-and-fix`,
    `- Authority Building: ${brand}/features/connect-and-transact`,
    `- Autonomous Growth Agent and Devy: ${brand}/features/grow-and-automate`,
    `- Documentation and MCP: ${docsUrl}`,
    '',
    '## Directories',
    `- Homepage: ${origin}/`,
    `- All 50 States: ${origin}/regions/`,
    `- All 11 Industries: ${origin}/industries/`,
    `- All 18 Field Guides: ${origin}/guides/`,
    '',
    '## Industry Hubs (each linked to all 50 states)',
    ...industries.map(i => `- ${i.name} (${i.schemaType}): ${origin}${i.route} | ${i.description}`),
    '',
    '## State Hubs (each linked to all 11 industries)',
    ...states.map(s => `- ${s.name} (${s.code}, ${s.first}, ${s.second}, ${s.third}): ${origin}${s.route}`),
    '',
    '## Editorial Playbooks and Field Guides',
    ...guides.map(g => `- ${g.name} [${g.category}]: ${origin}${g.route} | ${g.description}`),
    '',
    '## State x Industry Playbooks (550 routes)',
    `Pattern: ${origin}/regions/{state-slug}/{industry-slug}/`,
    `States: ${states.map(s => s.slug).join(', ')}`,
    `Industries: ${industries.map(i => i.slug).join(', ')}`
  ];
  return lines.join('\n') + '\n';
}

async function write(path, contents) {
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path, contents);
}

const rendered = new Map(pages.map(p => [p.route, render(p)]));
if (rendered.size !== pages.length || states.length !== 50 || industries.length !== 11 || guides.length !== 18 || stateIndustryPages.length !== 550) {
  throw new Error('Unexpected page inventory.');
}

const seenTitles = new Set();
const seenDescriptions = new Set();
for (const p of pages) {
  if (seenTitles.has(p.title)) throw new Error('Duplicate page title: ' + p.title);
  if (seenDescriptions.has(p.description)) throw new Error('Duplicate meta description: ' + p.route);
  seenTitles.add(p.title);
  seenDescriptions.add(p.description);
}

const assets = new Set(await readdir('src/assets'));
for (const [route,html] of rendered) {
  if (html.includes('\u2014')) throw new Error('Em dash detected at ' + route);
  if ((html.match(/<h1>/g) || []).length !== 1) throw new Error('Invalid heading count at '+route);
  for (const [,href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const target = href.split('#')[0];
    if (target.startsWith('/assets/') ? !assets.has(target.slice(8)) : !rendered.has(target)) throw new Error('Broken link at '+route+' to '+href);
  }
}

const llmsTxt = buildLlmsTxt();
if (llmsTxt.includes('\u2014')) throw new Error('Em dash detected in llms.txt');

await rm(output,{recursive:true,force:true,maxRetries:3});
await mkdir(output);
await cp('src/assets',join(output,'assets'),{recursive:true});
for (const [route,html] of rendered) await write(join(output,route.slice(1),'index.html'),html);
await write(join(output,'404.html'),render(notFound));
await write(join(output,'llms.txt'),llmsTxt);
await write(join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await write(join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${e(origin+p.route)}</loc><lastmod>${buildDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await write(join(output,'routes.json'),JSON.stringify(pages.map(({route,kind,title}) => ({route,kind,title})),null,2)+'\n');
console.log(`Built ${pages.length} routes (${stateIndustryPages.length} state-industry playbooks) and a custom 404 into ${output}/`);
