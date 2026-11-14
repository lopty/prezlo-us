import { census, usps, trust } from './states.mjs';

const brand = 'https://prezlo.io';
const demo = 'https://calendly.com/prezlosupport/30min';
const trial = brand + '/auth?mode=register';
const arrow = '<svg class="arrow" aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10h12m-5-5 5 5-5 5"/></svg>';
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (label, href, mode = '') => `<a class="button ${mode}" href="${e(href)}">${label}${arrow}</a>`;
const sectionLabel = label => `<p class="label">${label}</p>`;

const capIcons = [
  '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
  '<path d="M4 20h16M7 16v-5m5 5V6m5 10V9"/>',
  '<path d="M12 3 4 7v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
  '<path d="M8 3h6l4 4v14H6V3Zm5 0v5h5M9 13h6m-6 4h4"/>',
  '<path d="M12 2v4m0 12v4M4.9 4.9l2.8 2.8m8.6 8.6 2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.6-8.6 2.8-2.8"/>',
  '<path d="M4 8h14m-4-4 4 4-4 4m6 4H6m4-4-4 4 4 4"/>'
];

function iconSvg(path) {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function hashIndex(a, b) {
  let h = 0;
  const str = `${a}:${b}`;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildCityPrompts(state, industry) {
  const services = industry.serviceList;
  const seed = hashIndex(state.code, industry.slug);
  const templates = {
    'service-businesses': [
      `Who handles ${services[0]} near ${state.first}, ${state.code} and confirms dispatch timing this week?`,
      `Which commercial contractor covers ${services[1]} across ${state.second} ${state.jurisdictionUnit}?`,
      `Who offers ${services[2]} in ${state.third} without subcontracting out of state?`
    ],
    'local-businesses': [
      `Which ${state.first} branch offers ${services[0]} with verified parking and direct booking?`,
      `Where near ${state.second}, ${state.code} can I book ${services[1]} on Saturdays?`,
      `Which local location in ${state.third} handles ${services[2]} with published walk-in hours?`
    ],
    'legal': [
      `Which ${state.name} attorney in ${state.first} handles ${services[0]} and offers an initial consultation?`,
      `Who advises businesses on ${services[1]} near ${state.second}, ${state.code}?`,
      `Which law firm serving ${state.third} covers ${services[2]} with clear bar credentials?`
    ],
    'accounting': [
      `Which CPA firm in ${state.first} handles ${services[0]} for growing businesses?`,
      `Who supports ${services[1]} for companies operating in ${state.second} and neighboring states?`,
      `Which ${state.name} accounting team near ${state.third} offers ${services[2]} by video?`
    ],
    'financial-services': [
      state.code === 'TX'
        ? 'Which financial adviser near Dallas works with business owners planning a sale?'
        : `Which fiduciary adviser in ${state.first} works with business owners on ${services[0]}?`,
      state.code === 'TX'
        ? 'Who in Austin helps families build a retirement income plan and meets by video?'
        : `Who near ${state.second}, ${state.code} specializes in ${services[1]} with transparent fees?`,
      `Which ${state.name} advisory firm serving ${state.third} handles ${services[2]}?`
    ],
    'real-estate': [
      `Who handles ${services[0]} in ${state.first}, ${state.code} and publishes active submarket sales?`,
      `Which brokerage near ${state.second} represents tenants and owners for ${services[1]}?`,
      `Who provides ${services[2]} for buyers relocating to ${state.third}, ${state.name}?`
    ],
    'healthcare': [
      `Which clinic in ${state.first}, ${state.code} offers ${services[0]} with online scheduling?`,
      `Where near ${state.second} can a patient book ${services[1]} this week?`,
      `Which ${state.name} practice location in ${state.third} accepts new patients for ${services[2]}?`
    ],
    'education': [
      `Which program in ${state.first} runs ${services[0]} with published start dates?`,
      `Where near ${state.second}, ${state.code} can working adults enroll in ${services[1]}?`,
      `Which ${state.name} training provider serving ${state.third} delivers ${services[2]}?`
    ],
    'travel': [
      `Which direct operator in ${state.first} runs ${services[0]} with published departure times?`,
      `Who near ${state.second}, ${state.code} handles ${services[1]} and confirms group capacity?`,
      `Which ${state.name} operator serving ${state.third} organizes ${services[2]}?`
    ],
    'logistics': [
      `Who handles ${services[0]} out of ${state.first}, ${state.code} with confirmed dock hours?`,
      `Which carrier near ${state.second} manages ${services[1]} into ${state.first}?`,
      `Who runs ${services[2]} between ${state.third} and major ${state.area} hubs?`
    ],
    'marketing-agencies': [
      `Which agency in ${state.first} runs measurable ${services[0]} for multi-site brands?`,
      `Who near ${state.second}, ${state.code} builds ${services[1]} that improves ChatGPT and Gemini citations?`,
      `Which ${state.name} partner serving ${state.third} delivers ${services[2]} with clear attribution?`
    ]
  };

  const list = templates[industry.slug] || templates['service-businesses'];
  const cities = [state.first, state.second, state.third];
  const checkNotes = [
    `Verify ${cities[0]} coverage, ${industry.credentialSignals.split(',')[0]}, and direct ${industry.actionVerb} route.`,
    `Confirm ${cities[1]} ${state.jurisdictionUnit} boundaries and separate scheduling from ${cities[0]}.`,
    `Resolve ${state.name} entity identity so AI cites your ${cities[2]} capability instead of an aggregator.`
  ];
  return cities.map((city, idx) => ({
    city,
    prompt: list[(idx + (seed % 1)) % list.length],
    finding: checkNotes[idx],
    service: services[idx % services.length]
  }));
}

function buildFaqs(state, industry) {
  const lower = industry.name.toLowerCase();
  if (state.code === 'TX' && industry.slug === 'financial-services') {
    return [
      ['Should we build separate Dallas, Austin, and Houston advisory pages?', 'Give each city a dedicated page when it has a real difference a prospect needs to know, such as local advisory staffing, in-person meeting options, or client specialization. A single Texas-wide page can explain one shared remote offering cleanly.'],
      ['How does Prezlo help Texas financial firms appear in ChatGPT and Gemini answers?', 'Prezlo tracks exact buyer prompts across ChatGPT, Gemini, Perplexity, and Claude, benchmarks which Texas firms get cited, verifies your legal entity and IAPD or Texas SSB registration signals, and prepares compliance-ready website updates via Devy.'],
      ['Can we include client reviews or performance numbers on Texas advisory pages?', 'Have your firm compliance owner review testimonials, ratings, endorsements, and performance claims against the SEC marketing rule and applicable Texas rules first. Start with verifiable service scope, approved disclosures, and links to public registration records.'],
      ['What counts as a qualified Texas financial advisory lead from AI search?', 'Track CTA click, inquiry received, compliance-safe fit confirmation, booked introductory consultation, and attended consultation separately so reporting reflects genuine pipeline impact.']
    ];
  }
  return [
    [`How can ${lower} businesses in ${state.name} get recommended by ChatGPT and Gemini?`, `Publish verifiable coverage across ${state.first}, ${state.second}, and ${state.third}, align your ${industry.credentialSignals} with public records, and use Prezlo to measure prompts, diagnose citation gaps, and ship structured updates.`],
    [`Should we create separate pages for ${state.first}, ${state.second}, and ${state.third}?`, `Create city-specific sections or pages when crew dispatch, ${state.jurisdictionUnit}, office staffing, appointment hours, or intake teams genuinely differ between markets. Keep shared statewide rules on one clear ${state.name} hub.`],
    [`Which Schema.org markup helps ${state.name} ${lower} rank in AI and Google search?`, `Embed ${industry.schemaType} JSON-LD paired with explicit areaServed (${state.name} and your served ${state.jurisdictionUnit}), Service items, and a FAQPage block whose questions match your visible page content.`],
    [`How do we measure qualified leads for ${lower} in ${state.name}?`, `Track observed AI recommendations separately from attributable visits, CTA clicks, received ${industry.actionVerb} requests, and team-confirmed fit on ${industry.intakeFields}.`]
  ];
}

export function buildStateIndustryPage(state, industry, allStates, allIndustries, findGuide, faqSection) {
  const isTxFinance = state.code === 'TX' && industry.slug === 'financial-services';
  const lower = industry.name.toLowerCase();
  const route = `/regions/${state.slug}/${industry.slug}/`;
  const title = isTxFinance
    ? 'AI Lead Generation for Texas Financial Advisory Firms'
    : `AI Search & Lead Generation for ${industry.name} in ${state.name}`;
  const description = isTxFinance
    ? 'See how Texas financial advisory firms test AI search, publish verifiable service evidence, and turn referrals across Dallas, Austin, and Houston into qualified consultations.'
    : `See how ${lower} in ${state.name} can test local buyer questions, verify service fit, and qualify AI referrals in ${state.first} and ${state.second}.`;

  const cityPrompts = buildCityPrompts(state, industry);
  const faqs = buildFaqs(state, industry);
  const guide = findGuide(industry.guide);
  const siblingIndustries = allIndustries.filter(item => item.slug !== industry.slug);
  const nearbyStates = allStates
    .filter(candidate => candidate.area === state.area && candidate.code !== state.code)
    .sort((a, b) => Math.abs(allStates.indexOf(a) - allStates.indexOf(state)) - Math.abs(allStates.indexOf(b) - allStates.indexOf(state)))
    .slice(0, 4);

  const publicEvidenceLink = isTxFinance
    ? `Reference official <a href="https://www.ssb.texas.gov/investors/registration-checks">Texas State Securities Board</a> checks, <a href="https://www.investor.gov/introduction-investing/investing-basics/glossary/investment-adviser-public-disclosure-iapd">IAPD records</a>, and <a href="https://www.sec.gov/rules-regulations/2020/12/investment-adviser-marketing">SEC marketing rule</a> standards.`
    : `Verify place names with <a href="${census}">Census Gazetteer Files</a>, confirm mailing boundaries with <a href="${usps}">USPS ZIP Code Lookup</a>, and reference <a href="https://www.usa.gov/state-governments">${state.name} state government records</a> alongside your ${industry.credentialSignals}.`;

  const capabilities = [
    ['Measure AI Recommendation', `${brand}/features/track-and-measure`, `Track how ChatGPT, Gemini, Perplexity, and Claude answer real ${state.name} buyer prompts across ${state.first}, ${state.second}, and ${state.third}.`],
    ['Competitors Benchmark', `${brand}/features/compare-and-benchmark`, `Compare which ${state.name} competitors get named first on ${industry.serviceList[0]} and inspect the exact citations lifting them.`],
    ['Entity Positioning', `${brand}/features/get-found-and-verified`, `Publish a canonical entity profile linking ${state.name} service areas, ${industry.credentialSignals.split(',')[0]}, and approved offers.`],
    ['Recommendation Diagnostics', `${brand}/features/diagnose-and-fix`, `Pinpoint why AI assistants confuse ${state.first} and ${state.second} coverage or cite outdated third-party directories.`],
    ['Authority Building', `${brand}/features/connect-and-transact`, `Earn authoritative citations and distribute evidence-backed ${state.name} guides through outreach and verified entity signals.`],
    ['Autonomous Growth & Devy', `${brand}/features/grow-and-automate`, `Use Devy and CMS or GitHub connectors to draft reviewable ${state.name} page updates and monitor ranking gains weekly.`]
  ];

  const h1Html = isTxFinance
    ? 'AI lead generation for Texas financial advisory firms'
    : `AI search and lead generation for ${lower} in ${state.name}`;

  const body = `<section class="detail-hero state-hero ${state.area.toLowerCase()}"><div class="wrap">
    <div class="detail-intro">
      ${sectionLabel(`${state.name} · ${industry.displayTag} · ${state.area} US`)}
      <h1>${h1Html}</h1>
      <p>Show up when ${industry.buyerRoles} ask AI assistants for ${industry.serviceList[0]} or ${industry.serviceList[1]} across ${state.first}, ${state.second}, and ${state.third}.</p>
      <div class="buttons center-buttons">${btn('Book a demo', demo)}${btn('Start a trial', trial, 'outline')}</div>
    </div>
    <div class="detail-pair">
      <div class="market-panel">
        <p>${state.name} market brief</p>
        <h2>${state.first}, ${state.second}, and ${state.third}</h2>
        <p>${state.marketContext}</p>
        <dl class="brief-meta">
          <div><dt>Target buyers</dt><dd>${e(industry.buyerRoles)}</dd></div>
          <div><dt>Industry focus</dt><dd>${e(industry.displayTag)}</dd></div>
          <div><dt>Conversion goal</dt><dd>${e(industry.actionVerb)}</dd></div>
        </dl>
      </div>
      <div class="question-card">
        ${sectionLabel(`Buyer prompts in ${state.name}`)}
        <div class="example-tabs prompt-tabs" data-example-tabs>
          ${cityPrompts.map((item, idx) => `<button type="button" data-example="${idx}" aria-label="Prompt for ${e(item.city)}">${e(item.city)}</button>`).join('')}
        </div>
        ${cityPrompts.map((item, idx) => `<div class="prompt-panel" data-panel="${idx}"${idx ? ' hidden' : ''}>
          <blockquote>“${e(item.prompt)}”</blockquote>
          <dl class="question-facts">
            <div><dt>Service intent</dt><dd>${e(item.service)}</dd></div>
            <div><dt>What AI checks</dt><dd>${e(item.finding)}</dd></div>
          </dl>
        </div>`).join('')}
      </div>
    </div>
  </div></section>

  <section class="block soft-blush-band"><div class="wrap">
    <header class="section-head">
      ${sectionLabel('Diagnostic reality')}
      <h2>Why AI misses ${lower} in ${state.name}</h2>
      <p>${industry.aiFailureMode}</p>
    </header>
    <ol class="editorial-process detail-diagnostics">
      <li><h3>Service coverage</h3><p>Explain whether the ${state.first} team serves ${state.second} and ${state.third}, and what buyers should confirm before contacting you.</p></li>
      <li><h3>Evidence buyers can check</h3><p>Show which sources support your claims about ${industry.credentialSignals}. Review conflicting details before changing public pages.</p></li>
      <li><h3>Inquiry fit</h3><p>Agree on the information your team needs for a ${industry.actionVerb}. Start with ${industry.intakeFields}.</p></li>
    </ol>
  </div></section>

  <section class="block"><div class="wrap">
    <header class="section-head">
      <h2>How Prezlo helps ${lower} in ${state.name}</h2>
      <p>Start with buyer questions, verify the public evidence, and review changes that could help qualified prospects find you.</p>
    </header>
    <div class="editorial-index">
      ${capabilities.map(([name, href, copy]) => `<a class="editorial-index-row" href="${href}"><strong>${name}</strong><span>${copy}</span>${arrow}</a>`).join('')}
    </div>
  </div></section>

  <section class="block soft-lavender-band"><div class="wrap">
    <header class="section-head">
      ${sectionLabel('Page blueprint')}
      <h2>What your ${state.name} ${lower} page must publish</h2>
      <p>Align human buyer clarity with machine-readable proof so both AI assistants and ${state.name} prospects trust your offer immediately.</p>
    </header>
    <div class="blueprint-grid">
      <div class="editorial-card tone-peach blueprint-card">
        <span class="medallion">${iconSvg(capIcons[3])}</span>
        <h3>Core offers and ${state.jurisdictionUnit}</h3>
        <p>Detail ${industry.serviceList.join(', ')} alongside exact coverage rules for ${state.first}, ${state.second}, and ${state.third}. State when remote consults differ from on-site availability.</p>
      </div>
      <div class="editorial-card tone-sage blueprint-card">
        <span class="medallion">${iconSvg(capIcons[2])}</span>
        <h3>Public evidence and oversight</h3>
        <p>${publicEvidenceLink}</p>
      </div>
      <div class="schema-console-card">
        <div class="art-toolbar"><span>Schema & Trust API</span><span>${state.code} · Ready</span></div>
        <h3>Machine-readable entity signals</h3>
        <dl class="schema-specs">
          <div><dt>@type</dt><dd>${e(industry.schemaType)}</dd></div>
          <div><dt>areaServed</dt><dd>${e(state.name)} (${e(state.first)}, ${e(state.second)})</dd></div>
          <div><dt>Verification</dt><dd><a href="${trust}">Prezlo Trust API</a> &amp; <a href="/guides/schema-and-llms-txt-playbook/">llms.txt</a></dd></div>
        </dl>
      </div>
    </div>
  </div></section>

  <section class="block qualification-band"><div class="wrap split">
    <div>
      ${sectionLabel('Lead qualification')}
      <h2>Turn ${state.name} AI referrals into qualified ${industry.actionVerb}s</h2>
      <p>${industry.qualification}</p>
      <p>Start intake with <strong>${industry.intakeFields}</strong>, then record observed AI recommendation, attributable visit, CTA click, received inquiry, and sales-confirmed fit as separate pipeline stages.</p>
      <a class="under" href="/guides/track-ai-referral-leads/">Read the AI lead measurement guide ${arrow}</a>
    </div>
    <a class="guide-card guide-tone-${e(guide.category.toLowerCase().replaceAll(' ', '-'))}" href="${guide.route}">${sectionLabel(guide.category + ' playbook')}<h3>${guide.name}</h3><p>${guide.description}</p><span class="card-arrow">${arrow}</span></a>
  </div></section>

  <section class="block"><div class="wrap">
    <header class="section-head section-row">
      <div>${sectionLabel('Internal coverage mesh')}<h2>Explore more in ${state.name} and ${lower}</h2><p>Compare sibling industry playbooks in ${state.name} or neighboring ${state.area} states.</p></div>
      <div class="buttons">${btn(`${state.name} hub`, state.route, 'outline')}${btn(`${industry.name} hub`, industry.route, 'outline')}</div>
    </header>
    <div class="mesh-split">
      <div>
        <h3 class="mesh-heading">Other industries in ${state.name}</h3>
        <div class="mesh-links">${siblingIndustries.map(item => `<a class="mesh-item tone-${item.tone}" href="/regions/${state.slug}/${item.slug}/"><span>${item.name} in ${state.name}</span>${arrow}</a>`).join('')}</div>
      </div>
      <div>
        <h3 class="mesh-heading">${industry.name} in nearby ${state.area} states</h3>
        <div class="mesh-links">${nearbyStates.map(neighbor => `<a class="mesh-item tone-${industry.tone}" href="/regions/${neighbor.slug}/${industry.slug}/"><span>${industry.name} in ${neighbor.name}</span>${arrow}</a>`).join('')}</div>
      </div>
    </div>
  </div></section>

  ${faqSection(faqs, `Frequently asked questions about ${lower} AI search in ${state.name}`)}`;

  return {
    route,
    parent: state.route,
    kind: 'state-industry',
    industry,
    name: `${industry.name} in ${state.name}`,
    title,
    description,
    faqs,
    schemaType: industry.schemaType,
    areaServed: state.name,
    serviceList: industry.serviceList,
    body
  };
}
