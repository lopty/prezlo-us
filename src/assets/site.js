document.querySelectorAll('[data-example-tabs]').forEach((tabs, groupIdx) => {
  const container = tabs.closest('.console, .question-card') || tabs.parentElement;
  const buttons = [...tabs.querySelectorAll('button')];
  const panels = [...container.querySelectorAll('[data-panel]')];
  if (!buttons.length || buttons.length !== panels.length) return;

  const select = index => {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };

  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Buyer prompt examples');
  buttons.forEach((button, i) => {
    button.id = `example-tab-${groupIdx}-${i}`;
    button.setAttribute('role', 'tab');
    panels[i].id = `example-panel-${groupIdx}-${i}`;
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', button.id);
    button.setAttribute('aria-controls', panels[i].id);
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', event => {
      const target = {
        ArrowLeft: (i + buttons.length - 1) % buttons.length,
        ArrowRight: (i + 1) % buttons.length,
        Home: 0,
        End: buttons.length - 1
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(target);
      buttons[target].focus();
    });
  });
  select(0);
  tabs.classList.add('ready');
});

const search = document.querySelector('[data-search]');
if (search) {
  search.hidden = false;
  const input = search.querySelector('input');
  const status = search.querySelector('[data-count]');
  const mapStates = new Map([...document.querySelectorAll('[data-map-code]')].map(link => [link.dataset.mapCode, link]));
  const groups = [...document.querySelectorAll('[data-state-group]')];
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let total = 0;
    groups.forEach(group => {
      let count = 0;
      group.querySelectorAll('[data-state]').forEach(link => {
        const code = link.dataset.stateCode;
        link.hidden = !link.dataset.state.includes(query) && code.toLowerCase() !== query;
        mapStates.get(code)?.classList.toggle('muted', Boolean(query) && link.hidden);
        if (!link.hidden) count += 1;
      });
      group.hidden = count === 0;
      total += count;
    });
    status.textContent = total ? total + (total === 1 ? ' state' : ' states') : 'No states found';
  };
  input.addEventListener('input', filter);
  filter();
}

const guideFilter = document.querySelector('[data-guide-filter]');
if (guideFilter) {
  const buttons = [...guideFilter.querySelectorAll('button')];
  const cards = [...document.querySelectorAll('[data-guide-list] [data-guide-category]')];
  const countEl = guideFilter.querySelector('[data-guide-count]');
  const apply = category => {
    let visible = 0;
    buttons.forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.category === category)));
    cards.forEach(card => {
      const match = category === 'All' || card.dataset.guideCategory === category;
      card.hidden = !match;
      if (match) visible += 1;
    });
    if (countEl) countEl.textContent = `${visible} ${visible === 1 ? 'playbook' : 'playbooks'}`;
  };
  buttons.forEach(btn => btn.addEventListener('click', () => apply(btn.dataset.category)));
}

document.querySelectorAll('[data-inline-filter]').forEach(wrapper => {
  const input = wrapper.querySelector('input');
  const section = wrapper.closest('section') || document;
  const items = [...section.querySelectorAll('[data-filter-item]')];
  const groups = [...section.querySelectorAll('[data-filter-group]')];
  const status = section.querySelector('[data-filter-count]');
  if (!input || !items.length) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    items.forEach(item => {
      item.hidden = Boolean(q) && !item.dataset.filterItem.includes(q);
    });
    groups.forEach(group => {
      const visible = group.querySelectorAll('[data-filter-item]:not([hidden])').length;
      group.hidden = visible === 0;
    });
    if (status) {
      const count = items.filter(item => !item.hidden).length;
      status.textContent = q ? (count ? `${count} ${count === 1 ? 'state' : 'states'} found` : 'No states found') : '';
    }
  });
});

const mobileMenu = document.querySelector('.mobile-nav');
mobileMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.open = false;
  });
});

const revealItems = document.querySelectorAll('[data-reveal]');
if (revealItems.length) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(el => observer.observe(el));
  }
}

