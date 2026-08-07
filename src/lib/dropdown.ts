// Theme-aware custom dropdown.
//
// Progressively enhances every native <select> on the page into an accessible,
// fully styleable listbox. The native <select> is KEPT in the DOM (visually
// hidden) as the single source of truth, so FormData, `.value`, `change`
// events, `form.reset()` and `selectedIndex` all keep working unchanged — the
// custom UI just mirrors it. This is what lets the dropdown follow the site's
// dark/light theme (native <option> popups can't be themed).
//
// Consumers that mutate a select's value programmatically (e.g. a "swap"
// button, or restoring saved state) should dispatch a bubbling `cs:sync` event
// on the select so the visible trigger relabels itself:
//   select.dispatchEvent(new Event('cs:sync', { bubbles: true }));

let idSeq = 0;

// Every open panel registers a closer here so a single outside-click / Escape
// handler can dismiss whichever dropdown is showing.
const openInstances = new Set<() => void>();

function closeAll(): void {
  openInstances.forEach((close) => close());
}

/** Enhance a single <select>. Idempotent — safe to call more than once. */
function enhance(select: HTMLSelectElement): void {
  if (select.dataset.csDone === '1') return;
  select.dataset.csDone = '1';

  const doc = select.ownerDocument;
  const uid = `cs-${++idSeq}`;

  // ---- Wrapper -----------------------------------------------------------
  const wrap = doc.createElement('div');
  wrap.className = 'cs';
  // Carry a size/variant hint from the original select's classes so the
  // trigger matches the surrounding form (.field vs .uc-select etc.).
  if (select.classList.contains('uc-select')) wrap.classList.add('cs--uc');
  else wrap.classList.add('cs--field');

  select.parentNode?.insertBefore(wrap, select);
  wrap.appendChild(select);

  // Hide the native control from view + AT (the custom UI is the a11y surface)
  // but leave it fully functional for forms.
  select.classList.add('cs-native');
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;

  // ---- Trigger -----------------------------------------------------------
  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.id = `${uid}-btn`;

  // Accessible name: explicit aria-label wins, else the associated <label>.
  const ariaLabel = select.getAttribute('aria-label');
  const labelEl = select.id ? doc.querySelector<HTMLElement>(`label[for="${select.id}"]`) : null;
  if (ariaLabel) {
    trigger.setAttribute('aria-label', ariaLabel);
  } else if (labelEl) {
    if (!labelEl.id) labelEl.id = `${uid}-lbl`;
    trigger.setAttribute('aria-labelledby', `${labelEl.id} ${uid}-btn`);
  }

  const valueEl = doc.createElement('span');
  valueEl.className = 'cs-value';

  const arrow = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('class', 'cs-arrow');
  arrow.setAttribute('width', '14');
  arrow.setAttribute('height', '14');
  arrow.setAttribute('viewBox', '0 0 24 24');
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', 'currentColor');
  arrow.setAttribute('stroke-width', '2.2');
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  arrow.setAttribute('aria-hidden', 'true');
  const arrowPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'm6 9 6 6 6-6');
  arrow.appendChild(arrowPath);

  trigger.append(valueEl, arrow);

  // ---- Panel -------------------------------------------------------------
  const panel = doc.createElement('ul');
  panel.className = 'cs-panel';
  panel.id = `${uid}-list`;
  panel.setAttribute('role', 'listbox');
  panel.tabIndex = -1;
  panel.hidden = true;
  if (ariaLabel) panel.setAttribute('aria-label', ariaLabel);
  trigger.setAttribute('aria-controls', panel.id);

  const optionEls: HTMLLIElement[] = [];
  Array.from(select.options).forEach((opt, i) => {
    const li = doc.createElement('li');
    li.className = 'cs-option';
    li.setAttribute('role', 'option');
    li.id = `${uid}-opt-${i}`;
    li.dataset.value = opt.value;
    li.dataset.index = String(i);
    li.textContent = opt.textContent;
    if (opt.disabled) li.setAttribute('aria-disabled', 'true');
    panel.appendChild(li);
    optionEls.push(li);
  });

  wrap.append(trigger, panel);

  // ---- State + sync ------------------------------------------------------
  let activeIndex = select.selectedIndex < 0 ? 0 : select.selectedIndex;

  // Reflect the native select's current selection onto the custom UI. An
  // option may carry a short `data-trigger` label to show a compact value on
  // the trigger while the listbox keeps the full option text.
  const sync = (): void => {
    const sel = select.selectedIndex;
    const current = select.options[sel];
    valueEl.textContent = current ? (current.dataset.trigger ?? current.textContent) : '';
    optionEls.forEach((li, i) => {
      const isSel = i === sel;
      li.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
  };

  const setActive = (i: number, scroll = true): void => {
    const max = optionEls.length - 1;
    let next = i;
    if (next < 0) next = 0;
    if (next > max) next = max;
    if (activeIndex === next && !scroll) return;
    activeIndex = next;
    optionEls.forEach((li, idx) => li.classList.toggle('is-active', idx === next));
    const activeEl = optionEls[next];
    if (activeEl) {
      panel.setAttribute('aria-activedescendant', activeEl.id);
      if (scroll) activeEl.scrollIntoView({ block: 'nearest' });
    }
  };

  const open = (): void => {
    if (!panel.hidden) return;
    closeAll(); // only one dropdown open at a time
    panel.hidden = false;
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    setActive(select.selectedIndex < 0 ? 0 : select.selectedIndex, true);
    openInstances.add(close);
    // Move focus into the panel so arrow-key navigation & type-ahead work
    // whether the dropdown was opened by mouse or keyboard.
    panel.focus();
  };

  function close(focusTrigger = false): void {
    if (panel.hidden) return;
    panel.hidden = true;
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    panel.removeAttribute('aria-activedescendant');
    openInstances.delete(close);
    if (focusTrigger) trigger.focus();
  }

  // Commit a choice: update the native select, mirror the UI, and fire the
  // same events a real <select> would so downstream logic runs untouched.
  const choose = (i: number): void => {
    const opt = select.options[i];
    if (!opt || opt.disabled) return;
    if (select.selectedIndex !== i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
  };

  // ---- Events ------------------------------------------------------------
  trigger.addEventListener('click', () => {
    if (panel.hidden) open();
    else close();
  });

  trigger.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault();
        open();
        break;
      default:
        break;
    }
  });

  panel.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('.cs-option');
    if (!li || li.getAttribute('aria-disabled') === 'true') return;
    choose(Number(li.dataset.index));
    close(true);
  });

  panel.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('.cs-option');
    if (li && li.dataset.index) setActive(Number(li.dataset.index), false);
  }, { passive: true });

  panel.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(optionEls.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        close(true);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close();
        break;
      default:
        // Type-ahead: jump to the next option starting with the typed letter.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const needle = e.key.toLowerCase();
          const start = activeIndex + 1;
          for (let n = 0; n < optionEls.length; n++) {
            const idx = (start + n) % optionEls.length;
            const txt = optionEls[idx].textContent?.trim().toLowerCase() ?? '';
            if (txt.startsWith(needle)) {
              setActive(idx);
              break;
            }
          }
        }
        break;
    }
  });

  // Clicking the associated <label> should open the custom dropdown, not focus
  // the hidden native select.
  if (labelEl) {
    labelEl.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  }

  // React to programmatic value changes (swap / restore / reset).
  select.addEventListener('cs:sync', sync);
  select.addEventListener('change', sync);

  sync();
}

/** Enhance every not-yet-enhanced <select> in the given root. */
export function enhanceSelects(root: ParentNode = document): void {
  root.querySelectorAll<HTMLSelectElement>('select:not([data-cs-done])').forEach(enhance);
}

function init(): void {
  enhanceSelects();

  // Dismiss on outside click / Escape at the document level.
  document.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.cs')) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
