// Born Displaced — Country Story Card widget
// Data path is relative so it works on GitHub Pages
const BORN_DISPLACED_DATA_URL = 'data/country_data.json';

(function(DATA_URL){
  'use strict';

  const CRISIS = {
    minimal:  { label:'Low',      bg:'rgba(102,187,106,0.18)', text:'#a5d6a7', line:'#66bb6a' },
    low:      { label:'Low',      bg:'rgba(102,187,106,0.18)', text:'#a5d6a7', line:'#66bb6a' },
    medium:   { label:'Medium',   bg:'rgba(255,183,77,0.18)',  text:'#ffcc80', line:'#ffb74d' },
    high:     { label:'High',     bg:'rgba(239,83,80,0.22)',   text:'#ff8a80', line:'#ef5350' },
    critical: { label:'Critical', bg:'#b71c1c',                text:'#ffffff', line:'#ef5350' }
  };
  const CRISIS_Z = { minimal:0, low:1, medium:2, high:3, critical:4 };

  const MAP_CONFIG = { responsive:true, displayModeBar:false, scrollZoom:true, doubleClick:'reset' };

  let chart = null;
  let globalData = null;
  let selectedIso = null;

  const fmtD = n => !n ? '0' : n>=1e6 ? (n/1e6).toFixed(1)+'M' : n>=1e3 ? (n/1e3).toFixed(0)+'K' : n.toLocaleString('en-US');
  const fmtG = n => n==null ? '—' : '$'+Math.round(n).toLocaleString('en-US');

  function hexToRgba(hex, a){
    if(hex.startsWith('#')) hex = hex.slice(1);
    if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
    const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function genInsight(c){
    const vm = c.mortality.filter(v=>v!=null);
    const peak = Math.max(...c.total_displaced);
    const py = c.years[c.total_displaced.indexOf(peak)];
    let mc = null;
    if(vm.length >= 2){
      const f = vm[0], l = vm.at(-1);
      mc = ((l-f)/f)*100;
    }
    if(mc!=null && Math.abs(mc)>=30) return `Child mortality ${mc<0?'fell':'rose'} ${Math.abs(mc).toFixed(0)}% from 2010 to 2022.`;
    if(peak >= 1e6) return `Displacement peaked in ${py} at ${fmtD(peak)} people.`;
    if(mc!=null && Math.abs(mc)>=10) return `Child mortality ${mc<0?'fell':'rose'} ${Math.abs(mc).toFixed(0)}% over the period.`;
    if(peak >= 1e5) return `Peak displacement reached ${fmtD(peak)} in ${py}.`;
    if(peak >= 1e4) return `${fmtD(peak)} people were displaced at the ${py} peak.`;
    if(vm.length > 0) return `Mortality remained around ${vm.at(-1).toFixed(1)} per 1,000 throughout 2010–2022.`;
    return 'Limited data available for this country.';
  }

  function buildMapTraces(data, highlightIso){
    const isos = [], zVals = [], texts = [];
    Object.entries(data.countries).forEach(([iso, c]) => {
      isos.push(iso);
      zVals.push(CRISIS_Z[c.crisis_level] ?? 1);
      texts.push((c.flag ? c.flag+' ' : '') + c.name);
    });
    const baseTrace = {
      type:'choropleth', locationmode:'ISO-3',
      locations:isos, z:zVals, text:texts,
      colorscale:[[0.0,'#66bb6a'],[0.4,'#66bb6a'],[0.4,'#ffb74d'],[0.6,'#ffb74d'],[0.6,'#ef5350'],[1.0,'#ef5350']],
      zmin:0, zmax:4, showscale:false,
      hovertemplate:'<b>%{text}</b><extra></extra>',
      marker:{ line:{ color:'rgba(255,255,255,0.18)', width:0.5 } }
    };
    const traces = [baseTrace];
    if(highlightIso && data.countries[highlightIso]){
      const hc = data.countries[highlightIso];
      traces.push({
        type:'choropleth', locationmode:'ISO-3',
        locations:[highlightIso], z:[CRISIS_Z[hc.crisis_level] ?? 1],
        zmin:0, zmax:4, colorscale:baseTrace.colorscale,
        showscale:false, hoverinfo:'skip',
        marker:{ line:{ color:'#ffffff', width:2.5 } }
      });
    }
    return traces;
  }

  function getMapLayout(){
    return {
      geo:{
        showframe:false, showcoastlines:false,
        showland:true, landcolor:'#1a2a3a',
        showocean:true, oceancolor:'#0a1320',
        showcountries:true, countrycolor:'rgba(255,255,255,0.06)',
        showlakes:false,
        projection:{ type:'natural earth' },
        bgcolor:'transparent',
        lataxis:{ range:[-58, 84] }
      },
      paper_bgcolor:'transparent',
      plot_bgcolor:'transparent',
      margin:{ t:0, b:0, l:0, r:0 },
      height: window.innerWidth < 600 ? 320 : 420,
      dragmode:'pan'
    };
  }

  function renderMap(data){
    const mapEl = document.getElementById('bd-map-wrap');
    mapEl.innerHTML = '';
    Plotly.newPlot(mapEl, buildMapTraces(data, null), getMapLayout(), MAP_CONFIG);

    mapEl.on('plotly_click', ev => {
      if(!ev.points || !ev.points.length){ closeCard(); return; }
      const iso = ev.points[0].location;
      if(!data.countries[iso]){ closeCard(); return; }
      selectCountry(iso);
    });
    document.getElementById('bd-close').addEventListener('click', closeCard);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeCard(); });
  }

  function closeCard(){
    if(!selectedIso) return;
    selectedIso = null;
    document.getElementById('bd-card-wrap').classList.remove('bd-visible');
    Plotly.react('bd-map-wrap', buildMapTraces(globalData, null), getMapLayout(), MAP_CONFIG);
    document.getElementById('bd-map-section').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function selectCountry(iso){
    if(selectedIso === iso){ closeCard(); return; }
    selectedIso = iso;
    Plotly.react('bd-map-wrap', buildMapTraces(globalData, iso), getMapLayout(), MAP_CONFIG);
    renderCard(iso);
    const wrap = document.getElementById('bd-card-wrap');
    if(!wrap.classList.contains('bd-visible')){
      wrap.classList.add('bd-visible');
      setTimeout(() => wrap.scrollIntoView({ behavior:'smooth', block:'nearest' }), 350);
    }
  }

  function renderCard(iso){
    const c = globalData.countries[iso];
    if(!c) return;
    document.getElementById('bd-flag').textContent = c.flag || '';
    document.getElementById('bd-country-name').textContent = c.name;

    const badge = document.getElementById('bd-crisis-badge');
    const cr = CRISIS[c.crisis_level] || CRISIS.low;
    badge.textContent = cr.label + ' crisis';
    badge.style.background = cr.bg;
    badge.style.color = cr.text;

    const lm = c.mortality.filter(v => v!=null).at(-1);
    document.getElementById('bd-mortality-value').textContent = lm!=null ? lm.toFixed(1) : '—';
    document.getElementById('bd-gdp-value').textContent = fmtG(c.gdp_per_capita);

    const peak = Math.max(...c.total_displaced);
    const pct = globalData.global_max_displaced > 0
      ? Math.max((peak / globalData.global_max_displaced) * 100, peak > 0 ? 1 : 0)
      : 0;
    document.getElementById('bd-disp-bar').style.width = pct.toFixed(1) + '%';
    document.getElementById('bd-disp-value').textContent = fmtD(peak) + ' people';

    document.getElementById('bd-insight').textContent = genInsight(c);
    renderChart(c, cr);
  }

  function renderChart(c, cr){
    const ctx = document.getElementById('bd-mortality-chart').getContext('2d');
    const fg = ctx.createLinearGradient(0, 0, 0, 200);
    fg.addColorStop(0, hexToRgba(cr.line, 0.35));
    fg.addColorStop(1, hexToRgba(cr.line, 0));

    const ds = {
      label:'Child mortality (ages 1–4)',
      data:c.mortality,
      borderColor:cr.line,
      backgroundColor:fg,
      borderWidth:2.5,
      pointRadius:3,
      pointBackgroundColor:cr.line,
      pointBorderColor:'#0d1b2a',
      pointBorderWidth:1.5,
      pointHoverRadius:5,
      fill:true, tension:0.35, spanGaps:true
    };

    if(chart){
      chart.data.labels = c.years;
      chart.data.datasets[0] = ds;
      chart.update('active');
      return;
    }

    chart = new Chart(ctx, {
      type:'line',
      data:{ labels:c.years, datasets:[ds] },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ display:false },
          tooltip:{
            backgroundColor:'#0d1b2a', titleColor:'#fff', bodyColor:'#e6e9ed',
            borderColor:'#2a3a52', borderWidth:1, padding:10, cornerRadius:6,
            callbacks:{
              label: ctx => ctx.parsed.y!=null
                ? ctx.parsed.y.toFixed(1) + ' deaths per 1,000 children'
                : 'No data'
            }
          }
        },
        scales:{
          x:{ grid:{ display:false }, border:{ color:'rgba(255,255,255,0.08)' },
              ticks:{ color:'#6f8398', font:{ size:10.5 }, maxRotation:0 } },
          y:{ beginAtZero:false, grid:{ color:'rgba(255,255,255,0.05)' },
              border:{ display:false },
              title:{ display:true, text:'Deaths / 1,000', color:'#6f8398', font:{ size:10.5, weight:'600' } },
              ticks:{ color:'#6f8398', font:{ size:10.5 } } }
        },
        animation:{ duration:450, easing:'easeOutCubic' }
      }
    });
  }

  function showError(err){
    document.getElementById('bd-map-wrap').innerHTML =
      '<p class="bd-error">⚠ Could not load data.<br>Check that <code>' + DATA_URL + '</code> is reachable.<br><br>' + err.message + '</p>';
    console.error('[Born Displaced]', err);
  }

  function init(){
    fetch(DATA_URL)
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => { globalData = data; renderMap(data); })
      .catch(showError);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
}(BORN_DISPLACED_DATA_URL));

// Iframe height auto-resize (works for same-origin only — GH Pages serves all on same origin)
function resizeIframe(iframe){
  try{ iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px'; }
  catch(e){}
}
