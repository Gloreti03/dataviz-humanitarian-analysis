// ============================================================
//  Country Story Card — Born Displaced
//  Requires: Chart.js 4.x  (loaded before this script)
//
//  DATA_URL -> path or absolute URL to country_data.json
//  Local preview : python -m http.server  (from this folder)
//                  then open  http://localhost:8000/preview.html
//  WordPress     : upload country_data.json to Media Library,
//                  copy the file URL and replace the value below
// ============================================================
const BORN_DISPLACED_DATA_URL = './country_data.json';

(function (DATA_URL) {
  'use strict';

  // Crisis level -> visual config (dark theme palette)
  const CRISIS = {
    minimal:  { label: 'Minimal',  bg: 'rgba(102,187,106,0.18)', text: '#a5d6a7', line: '#66bb6a' },
    low:      { label: 'Low',      bg: 'rgba(255,183,77,0.18)',  text: '#ffcc80', line: '#ffb74d' },
    medium:   { label: 'Medium',   bg: 'rgba(255,138,101,0.22)', text: '#ffab91', line: '#ff8a65' },
    high:     { label: 'High',     bg: 'rgba(239,83,80,0.25)',   text: '#ff8a80', line: '#ef5350' },
    critical: { label: 'Critical', bg: '#b71c1c',                text: '#ffffff', line: '#ff5252' },
  };

  let chart      = null;
  let globalData = null;

  // ── Utilities ─────────────────────────────────────────────

  function fmtDisplaced(n) {
    if (!n || n === 0) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toLocaleString('en-US');
  }

  function fmtGDP(n) {
    return n == null ? '—' : '$' + Math.round(n).toLocaleString('en-US');
  }

  // Generate a one-sentence insight from the country's data
  function generateInsight(c) {
    const validMort = c.mortality.filter(v => v != null);
    const peak      = Math.max(...c.total_displaced);
    const peakIdx   = c.total_displaced.indexOf(peak);
    const peakYear  = c.years[peakIdx];

    let mortChange = null;
    if (validMort.length >= 2) {
      const first = validMort[0];
      const last  = validMort.at(-1);
      mortChange  = ((last - first) / first) * 100;
    }

    if (mortChange != null && Math.abs(mortChange) >= 30) {
      const dir = mortChange < 0 ? 'fell' : 'rose';
      return `Child mortality ${dir} ${Math.abs(mortChange).toFixed(0)}% from 2010 to 2022.`;
    }
    if (peak >= 1e6) {
      return `Displacement peaked in ${peakYear} at ${fmtDisplaced(peak)} people.`;
    }
    if (mortChange != null && Math.abs(mortChange) >= 10) {
      const dir = mortChange < 0 ? 'fell' : 'rose';
      return `Child mortality ${dir} ${Math.abs(mortChange).toFixed(0)}% over the period.`;
    }
    if (peak >= 1e5) {
      return `Peak displacement reached ${fmtDisplaced(peak)} in ${peakYear}.`;
    }
    if (peak >= 1e4) {
      return `${fmtDisplaced(peak)} people were displaced at the ${peakYear} peak.`;
    }
    if (validMort.length > 0) {
      const last = validMort.at(-1);
      return `Mortality remained around ${last.toFixed(1)} per 1,000 throughout 2010–2022.`;
    }
    return 'Limited data available for this country.';
  }

  // ── Dropdown ──────────────────────────────────────────────

  function populateSelect(data) {
    const sel = document.getElementById('bd-country-select');
    sel.innerHTML = '';

    Object.entries(data.countries)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .forEach(([iso, c]) => {
        const opt = document.createElement('option');
        opt.value = iso;
        opt.textContent = (c.flag ? c.flag + '  ' : '') + c.name;
        sel.appendChild(opt);
      });
  }

  // ── Card rendering ────────────────────────────────────────

  function renderCard(iso) {
    const c = globalData.countries[iso];
    if (!c) return;

    // Flag + country name
    document.getElementById('bd-flag').textContent = c.flag || '';
    document.getElementById('bd-country-name').textContent = c.name;

    // Crisis badge
    const badge  = document.getElementById('bd-crisis-badge');
    const crisis = CRISIS[c.crisis_level] || CRISIS.low;
    badge.textContent = crisis.label + ' crisis';
    badge.style.background = crisis.bg;
    badge.style.color      = crisis.text;

    // Latest mortality (most recent non-null value)
    const lastMort = c.mortality.filter(v => v != null).at(-1);
    document.getElementById('bd-mortality-value').textContent =
      lastMort != null ? lastMort.toFixed(1) : '—';

    // GDP
    document.getElementById('bd-gdp-value').textContent = fmtGDP(c.gdp_per_capita);

    // Displacement bar (peak relative to global maximum)
    const peak = Math.max(...c.total_displaced);
    const pct  = globalData.global_max_displaced > 0
      ? Math.max((peak / globalData.global_max_displaced) * 100, peak > 0 ? 1 : 0)
      : 0;
    document.getElementById('bd-disp-bar').style.width = pct.toFixed(1) + '%';
    document.getElementById('bd-disp-value').textContent = fmtDisplaced(peak) + ' people';

    // Auto-generated insight
    document.getElementById('bd-insight').textContent = generateInsight(c);

    // Line chart
    renderChart(c, crisis);
  }

  // ── Chart ─────────────────────────────────────────────────

  function renderChart(c, crisis) {
    const ctx = document.getElementById('bd-mortality-chart').getContext('2d');

    // Build a soft fill gradient based on the crisis line color
    const fillGrad = ctx.createLinearGradient(0, 0, 0, 200);
    fillGrad.addColorStop(0, hexToRgba(crisis.line, 0.35));
    fillGrad.addColorStop(1, hexToRgba(crisis.line, 0));

    const dataset = {
      label: 'Child mortality (ages 1–4)',
      data: c.mortality,
      borderColor: crisis.line,
      backgroundColor: fillGrad,
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: crisis.line,
      pointBorderColor: '#0d1b2a',
      pointBorderWidth: 1.5,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.35,
      spanGaps: true,
    };

    if (chart) {
      chart.data.labels = c.years;
      chart.data.datasets[0] = dataset;
      chart.update('active');
      return;
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: c.years, datasets: [dataset] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1b2a',
            titleColor: '#ffffff',
            bodyColor: '#e6e9ed',
            borderColor: '#2a3a52',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: ctx => ctx.parsed.y != null
                ? ctx.parsed.y.toFixed(1) + ' deaths per 1,000 children'
                : 'No data',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#6f8398', font: { size: 10.5 }, maxRotation: 0 },
          },
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255,255,255,0.05)' },
            border: { display: false },
            title: {
              display: true,
              text: 'Deaths / 1,000',
              color: '#6f8398',
              font: { size: 10.5, weight: '600' },
            },
            ticks: { color: '#6f8398', font: { size: 10.5 } },
          },
        },
        animation: { duration: 450, easing: 'easeOutCubic' },
      },
    });
  }

  // Convert hex like "#ef5350" or named to rgba string
  function hexToRgba(hex, alpha) {
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Init ──────────────────────────────────────────────────

  function init() {
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        globalData = data;
        populateSelect(data);

        const sel = document.getElementById('bd-country-select');
        sel.addEventListener('change', () => renderCard(sel.value));

        if (sel.options.length > 0) {
          renderCard(sel.value);
        }
      })
      .catch(err => {
        document.getElementById('bd-card').innerHTML =
          '<p class="bd-error">' +
            '⚠ Could not load country data.<br>' +
            'Local preview: run <code>python -m http.server</code> from this folder,<br>' +
            'then open <code>http://localhost:8000/preview.html</code><br><br>' +
            'WordPress: set <code>BORN_DISPLACED_DATA_URL</code> to the full JSON URL.' +
          '</p>';
        console.error('[Born Displaced]', err);
      });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

}(BORN_DISPLACED_DATA_URL));
