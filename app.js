var S = {
currentTab: ‘market’,
market: [], sold: [], leasecomps: [], compmarket: [], compsold: [], offmarket: [],
search: ‘’,
filters: {
market: { kind: ‘’ },
sold: { state: ‘’ },
offmarket: { status: ‘’ },
leasecomps: { market: ‘’, type: ‘’ },
comp: { kind: ‘’ }
},
shown: {},
PAGE: 40
};

function setHTML(id, h) { document.getElementById(id).innerHTML = h; }
function fmtSF(v) { if (!v) return ‘–’; var n = parseInt(String(v).replace(/[^0-9]/g,’’)); return isNaN(n) ? v : n.toLocaleString(); }
function emptyState(icon, title, sub) {
return ‘<div class="empty-state"><div class="empty-icon">’ + icon + ‘</div><div class="empty-title">’ + title + ‘</div><div class="empty-sub">’ + sub + ‘</div></div>’;
}
function lmBtn(tab, rem) {
return ‘<button class="load-more-btn" onclick="loadMore(&quot;' + tab + '&quot;)">Show more (’ + rem + ’ remaining)</button>’;
}
function loadMore(tab) { S.shown[tab] = (S.shown[tab] || S.PAGE) + S.PAGE; renderTab(tab); }
function q(r) { return S.search ? JSON.stringify(r).toLowerCase().indexOf(S.search) !== -1 : true; }

function switchTab(tab) {
document.querySelectorAll(’.tab-panel’).forEach(function(p) { p.classList.remove(‘active’); });
document.querySelectorAll(’.nav-tab’).forEach(function(n) { n.classList.remove(‘active’); });
document.getElementById(‘panel-’ + tab).classList.add(‘active’);
document.getElementById(‘nav-’ + tab).classList.add(‘active’);
S.currentTab = tab;
closeSheet();
if (tab === ‘intel’) { renderIntel(); return; }
renderTab(tab);
}

function onSearch() {
S.search = document.getElementById(‘search-input’).value.toLowerCase();
S.shown[S.currentTab] = S.PAGE;
renderTab(S.currentTab);
}

function renderTab(tab) {
if (!S.shown[tab]) S.shown[tab] = S.PAGE;
if (tab === ‘market’) renderJLL();
else if (tab === ‘sold’) renderSold();
else if (tab === ‘leasecomps’) renderLC();
else if (tab === ‘comp’) renderComp();
else if (tab === ‘offmarket’) renderOffMkt();
}

function filterChips(id, chips) {
var h = ‘’;
chips.forEach(function(c) {
if (c.div) { h += ‘<div style="width:1px;background:var(--border);flex-shrink:0"></div>’; return; }
h += ‘<div class="filter-chip' + (c.active ? ' active' : '') + '" onclick="' + c.fn + '">’ + c.label + ‘</div>’;
});
setHTML(id, h);
}

var STATUS_DOT = { ‘Awarded’:‘var(–green)’, ‘Marketing’:‘var(–blue)’, ‘BOM’:‘var(–green)’, ‘Under Contract’:‘var(–amber)’, ‘Marketed’:‘var(–blue)’, ‘Best & Final’:‘var(–red)’, ‘LOI’:‘var(–gold)’ };
var STATUS_TAG = { ‘Awarded’:‘tag-green’, ‘Marketing’:‘tag-blue’, ‘BOM’:‘tag-green’, ‘Under Contract’:‘tag-amber’, ‘Marketed’:‘tag-blue’, ‘Best & Final’:‘tag-red’, ‘LOI’:‘tag-gold’ };

function renderJLL() {
var f = S.filters.market || { kind: ‘’ };
var closed = (typeof JLL_CLOSED !== ‘undefined’) ? JLL_CLOSED : [];
var isClosedView = f.kind === ‘Closed’;
var data = isClosedView ? closed : S.market.filter(q);
if (!isClosedView) {
var awarded = data.filter(function(r){ return r.status===‘Awarded’; }).length;
setHTML(‘market-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + data.length + ‘</div><div class="stat-lbl">Total</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + awarded + ‘</div><div class="stat-lbl">Awarded</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + (data.length-awarded) + ‘</div><div class="stat-lbl">Active</div></div>’
);
} else {
setHTML(‘market-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + data.length + ‘</div><div class="stat-lbl">Closed</div></div>’ +
‘<div class="stat-cell"><div class="stat-val"> </div><div class="stat-lbl"> </div></div>’ +
‘<div class="stat-cell"><div class="stat-val"> </div><div class="stat-lbl"> </div></div>’
);
}
filterChips(‘market-filters’, [
{ label:‘In Market’, active:f.kind!==‘Closed’, fn:“setFilter(‘market’,‘kind’,’’)” },
{ label:‘Closed’, active:f.kind===‘Closed’, fn:“setFilter(‘market’,‘kind’,‘Closed’)” }
]);
if (!data.length) { setHTML(‘market-list’, emptyState(’◕’, isClosedView?‘No Closed Deals’:‘No JLL Deals’,‘Add entries to get started’)); return; }
var shown = S.shown.market || S.PAGE;
var h = ‘’;
var slice = isClosedView ? data : data.slice(0, shown);
slice.forEach(function(r) {
var idx = isClosedView ? closed.indexOf(r) : S.market.indexOf(r);
var clickFn = isClosedView ? ‘showPipelineDetail(’ + ((typeof PIPELINE_DEALS!==‘undefined’?PIPELINE_DEALS:[]).length + idx) + ‘)’ : ‘showDetail("market",’ + idx + ‘)’;
var dot = isClosedView ? ‘var(–green)’ : (STATUS_DOT[r.status]||‘var(–gold)’);
var tc = isClosedView ? ‘tag-green’ : (STATUS_TAG[r.status]||‘tag-gold’);
h += ‘<div class="deal-row" onclick="' + clickFn + '">’;
h += ‘<div class="deal-dot" style="background:' + dot + '"></div>’;
h += ‘<div class="deal-main">’;
h += ‘<div class="deal-name">’ + (r.property||’–’) + ‘</div>’;
if (r.buyer) h += ‘<div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:2px">→ ’ + r.buyer + ‘</div>’;
if (r.seller) h += ‘<div style="font-size:10px;color:var(--text2);margin-bottom:2px">Seller: ’ + r.seller + ‘</div>’;
if (isClosedView) {
h += ‘<div class="deal-sub"><span>’ + fmtSF(r.sf) + ’ SF</span>’;
if (r.closeDate) {
var months = [‘Jan’,‘Feb’,‘Mar’,‘Apr’,‘May’,‘Jun’,‘Jul’,‘Aug’,‘Sep’,‘Oct’,‘Nov’,‘Dec’];
var dParts = r.closeDate.split(’-’);
var dFmt = r.closeDate;
if (dParts.length >= 2) { var mo = parseInt(dParts[1],10); dFmt = (months[mo-1]||’’) + ’ ’ + dParts[0]; }
h += ‘<span style="color:var(--text3)"> · </span><span>’ + dFmt + ‘</span>’;
}
h += ‘</div></div>’;
h += ‘<div class="deal-right">’;
if (r.salePrice) h += ‘<div class="deal-price" style="font-size:15px">’ + r.salePrice + ‘</div>’;
if (r.psf) h += ‘<div class="deal-price-sub">’ + r.psf + ’ PSF</div>’;
if (r.capRate) h += ‘<div class="deal-price-sub">’ + r.capRate + ’ cap</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
} else {
h += ‘<div class="deal-sub"><span>’ + fmtSF(r.sf) + ’ SF</span>’;
if (r.capRate) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.capRate + ’ cap</span>’;
h += ‘</div>’;
h += ‘<div class="deal-sub" style="margin-top:2px">’;
h += ‘<span class="tag ' + tc + '">’ + (r.status||‘JLL’) + ‘</span>’;
if (r.walt) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.walt + ‘yr WALT</span>’;
if (r.occupancy) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.occupancy + ’ occ</span>’;
h += ‘</div></div>’;
h += ‘<div class="deal-right">’;
if (r.salePrice) { h += ‘<div class="deal-price" style="font-size:15px">’ + r.salePrice + ‘</div>’; }
if (r.psf) h += ‘<div class="deal-price-sub">’ + r.psf + ’ PSF</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
}
});
if (!isClosedView && data.length > shown) h += lmBtn(‘market’, data.length - shown);
setHTML(‘market-list’, h);
document.getElementById(‘badge-market’).textContent = S.market.length || ‘’;
}

function renderSold() {
var f = S.filters.sold;
var data = S.sold.filter(function(r) {
if (f.state && r.state !== f.state) return false;
return q(r);
});
data.sort(function(a,b) {
try { return new Date(b.closeDate) - new Date(a.closeDate); } catch(e) { return 0; }
});
var caps = data.map(function(r){ return parseFloat(r.capRate)||0; }).filter(function(v){ return v>0; });
var avgCap = caps.length ? (caps.reduce(function(a,b){return a+b;},0)/caps.length).toFixed(2) : ‘–’;
var psfs = data.map(function(r){ return parseFloat(String(r.psf||’’).replace(/[^0-9.]/g,’’))||0; }).filter(function(v){ return v>0; });
var avgPsf = psfs.length ? (psfs.reduce(function(a,b){return a+b;},0)/psfs.length).toFixed(0) : ‘–’;
setHTML(‘sold-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + data.length + ‘</div><div class="stat-lbl">Sales</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + (avgCap !== ‘–’ ? avgCap + ‘%’ : ‘–’) + ‘</div><div class="stat-lbl">Avg Cap</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + (avgPsf !== ‘–’ ? ‘$’ + avgPsf : ‘–’) + ‘</div><div class="stat-lbl">Avg PSF</div></div>’
);
filterChips(‘sold-filters’, [
{ label:‘All’, active:!f.state, fn:“setFilter(‘sold’,‘state’,’’)” },
{ label:‘MA’, active:f.state===‘MA’, fn:“setFilter(‘sold’,‘state’,‘MA’)” },
{ label:‘CT’, active:f.state===‘CT’, fn:“setFilter(‘sold’,‘state’,‘CT’)” },
{ label:‘NH’, active:f.state===‘NH’, fn:“setFilter(‘sold’,‘state’,‘NH’)” },
{ label:‘Other’, active:f.state===‘Other’, fn:“setFilter(‘sold’,‘state’,‘Other’)” }
]);
if (!data.length) { setHTML(‘sold-list’, emptyState(’✓’,‘No Sales’,‘Add sale comps to get started’)); return; }
var shown = S.shown.sold || S.PAGE;
var h = ‘’;
data.slice(0, shown).forEach(function(r) {
var idx = S.sold.indexOf(r);
h += ‘<div class="deal-row" onclick="showDetail(&quot;sold&quot;,' + idx + ')">’;
h += ‘<div class="deal-dot" style="background:var(--green)"></div>’;
h += ‘<div class="deal-main">’;
h += ‘<div class="deal-name">’ + (r.property || ‘–’) + ‘</div>’;
if (r.buyer) h += ‘<div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:2px">→ ’ + r.buyer + ‘</div>’;
if (r.seller) h += ‘<div style="font-size:10px;color:var(--text2);margin-bottom:2px">Seller: ’ + r.seller + ‘</div>’;
h += ‘<div class="deal-sub"><span>’ + (r.market || ‘–’) + ‘</span><span style="color:var(--text3)"> · </span><span>’ + fmtSF(r.sf) + ’ SF</span>’;
if (r.closeDate) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.closeDate + ‘</span>’;
h += ‘</div></div>’;
h += ‘<div class="deal-right"><div class="deal-price">’ + (r.salePrice || ‘–’) + ‘</div>’;
if (r.psf) h += ‘<div class="deal-price-sub">’ + r.psf + ’ PSF</div>’;
if (r.capRate) h += ‘<div class="deal-price-sub">’ + r.capRate + ’ cap</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
});
if (data.length > shown) h += lmBtn(‘sold’, data.length - shown);
setHTML(‘sold-list’, h);
document.getElementById(‘badge-sold’).textContent = S.sold.length || ‘’;
}

function renderLC() {
var f = S.filters.leasecomps;
var LC_MARKETS = [‘North’,‘South’,‘West’,‘NH’,‘Worcester County’];
var data = S.leasecomps.filter(function(r) {
if (f.market && r.market !== f.market) return false;
if (f.type && r.buildingClass !== f.type) return false;
return q(r);
});
var rents = data.map(function(r){ return parseFloat(String(r.askingRent||’’).replace(/[^0-9.]/g,’’))||0; }).filter(function(v){ return v>0; });
var avg = rents.length ? (rents.reduce(function(a,b){return a+b;},0)/rents.length).toFixed(2) : ‘–’;
var jll = data.filter(function(r){ return r.llRep===‘JLL’||r.tRep===‘JLL’; }).length;
setHTML(‘lc-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + data.length + ‘</div><div class="stat-lbl">Total</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + (avg!==’–’?’$’+avg:’–’) + ‘</div><div class="stat-lbl">Avg Rent PSF</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + jll + ‘</div><div class="stat-lbl">JLL Deals</div></div>’
);
var chips = [{ label:‘All Markets’, active:!f.market, fn:“setFilter(‘leasecomps’,‘market’,’’)” }];
LC_MARKETS.forEach(function(m) { chips.push({ label:m, active:f.market===m, fn:“setFilter(‘leasecomps’,‘market’,’” + m + “’)” }); });
chips.push({ div:true });
chips.push({ label:‘All Types’, active:!f.type, fn:“setFilter(‘leasecomps’,‘type’,’’)” });
var types = [‘New Lease’,‘Renewal’,‘Renewal/Expansion’,‘Expansion’];
types.forEach(function(t) { chips.push({ label:t===‘Renewal/Expansion’?‘Renewal/Exp’:t, active:f.type===t, fn:“setFilter(‘leasecomps’,‘type’,’” + t + “’)” }); });
filterChips(‘lc-filters’, chips);
if (!data.length) { setHTML(‘lc-list’, emptyState(’═’,‘No Comps’,‘Adjust filters or search’)); return; }
var shown = S.shown.leasecomps || S.PAGE;
var TYPE_DOT = {‘New Lease’:‘var(–green)’,‘Renewal’:‘var(–blue)’,‘Renewal/Expansion’:‘var(–gold)’,‘Expansion’:‘var(–amber)’,‘Sublease’:‘var(–red)’};
var TYPE_TAG = {‘New Lease’:‘tag-green’,‘Renewal’:‘tag-blue’,‘Renewal/Expansion’:‘tag-gold’,‘Expansion’:‘tag-amber’,‘Sublease’:‘tag-red’};
var h = ‘’;
data.slice(0, shown).forEach(function(r) {
var idx = S.leasecomps.indexOf(r);
var rent = parseFloat(String(r.askingRent||’’).replace(/[^0-9.]/g,’’))||0;
var rentColor = rent>=18 ? ‘var(–green)’ : rent>=14 ? ‘var(–gold)’ : ‘var(–text)’;
var dot = TYPE_DOT[r.buildingClass] || ‘var(–text3)’;
var tc = TYPE_TAG[r.buildingClass] || ‘tag-muted’;
var isJLL = r.llRep===‘JLL’||r.tRep===‘JLL’;
h += ‘<div class="deal-row" onclick="showLCDetail(' + idx + ')">’;
h += ‘<div class="deal-dot" style="background:' + dot + '"></div>’;
h += ‘<div class="deal-main">’;
h += ‘<div class="deal-name">’ + (r.tenants||‘Unknown Tenant’) + ‘</div>’;
h += ‘<div class="deal-sub"><span>’ + (r.property||’–’) + ‘</span>’;
if (isJLL) h += ‘<span style="color:var(--text3)"> · </span><span style="color:var(--gold)">JLL</span>’;
h += ‘</div>’;
h += ‘<div class="deal-sub" style="margin-top:2px"><span style="color:var(--text3)">’ + (r.market||’’) + ‘</span>’;
if (r.buildingClass) h += ‘<span style="color:var(--text3)"> · </span><span class="tag ' + tc + '">’ + r.buildingClass + ‘</span>’;
if (r.leaseterm) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.leaseterm + ‘</span>’;
h += ‘</div></div>’;
h += ‘<div class="deal-right"><div class="deal-price" style="color:' + rentColor + '">’ + (r.askingRent||’–’) + ‘</div>’;
h += ‘<div class="deal-price-sub">’ + fmtSF(r.sf) + ’ SF</div>’;
if (r.closeDate) h += ‘<div class="deal-price-sub">’ + r.closeDate + ‘</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
});
if (data.length > shown) h += lmBtn(‘leasecomps’, data.length - shown);
setHTML(‘lc-list’, h);
document.getElementById(‘badge-leasecomps’).textContent = S.leasecomps.length > 99 ? ‘99+’ : S.leasecomps.length;
}

function renderComp() {
var f = S.filters.comp;
var data = S.compmarket.filter(function(r) {
if (f.kind === ‘Sold’) return false;
return q(r);
}).map(function(r){ return {r:r, kind:‘In Market’, src:‘compmarket’, idx:S.compmarket.indexOf(r)}; });
setHTML(‘comp-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + S.compmarket.length + ‘</div><div class="stat-lbl">In Market</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + S.compsold.length + ‘</div><div class="stat-lbl">Sold</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + data.length + ‘</div><div class="stat-lbl">Showing</div></div>’
);
filterChips(‘comp-filters’, [
{ label:‘All’, active:!f.kind, fn:“setFilter(‘comp’,‘kind’,’’)” },
{ label:‘In Market’, active:f.kind===‘In Market’, fn:“setFilter(‘comp’,‘kind’,‘In Market’)” }
]);
if (!data.length) { setHTML(‘comp-list’, emptyState(’⊕’,‘No Competitor Deals’,‘Add competitor activity to track’)); return; }
var shown = S.shown.comp || S.PAGE;
var h = ‘’;
data.slice(0, shown).forEach(function(item) {
var r = item.r;
h += ‘<div class="deal-row" onclick="showDetail(&quot;' + item.src + '&quot;,' + item.idx + ')">’;
h += ‘<div class="deal-dot" style="background:var(--amber)"></div>’;
h += ‘<div class="deal-main">’;
h += ‘<div class="deal-name">’ + (r.property||’–’) + ‘</div>’;
if (r.buyer) h += ‘<div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:2px">→ ’ + r.buyer + ‘</div>’;
if (r.broker) h += ‘<div style="font-size:10px;color:var(--text2);margin-bottom:2px">Broker: ’ + r.broker + ‘</div>’;
if (r.seller) h += ‘<div style="font-size:10px;color:var(--text2);margin-bottom:2px">Seller: ’ + r.seller + ‘</div>’;
h += ‘<div class="deal-sub"><span>’ + (r.market||’–’) + ‘</span><span style="color:var(--text3)"> · </span><span>’ + fmtSF(r.sf) + ’ SF</span>’;
h += ‘<span style="color:var(--text3)"> · </span><span class="tag tag-amber">In Market</span>’;
h += ‘</div></div>’;
h += ‘<div class="deal-right"><div class="deal-price">’ + (r.salePrice||’–’) + ‘</div>’;
if (r.psf) h += ‘<div class="deal-price-sub">’ + r.psf + ’ PSF</div>’;
if (r.capRate) h += ‘<div class="deal-price-sub">’ + r.capRate + ’ cap</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
});
if (data.length > shown) h += lmBtn(‘comp’, data.length - shown);
setHTML(‘comp-list’, h);
var total = S.compmarket.length + S.compsold.length;
document.getElementById(‘badge-comp’).textContent = total || ‘’;
}

function renderOffMkt() {
var f = S.filters.offmarket || { status: ‘’ };
var pipeline = (typeof PIPELINE_DEALS !== ‘undefined’) ? PIPELINE_DEALS : [];
var manual = S.offmarket.filter(q);
var allData = pipeline.filter(q).concat(manual);

var ORDER = [‘UNDER CONTRACT’,‘OFF MARKET’,‘IN THE MARKET’,‘BOV’,‘COMING TO MARKET’,‘TRACKING’];
var BOV_STATUSES = [‘IN PROGRESS’,‘RECENTLY DELIVERED’];

var chips = [{ label:‘All’, active:!f.status, fn:“setFilter(‘offmarket’,‘status’,’’)” }];
var ucCount = allData.filter(function(r){ return r.status===‘UNDER CONTRACT’; }).length;
if (ucCount) chips.push({ label:‘UC’, active:f.status===‘UNDER CONTRACT’, fn:“setFilter(‘offmarket’,‘status’,‘UNDER CONTRACT’)” });
var omCount = allData.filter(function(r){ return r.status===‘OFF MARKET’; }).length;
if (omCount) chips.push({ label:‘Off Mkt’, active:f.status===‘OFF MARKET’, fn:“setFilter(‘offmarket’,‘status’,‘OFF MARKET’)” });
var imCount = allData.filter(function(r){ return r.status===‘IN THE MARKET’; }).length;
if (imCount) chips.push({ label:‘In Mkt’, active:f.status===‘IN THE MARKET’, fn:“setFilter(‘offmarket’,‘status’,‘IN THE MARKET’)” });
var bovCount = allData.filter(function(r){ return BOV_STATUSES.indexOf(r.status)!==-1; }).length;
if (bovCount) chips.push({ label:‘BOV’, active:f.status===‘BOV’, fn:“setFilter(‘offmarket’,‘status’,‘BOV’)” });
var ctmCount = allData.filter(function(r){ return r.status===‘COMING TO MARKET’; }).length;
if (ctmCount) chips.push({ label:‘Coming’, active:f.status===‘COMING TO MARKET’, fn:“setFilter(‘offmarket’,‘status’,‘COMING TO MARKET’)” });
var tCount = allData.filter(function(r){ return r.status===‘TRACKING’; }).length;
if (tCount) chips.push({ label:‘Tracking’, active:f.status===‘TRACKING’, fn:“setFilter(‘offmarket’,‘status’,‘TRACKING’)” });
filterChips(‘off-filters’, chips);

var data;
if (f.status === ‘BOV’) {
data = allData.filter(function(r){ return BOV_STATUSES.indexOf(r.status)!==-1; });
} else if (f.status) {
data = allData.filter(function(r){ return r.status===f.status; });
} else {
data = allData;
}

var uc = allData.filter(function(r){ return r.status===‘UNDER CONTRACT’; }).length;
var active = allData.filter(function(r){ return [‘IN THE MARKET’,‘COMING TO MARKET’,‘IN PROGRESS’,‘OFF MARKET’].indexOf(r.status)!==-1; }).length;
setHTML(‘off-stats-bar’,
‘<div class="stat-cell"><div class="stat-val">’ + allData.length + ‘</div><div class="stat-lbl">Total</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + uc + ‘</div><div class="stat-lbl">Under Contract</div></div>’ +
‘<div class="stat-cell"><div class="stat-val">’ + active + ‘</div><div class="stat-lbl">Active</div></div>’
);

if (!data.length) { setHTML(‘off-list’, emptyState(’◇’,‘No Pipeline Deals’,’’)); return; }

var SDOT = {‘UNDER CONTRACT’:‘var(–green)’,‘IN THE MARKET’:‘var(–gold)’,‘OFF MARKET’:‘var(–purple)’,‘COMING TO MARKET’:‘var(–blue)’,‘IN PROGRESS’:‘var(–amber)’,‘RECENTLY DELIVERED’:‘var(–text2)’,‘TRACKING’:‘var(–text3)’};
var STC  = {‘UNDER CONTRACT’:‘tag-green’,‘IN THE MARKET’:‘tag-gold’,‘OFF MARKET’:‘tag-purple’,‘COMING TO MARKET’:‘tag-blue’,‘IN PROGRESS’:‘tag-amber’,‘RECENTLY DELIVERED’:‘tag-muted’,‘TRACKING’:‘tag-muted’};

var h = ‘’;

if (f.status) {
data.forEach(function(r) {
var gidx = allData.indexOf(r);
var dot = SDOT[r.status]||‘var(–text3)’;
var tc = STC[r.status]||‘tag-muted’;
h += buildPipelineRow(r, gidx, dot, tc);
});
} else {
var groups = {};
allData.forEach(function(r) { var s=r.status||‘OTHER’; if(!groups[s])groups[s]=[]; groups[s].push(r); });
ORDER.forEach(function(s) {
var groupRows;
if (s === ‘BOV’) {
groupRows = allData.filter(function(r){ return BOV_STATUSES.indexOf(r.status)!==-1; });
} else {
groupRows = groups[s] || [];
}
if (!groupRows.length) return;
h += ‘<div style="padding:10px 14px 6px;font-size:10px;letter-spacing:2px;color:var(--text2);text-transform:uppercase;font-weight:600;background:var(--surface2);border-top:1px solid var(--border);border-bottom:1px solid var(--border2)">’ + s + ’ <span style="color:var(--gold);font-family:Bebas Neue,sans-serif;font-size:16px;letter-spacing:1px;vertical-align:middle">’ + groupRows.length + ‘</span></div>’;
groupRows.forEach(function(r) {
var gidx = allData.indexOf(r);
var dot = SDOT[r.status]||‘var(–text3)’;
var tc = STC[r.status]||‘tag-muted’;
h += buildPipelineRow(r, gidx, dot, tc);
});
});
}

setHTML(‘off-list’, h);
document.getElementById(‘badge-offmarket’).textContent = allData.length || ‘’;
}

function buildPipelineRow(r, gidx, dot, tc) {
var h = ‘’;
h += ‘<div class="deal-row" onclick="showPipelineDetail(' + gidx + ')">’;
h += ‘<div class="deal-dot" style="background:' + dot + '"></div>’;
h += ‘<div class="deal-main">’;
h += ‘<div class="deal-name">’ + (r.property||’–’) + ‘</div>’;
if (r.buyer) h += ‘<div style="font-size:11px;font-weight:600;color:var(--blue);margin-bottom:2px">→ ’ + r.buyer + ‘</div>’;
if (r.seller) h += ‘<div style="font-size:10px;color:var(--text2);margin-bottom:2px">Seller: ’ + r.seller + ‘</div>’;
h += ‘<div class="deal-sub"><span>’ + fmtSF(r.sf) + ’ SF</span>’;
if (r.capRate) h += ‘<span style="color:var(--text3)"> · </span><span>’ + r.capRate + ’ cap</span>’;
h += ‘</div>’;
h += ‘<div class="deal-sub" style="margin-top:2px"><span class="tag ' + tc + '">’ + (r.status||’–’) + ‘</span>’;
if (r.lead) h += ‘<span style="color:var(--text3)"> · </span><span style="color:var(--text2)">’ + r.lead + ‘</span>’;
h += ‘</div></div>’;
h += ‘<div class="deal-right">’;
if (r.salePrice) { h += ‘<div class="deal-price" style="font-size:15px">’ + r.salePrice + ‘</div>’; }
if (r.psf) h += ‘<div class="deal-price-sub">’ + r.psf + ’ PSF</div>’;
h += ‘</div><div class="deal-chevron">›</div></div>’;
return h;
}

function showPipelineDetail(idx) {
var pipeline = (typeof PIPELINE_DEALS !== ‘undefined’) ? PIPELINE_DEALS : [];
var allData = pipeline.concat(S.offmarket);
var r = allData[idx];
if (!r) return;
document.getElementById(‘sheet-title’).textContent = r.property || ‘–’;
var h = ‘<div class="hl-row">’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + (r.salePrice||’–’) + ‘</div><div class="hl-label">Price</div></div>’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + (r.psf||’–’) + ‘</div><div class="hl-label">PSF</div></div>’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + (r.capRate||’–’) + ‘</div><div class="hl-label">Cap Rate</div></div>’;
h += ‘</div>’;
h += ‘<div class="sheet-sec" style="margin-top:16px"><div class="sheet-sec-lbl">Details</div><div class="kv-grid">’;
h += ‘<div style="grid-column:1/-1"><div class="kv-label">Property</div><div class="kv-value">’ + (r.property||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">SF</div><div class="kv-value">’ + fmtSF(r.sf) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Status</div><div class="kv-value">’ + (r.status||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Buyer</div><div class="kv-value">’ + (r.buyer||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Seller / Client</div><div class="kv-value">’ + (r.seller||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Lead</div><div class="kv-value">’ + (r.lead||’–’) + ‘</div></div>’;
if (r.notes) h += ‘<div style="grid-column:1/-1"><div class="kv-label">Notes</div><div class="kv-value" style="font-size:12px;color:var(--text2);line-height:1.5">’ + r.notes + ‘</div></div>’;
h += ‘</div></div>’;
setHTML(‘sheet-body’, h);
openSheet();
}

function setFilter(tab, key, val) {
S.filters[tab][key] = val;
S.shown[tab] = S.PAGE;
renderTab(tab);
}

function showDetail(sec, idx) {
var r = S[sec][idx];
if (!r) return;
document.getElementById(‘sheet-title’).textContent = r.property || r.tenants || ‘–’;
var fields = {
market: [[‘Asking Price’,‘salePrice’,true],[‘PSF’,‘psf’,true],[‘Cap Rate’,‘capRate’],[‘WALT’,‘walt’],[‘Occupancy’,‘occupancy’],[‘Status’,‘status’],[‘SF’,‘sf’],[‘Market’,‘market’],[‘Bldg Class’,‘buildingClass’],[‘Year Built’,‘yearBuilt’],[‘Clear Height’,‘clearHeight’],[‘Buyer’,‘buyer’],[‘Seller’,‘seller’],[‘Tenants’,‘tenants’],[‘Notes’,‘notes’]],
sold: [[‘Sale Price’,‘salePrice’,true],[‘PSF’,‘psf’,true],[‘Cap Rate’,‘capRate’],[‘WALT’,‘walt’],[‘Occupancy’,‘occupancy’],[‘Close Date’,‘closeDate’],[‘SF’,‘sf’],[‘Market’,‘market’],[‘Bldg Class’,‘buildingClass’],[‘Year Built’,‘yearBuilt’],[‘Clear Height’,‘clearHeight’],[‘Buyer’,‘buyer’],[‘Seller’,‘seller’],[‘Tenants’,‘tenants’],[‘Notes’,‘notes’]],
compmarket: [[‘Asking Price’,‘salePrice’,true],[‘PSF’,‘psf’,true],[‘Cap Rate’,‘capRate’],[‘WALT’,‘walt’],[‘Status’,‘status’],[‘SF’,‘sf’],[‘Market’,‘market’],[‘Buyer’,‘buyer’],[‘Broker’,‘broker’],[‘Seller’,‘seller’],[‘Tenants’,‘tenants’],[‘Notes’,‘notes’]],
compsold: [[‘Sale Price’,‘salePrice’,true],[‘PSF’,‘psf’,true],[‘Cap Rate’,‘capRate’],[‘WALT’,‘walt’],[‘Sale Date’,‘closeDate’],[‘SF’,‘sf’],[‘Market’,‘market’],[‘Buyer’,‘buyer’],[‘Seller’,‘seller’],[‘Notes’,‘notes’]],
offmarket: [[‘Asking Price’,‘salePrice’,true],[‘PSF’,‘psf’,true],[‘Cap Rate’,‘capRate’],[‘WALT’,‘walt’],[‘Occupancy’,‘occupancy’],[‘SF’,‘sf’],[‘Market’,‘market’],[‘Bldg Class’,‘buildingClass’],[‘Year Built’,‘yearBuilt’],[‘Clear Height’,‘clearHeight’],[‘Buyer’,‘buyer’],[‘Seller’,‘seller’],[‘Notes’,‘notes’]]
};
var flds = fields[sec] || [];
var big = flds.filter(function(f){ return f[2]; });
var rest = flds.filter(function(f){ return !f[2]; });
var h = ‘’;
if (big.length) {
h += ‘<div class="hl-row">’;
big.forEach(function(f) { h += ‘<div class="hl-cell"><div class="hl-val">’ + (r[f[1]]||’–’) + ‘</div><div class="hl-label">’ + f[0] + ‘</div></div>’; });
if (big.length === 1 && rest.length) { var x = rest[0]; h += ‘<div class="hl-cell"><div class="hl-val" style="font-size:14px">’ + (r[x[1]]||’–’) + ‘</div><div class="hl-label">’ + x[0] + ‘</div></div>’; }
h += ‘</div>’;
}
var stTags = {‘BOM’:‘tag-green’,‘Under Contract’:‘tag-amber’,‘Marketed’:‘tag-blue’,‘Best & Final’:‘tag-red’,‘LOI’:‘tag-gold’,‘Awarded’:‘tag-green’,‘Marketing’:‘tag-blue’};
h += ‘<div class="sheet-sec" style="margin-top:16px"><div class="sheet-sec-lbl">Details</div><div class="kv-grid">’;
rest.forEach(function(f) {
var val = r[f[1]] || ‘–’;
if (f[1]===‘status’ && val!==’–’) val = ‘<span class="tag ' + (stTags[val]||'tag-gold') + '">’ + val + ‘</span>’;
if (f[1]===‘sf’ && val!==’–’) val = fmtSF(val) + ’ SF’;
var full = f[1]===‘notes’||f[1]===‘tenants’;
h += ‘<div’ + (full?’ style=“grid-column:1/-1”’:’’) + ‘><div class="kv-label">’ + f[0] + ‘</div><div class="kv-value">’ + val + ‘</div></div>’;
});
h += ‘</div></div>’;
setHTML(‘sheet-body’, h);
openSheet();
}

function showLCDetail(idx) {
var r = S.leasecomps[idx];
if (!r) return;
document.getElementById(‘sheet-title’).textContent = r.tenants || r.property || ‘–’;
var TYPE_TAG = {‘New Lease’:‘tag-green’,‘Renewal’:‘tag-blue’,‘Renewal/Expansion’:‘tag-gold’,‘Expansion’:‘tag-amber’,‘Sublease’:‘tag-red’};
var tc = TYPE_TAG[r.buildingClass] || ‘tag-muted’;
var h = ‘<div class="hl-row">’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + (r.askingRent||’–’) + ‘</div><div class="hl-label">Y1 Rent PSF</div></div>’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + fmtSF(r.sf) + ‘</div><div class="hl-label">SF</div></div>’;
h += ‘<div class="hl-cell"><div class="hl-val">’ + (r.leaseterm||’–’) + ‘</div><div class="hl-label">Term</div></div>’;
h += ‘</div>’;
h += ‘<div class="sheet-sec" style="margin-top:16px"><div class="sheet-sec-lbl">Lease Economics</div><div class="kv-grid">’;
h += ‘<div><div class="kv-label">Lease Type</div><div class="kv-value">’ + (r.nnn||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">TIA (PSF)</div><div class="kv-value">’ + (r.tia?’$’+r.tia:’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Escalation</div><div class="kv-value">’ + (r.escalation||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Free Rent</div><div class="kv-value">’ + (r.freeRent||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Transaction</div><div class="kv-value"><span class="tag ' + tc + '">’ + (r.buildingClass||’–’) + ‘</span></div></div>’;
h += ‘<div><div class="kv-label">Sign Date</div><div class="kv-value">’ + (r.closeDate||’–’) + ‘</div></div>’;
h += ‘</div></div>’;
h += ‘<div class="sheet-sec"><div class="sheet-sec-lbl">Property</div><div class="kv-grid">’;
h += ‘<div style="grid-column:1/-1"><div class="kv-label">Address</div><div class="kv-value">’ + (r.property||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Market</div><div class="kv-value">’ + (r.market||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Landlord</div><div class="kv-value">’ + (r.landlord||’–’) + ‘</div></div>’;
h += ‘</div></div>’;
h += ‘<div class="sheet-sec"><div class="sheet-sec-lbl">Brokers</div><div class="kv-grid">’;
h += ‘<div><div class="kv-label">LL Rep</div><div class="kv-value" style="' + (r.llRep==='JLL'?'color:var(--gold);font-weight:600':'') + '">’ + (r.llRep||’–’) + ‘</div></div>’;
h += ‘<div><div class="kv-label">Tenant Rep</div><div class="kv-value" style="' + (r.tRep==='JLL'?'color:var(--gold);font-weight:600':'') + '">’ + (r.tRep||’–’) + ‘</div></div>’;
h += ‘</div></div>’;
if (r.notes) h += ‘<div class="sheet-sec"><div class="sheet-sec-lbl">Notes</div><div style="font-size:12px;color:var(--text2);line-height:1.6">’ + r.notes + ‘</div></div>’;
setHTML(‘sheet-body’, h);
openSheet();
}

function openSheet() {
document.getElementById(‘sheet-backdrop’).classList.add(‘open’);
document.getElementById(‘bottom-sheet’).classList.add(‘open’);
}
function closeSheet() {
document.getElementById(‘sheet-backdrop’).classList.remove(‘open’);
document.getElementById(‘bottom-sheet’).classList.remove(‘open’);
}

var ADD_FIELDS = {
market: [{id:‘property’,label:‘Property’},{id:‘market’,label:‘Market’},{id:‘sf’,label:‘SF’},{id:‘salePrice’,label:‘Asking Price’},{id:‘psf’,label:‘PSF’},{id:‘capRate’,label:‘Cap Rate’},{id:‘walt’,label:‘WALT’},{id:‘occupancy’,label:‘Occupancy’},{id:‘buyer’,label:‘Buyer’},{id:‘seller’,label:‘Seller’},{id:‘status’,label:‘Status’,type:‘select’,options:[‘Marketing’,‘Awarded’,‘BOM’,‘Under Contract’,‘Marketed’,‘Best & Final’,‘LOI’]},{id:‘notes’,label:‘Notes’,type:‘textarea’}],
leasecomps: [{id:‘tenants’,label:‘Tenant’},{id:‘property’,label:‘Address’},{id:‘market’,label:‘Market’},{id:‘sf’,label:‘SF’},{id:‘askingRent’,label:‘Y1 Rent PSF’},{id:‘buildingClass’,label:‘Type’,type:‘select’,options:[‘New Lease’,‘Renewal’,‘Renewal/Expansion’,‘Expansion’,‘Sublease’]},{id:‘leaseterm’,label:‘Term’},{id:‘escalation’,label:‘Escalation’},{id:‘freeRent’,label:‘Free Rent’},{id:‘tia’,label:‘TIA PSF’},{id:‘landlord’,label:‘Landlord’},{id:‘llRep’,label:‘LL Rep’},{id:‘tRep’,label:‘Tenant Rep’},{id:‘closeDate’,label:‘Sign Date’,type:‘date’},{id:‘notes’,label:‘Notes’,type:‘textarea’}],
sold: [{id:‘property’,label:‘Property’},{id:‘market’,label:‘Market’},{id:‘state’,label:‘State’,type:‘select’,options:[‘MA’,‘CT’,‘NH’,‘Other’]},{id:‘sf’,label:‘SF’},{id:‘salePrice’,label:‘Sale Price’},{id:‘psf’,label:‘PSF’},{id:‘capRate’,label:‘Cap Rate’},{id:‘walt’,label:‘WALT’},{id:‘occupancy’,label:‘Occupancy’},{id:‘buyer’,label:‘Buyer’},{id:‘seller’,label:‘Seller’},{id:‘closeDate’,label:‘Close Date’,type:‘date’},{id:‘notes’,label:‘Notes’,type:‘textarea’}],
comp: [{id:‘property’,label:‘Property’},{id:‘market’,label:‘Market’},{id:‘sf’,label:‘SF’},{id:‘salePrice’,label:‘Price’},{id:‘psf’,label:‘PSF’},{id:‘capRate’,label:‘Cap Rate’},{id:‘buyer’,label:‘Buyer’},{id:‘broker’,label:‘Broker/Firm’},{id:‘seller’,label:‘Seller’},{id:‘notes’,label:‘Notes’,type:‘textarea’}],
offmarket: [{id:‘property’,label:‘Property’},{id:‘market’,label:‘Market’},{id:‘sf’,label:‘SF’},{id:‘salePrice’,label:‘Asking Price’},{id:‘psf’,label:‘PSF’},{id:‘capRate’,label:‘Cap Rate’},{id:‘walt’,label:‘WALT’},{id:‘occupancy’,label:‘Occupancy’},{id:‘buyer’,label:‘Buyer’},{id:‘seller’,label:‘Seller’},{id:‘status’,label:‘Status’,type:‘select’,options:[‘Marketing’,‘Awarded’]},{id:‘notes’,label:‘Notes’,type:‘textarea’}]
};

function openAdd() {
var t = S.currentTab;
document.getElementById(‘add-section-sel’).value = (t === ‘intel’) ? ‘market’ : t;
renderAddForm();
document.getElementById(‘add-backdrop’).classList.add(‘open’);
document.getElementById(‘add-sheet’).classList.add(‘open’);
}
function closeAdd() {
document.getElementById(‘add-backdrop’).classList.remove(‘open’);
document.getElementById(‘add-sheet’).classList.remove(‘open’);
}
function renderAddForm() {
var sec = document.getElementById(‘add-section-sel’).value;
var flds = ADD_FIELDS[sec] || [];
var h = ‘’;
flds.forEach(function(f) {
h += ‘<div class="form-group"><label class="form-label">’ + f.label + ‘</label>’;
if (f.type === ‘select’) {
h += ‘<select class="form-select" id="af-' + f.id + '"><option value="">– Select –</option>’;
f.options.forEach(function(o) { h += ‘<option value="' + o + '">’ + o + ‘</option>’; });
h += ‘</select>’;
} else if (f.type === ‘textarea’) {
h += ‘<textarea class="form-input" id="af-' + f.id + '" rows="3" style="resize:none"></textarea>’;
} else {
h += ‘<input class="form-input" type="' + (f.type||'text') + '" id="af-' + f.id + '">’;
}
h += ‘</div>’;
});
setHTML(‘add-form’, h);
}
function saveEntry() {
var sec = document.getElementById(‘add-section-sel’).value;
var flds = ADD_FIELDS[sec] || [];
var entry = { _added: new Date().toISOString() };
flds.forEach(function(f) {
var el = document.getElementById(‘af-’ + f.id);
entry[f.id] = el ? el.value.trim() : ‘’;
});
if (sec === ‘comp’) {
S.compmarket.push(entry);
} else {
S[sec].push(entry);
}
closeAdd();
saveToStorage();
renderTab(S.currentTab);
}

var INTEL = {
vacancy:‘8.3%’, avgRent:’$15.19’, ytdAbs:‘450K SF’,
submarkets:[
{name:‘Urban’,sub:‘17.1M SF - 203 props’,rent:’$33.87’,vac:7.0},
{name:‘North’,sub:‘44.8M SF - 484 props’,rent:’$18.33’,vac:6.3},
{name:‘South’,sub:‘86.1M SF - 765 props’,rent:’$13.48’,vac:10.4},
{name:‘West’,sub:‘24.6M SF - 205 props’,rent:’$12.81’,vac:5.3},
{name:‘Worcester County’,sub:‘45.6M SF - 429 props’,rent:’$12.46’,vac:10.0},
{name:‘S. New Hampshire’,sub:‘39.3M SF - 364 props’,rent:’$12.35’,vac:6.2}
],
specUC:[
{name:‘Charlton Commerce Center’,city:‘Charlton’,mkt:‘Worcester Co.’,dev:‘GFI Partners’,sf:‘1,197,000’,lsd:‘0%’,del:‘Q1 2027’},
{name:‘Trident Logistics Center’,city:‘Revere’,mkt:‘Urban’,dev:‘Link / Saracen’,sf:‘367,400’,lsd:‘0%’,del:‘Q4 2025’},
{name:‘Maple Street Bldg 1’,city:‘Stoughton’,mkt:‘South’,dev:‘Brookfield Properties’,sf:‘274,827’,lsd:‘0%’,del:‘Q3 2026’},
{name:‘415 Green Street’,city:‘Marlborough’,mkt:‘West’,dev:‘Lincoln Property Co’,sf:‘203,265’,lsd:‘0%’,del:‘Q2 2026’},
{name:‘440 Hartford Tpke’,city:‘Shrewsbury’,mkt:‘South’,dev:‘GFI Partners’,sf:‘133,750’,lsd:‘100%’,del:‘Q4 2025’},
{name:‘2 Commerce Drive’,city:‘Tyngsboro’,mkt:‘North’,dev:‘Marcus Partners’,sf:‘125,000’,lsd:‘0%’,del:‘Q1 2026’},
{name:‘600 Griffin Brook Dr’,city:‘Methuen’,mkt:‘North’,dev:‘RJ Kelly’,sf:‘95,700’,lsd:‘0%’,del:‘Q4 2025’},
{name:‘63 Londonderry Tpke’,city:‘Hooksett’,mkt:‘S. New Hamp.’,dev:‘Morgan Storage’,sf:‘94,800’,lsd:‘0%’,del:‘Q4 2025’},
{name:‘270 Billerica Ave’,city:‘Chelmsford’,mkt:‘North’,dev:‘DH Property Holdings’,sf:‘91,500’,lsd:‘0%’,del:‘Q4 2025’}
],
btsUC:[
{name:‘43 Steele Rd’,city:‘Hudson’,mkt:‘S. New Hamp.’,tenant:‘Target’,sf:‘1,400,000’,del:‘Q4 2026’},
{name:‘50 Centennial Dr’,city:‘Shrewsbury’,mkt:‘West’,tenant:‘UPS Distribution Center’,sf:‘845,000’,del:‘Q1 2027’},
{name:‘65 Theodore Dr’,city:‘Westminster’,mkt:‘West’,tenant:‘Home Depot Distribution’,sf:‘600,000’,del:‘Q4 2025’},
{name:‘1151 Innovation Way’,city:‘Fall River’,mkt:‘South’,tenant:‘FreezPak’,sf:‘203,397’,del:‘Q1 2026’},
{name:‘30 Burtt Rd’,city:‘Andover’,mkt:‘North’,tenant:‘Gillette Expansion’,sf:‘201,684’,del:‘Q3 2026’},
{name:‘70 Corporate Dr’,city:‘Portsmouth’,mkt:‘S. New Hamp.’,tenant:‘Lonza’,sf:‘100,000’,del:‘Q4 2025’},
{name:‘2 Creek Brook Dr’,city:‘Haverhill’,mkt:‘North’,tenant:‘Cafua / Dunkin’,sf:‘93,500’,del:‘Q4 2025’}
],
vacancies:[
{name:‘123 Gilboa Street’,city:‘Douglas’,mkt:‘West’,dev:‘CRG’,sf:‘1,102,500’,lsd:‘0%’,del:‘Q1 2024’,note:‘Largest vacant spec block in market’},
{name:‘64 Leona Dr’,city:‘Middleborough’,mkt:‘South’,dev:’’,sf:‘805,347’,lsd:‘0%’,del:‘1995’,note:‘Amazon trading paper to lease for 5 yrs - early stages’},
{name:‘27 Cross Street’,city:‘Plainville’,mkt:‘South’,dev:‘CRG’,sf:‘662,500’,lsd:‘0%’,del:‘2023’,note:‘Negotiating with 2 tenants to potentially fill the building’},
{name:‘75 Plain Street’,city:‘Hopedale’,mkt:‘South’,dev:‘GFI Partners’,sf:‘616,875’,lsd:‘0%’,del:‘2024’,note:‘Amazon HazMat contract (Maersk) allegedly getting done for full building’},
{name:‘40 Lackey Dam Road’,city:‘Uxbridge’,mkt:‘West’,dev:‘Scannell / Crow Holdings’,sf:‘607,486’,lsd:‘73%’,del:‘Q1 2023’,note:‘McKesson anchor; 27% available’},
{name:‘145 Commerce Drive’,city:‘Warwick’,mkt:‘RI’,dev:‘NorthPoint Development’,sf:‘491,500’,lsd:‘45%’,del:‘Q1 2023’,note:‘~270k SF available’},
{name:‘139 Campanelli Drive’,city:‘Uxbridge’,mkt:‘West’,dev:‘Seyon / Morgan Stanley’,sf:‘450,800’,lsd:‘0%’,del:‘Q1 2023’,note:’’},
{name:‘Maple St Bldg 3’,city:‘Stoughton’,mkt:‘South’,dev:‘Brookfield Properties’,sf:‘411,930’,lsd:‘0%’,del:‘2026’,note:‘Amazon has a lease out (possibly SSD)’},
{name:‘211 Highland Street’,city:‘E. Bridgewater’,mkt:‘South’,dev:‘Greystar’,sf:‘412,500’,lsd:‘0%’,del:‘2023’,note:‘Going to market for sale vacant’},
{name:‘35 United Drive’,city:‘W. Bridgewater’,mkt:‘South’,dev:’’,sf:‘493,000’,lsd:‘56%’,del:‘1987’,note:‘278,181 SF available’},
{name:‘50 Robert Milligan Pkwy’,city:‘Merrimack’,mkt:‘S. New Hamp.’,dev:‘Trammell Crow / Diamond’,sf:‘323,750’,lsd:‘0%’,del:‘Q1 2024’,note:’’},
{name:‘550 Forbes Blvd’,city:‘Mansfield’,mkt:‘South’,dev:’’,sf:‘222,357’,lsd:‘0%’,del:‘1988’,note:‘Trading LOIs with tenant for 50% of space’},
{name:‘900 Bedford Street’,city:‘Bridgewater’,mkt:‘South’,dev:‘Calare Properties’,sf:‘219,000’,lsd:‘18%’,del:‘2023’,note:‘40K SF leased to Red Bull’},
{name:‘152 Depot Street’,city:‘Bellingham’,mkt:‘South’,dev:‘2020 Acquisitions’,sf:‘201,545’,lsd:‘0%’,del:‘Q4 2023’,note:’’},
{name:‘Maple St Bldg 2’,city:‘Stoughton’,mkt:‘South’,dev:‘Brookfield Properties’,sf:‘193,208’,lsd:‘0%’,del:‘Q3 2025’,note:‘Newly delivered’},
{name:‘1000 Nickerson Road’,city:‘Marlborough’,mkt:‘West’,dev:‘Lincoln Property Co’,sf:‘120,600’,lsd:‘0%’,del:‘Q3 2023’,note:’’},
{name:‘21 Randolph Road’,city:‘Randolph’,mkt:‘South’,dev:‘Bluewater / Affinius’,sf:‘120,000’,lsd:‘0%’,del:‘Q1 2025’,note:’’}
],
tims:{total:‘14.4M SF’,reqs:97,median:‘70,000 SF’,
by:[[‘South’,‘4.6M SF’],[‘Multi-Market’,‘5.2M SF’],[‘North / SNH’,‘2.9M SF’],[‘West & Worcester’,‘1.3M SF’],[‘Urban’,‘365K SF’]],
names:‘Amazon, Tesla, DHL, Walmart, Pepsico, General Dynamics, PODS, Eversource, Lantheus’
},
southActivity:{
stats:{inventory:‘88.1M SF’,uc:‘930K SF’,vacancy:‘11.2%’,rent:’$13.44’},
potentiallyLeased:‘3.6M SF - 52% of total market availability’,
notable:[‘Electric Boat signed in Warwick, RI for 271K SF net new’,‘Recent big renewals: NDCP, Victory Packaging, Owens & Minors’],
requirements:[‘Eversource’,‘National Grid’,‘Woodgrain’,‘Organogenesis’,‘Modine’,‘Bossard’,‘Chex Finer Foods’,‘MEI Industrial Solutions’,‘Blue Valley Cabinets’,‘JSI Cabinetry’,‘Precision Coating’,‘TricorBraun’,‘CVS’]
}
};

function renderIntel() {
function leasedTag(pct) {
if (pct===‘100%’) return ‘<span class="pill pill-leased">100% Leased</span>’;
if (pct===‘0%’) return ‘<span class="pill pill-vacant">Vacant</span>’;
return ‘<span class="pill pill-partial">’ + pct + ’ Leased</span>’;
}
var h = ‘’;
h += ‘<div class="intel-hero"><div class="intel-hero-title">Greater Boston Industrial</div><div class="intel-hero-sub">JLL Q3 2025 Market Overview</div></div>’;
h += ‘<div class="intel-kpi-row">’;
h += ‘<div class="intel-kpi"><div class="intel-kpi-val">’ + INTEL.vacancy + ‘</div><div class="intel-kpi-lbl">Vacancy</div></div>’;
h += ‘<div class="intel-kpi"><div class="intel-kpi-val">’ + INTEL.avgRent + ‘</div><div class="intel-kpi-lbl">Avg NNN Rent</div></div>’;
h += ‘<div class="intel-kpi"><div class="intel-kpi-val">’ + INTEL.ytdAbs + ‘</div><div class="intel-kpi-lbl">YTD Absorption</div></div>’;
h += ‘</div>’;
h += ‘<div class="intel-sec"><div class="intel-sec-hdr">Submarket Snapshot <span class="intel-sec-hdr-sub">Q3 2025</span></div>’;
h += ‘<div class="intel-table">’;
h += ‘<div class="intel-table-hdr"><div class="intel-table-hdr-cell" style="flex:1">Submarket</div><div class="intel-table-hdr-cell" style="width:56px;text-align:right">Rent</div><div class="intel-table-hdr-cell" style="width:60px;text-align:right">Vacancy</div></div>’;
INTEL.submarkets.forEach(function(s) {
var vc = s.vac>9?‘var(–red)’:s.vac>7?‘var(–amber)’:‘var(–green)’;
var pct = Math.min(Math.round(s.vac/15*100),100);
h += ‘<div class="submarket-row">’;
h += ‘<div class="submarket-name">’ + s.name + ‘<br><span class="submarket-name-sub">’ + s.sub + ‘</span></div>’;
h += ‘<div class="submarket-rent">’ + s.rent + ‘</div>’;
h += ‘<div class="vac-wrap"><div class="vac-track"><div class="vac-fill" style="width:' + pct + '%;background:' + vc + '"></div></div><div class="vac-pct" style="color:' + vc + '">’ + s.vac + ‘%</div></div>’;
h += ‘</div>’;
});
h += ‘</div></div>’;
h += ‘<div class="intel-sec"><div class="intel-sec-hdr">Large Block Availabilities <span class="intel-sec-hdr-sub">Q4 2025</span></div>’;
var sa = INTEL.southActivity;
h += ‘<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border2);border-radius:8px;overflow:hidden;margin-bottom:10px">’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--gold)">’ + sa.stats.inventory + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">South Inventory</div></div>’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--amber)">’ + sa.stats.vacancy + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">South Vacancy</div></div>’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--gold)">’ + sa.stats.rent + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">Avg Asking Rent</div></div>’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--gold)">’ + sa.stats.uc + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">Under Construction</div></div>’;
h += ‘</div>’;
h += ‘<div style="background:var(--green-dim);border:1px solid rgba(52,211,153,0.25);border-radius:8px;padding:10px 12px;margin-bottom:10px">’;
h += ‘<div style="font-size:9px;letter-spacing:1px;color:var(--green);text-transform:uppercase;margin-bottom:2px">Potentially Leased</div>’;
h += ‘<div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--green)">’ + sa.potentiallyLeased + ‘</div></div>’;
sa.notable.forEach(function(n) { h += ‘<div style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:11px;color:var(--text2);line-height:1.4">► ’ + n + ‘</div>’; });
h += ‘<div style="background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;margin-bottom:12px">’;
h += ‘<div style="font-size:9px;letter-spacing:1.5px;color:var(--text3);text-transform:uppercase;margin-bottom:8px">Active 75K+ SF Requirements</div>’;
h += ‘<div style="display:flex;flex-wrap:wrap;gap:5px">’;
sa.requirements.forEach(function(r) { h += ‘<span class="pill pill-mkt">’ + r + ‘</span>’; });
h += ‘</div></div>’;
INTEL.vacancies.forEach(function(p) {
h += ‘<div class="intel-card"><div class="intel-card-top">’;
h += ‘<div class="intel-card-name">’ + p.name + ‘<br><span class="intel-card-name-sub">’ + p.city + ‘</span></div>’;
h += ‘<div class="intel-card-sf">’ + p.sf + ’ SF</div></div>’;
h += ‘<div class="intel-card-meta"><span class="pill pill-mkt">’ + p.mkt + ‘</span>’;
if (p.dev) h += ‘<span class="pill pill-dev">’ + p.dev + ‘</span>’;
h += ‘<span class="pill pill-del">’ + p.del + ‘</span>’ + leasedTag(p.lsd) + ‘</div>’;
if (p.note) h += ‘<div class="intel-card-note">’ + p.note + ‘</div>’;
h += ‘</div>’;
});
h += ‘</div>’;
h += ‘<div class="intel-sec"><div class="intel-sec-hdr">Spec Under Construction <span class="intel-sec-hdr-sub">2.6M SF Total</span></div>’;
INTEL.specUC.forEach(function(p) {
h += ‘<div class="intel-card"><div class="intel-card-top">’;
h += ‘<div class="intel-card-name">’ + p.name + ‘<br><span class="intel-card-name-sub">’ + p.city + ‘</span></div>’;
h += ‘<div class="intel-card-sf">’ + p.sf + ’ SF</div></div>’;
h += ‘<div class="intel-card-meta"><span class="pill pill-mkt">’ + p.mkt + ‘</span><span class="pill pill-dev">’ + p.dev + ‘</span><span class="pill pill-del">’ + p.del + ‘</span>’ + leasedTag(p.lsd) + ‘</div></div>’;
});
h += ‘</div>’;
h += ‘<div class="intel-sec"><div class="intel-sec-hdr">BTS Under Construction <span class="intel-sec-hdr-sub">3.6M SF Total</span></div>’;
INTEL.btsUC.forEach(function(p) {
h += ‘<div class="intel-card"><div class="intel-card-top">’;
h += ‘<div class="intel-card-name">’ + p.name + ‘<br><span class="intel-card-name-sub">’ + p.city + ‘</span></div>’;
h += ‘<div class="intel-card-sf">’ + p.sf + ’ SF</div></div>’;
h += ‘<div class="intel-card-meta"><span class="pill pill-mkt">’ + p.mkt + ‘</span><span class="pill pill-tenant">’ + p.tenant + ‘</span><span class="pill pill-del">’ + p.del + ‘</span></div></div>’;
});
h += ‘</div>’;
h += ‘<div class="intel-sec"><div class="intel-sec-hdr">Tenants In Market <span class="intel-sec-hdr-sub">’ + INTEL.tims.reqs + ’ requirements</span></div>’;
h += ‘<div style="background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:14px">’;
h += ‘<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--border2);border-radius:6px;overflow:hidden;margin-bottom:10px">’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--gold)">’ + INTEL.tims.total + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">Total Demand</div></div>’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--gold)">’ + INTEL.tims.reqs + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">Requirements</div></div>’;
h += ‘<div style="background:var(--surface2);padding:10px 8px;text-align:center"><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--gold)">’ + INTEL.tims.median + ‘</div><div style="font-size:8px;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-top:2px">Median Req</div></div>’;
h += ‘</div>’;
INTEL.tims.by.forEach(function(b) { h += ‘<div class="demand-row"><div class="demand-name">’ + b[0] + ‘</div><div class="demand-sf">’ + b[1] + ‘</div></div>’; });
h += ’<div style="margin-top:8px;font-size:9px;color:var(--text3)">Active tenants include: ’ + INTEL.tims.names + ‘</div>’;
h += ‘</div></div>’;
h += ‘<div class="intel-bottom-pad"></div>’;
setHTML(‘intel-content’, h);
}

function saveToStorage() {
try {
var d = JSON.stringify({market:S.market,sold:S.sold,compmarket:S.compmarket,compsold:S.compsold,offmarket:S.offmarket});
sessionStorage.setItem(‘dt’, d);
} catch(e) {}
}

function loadFromStorage(cb) {
try {
var d = sessionStorage.getItem(‘dt’);
if (d) {
var p = JSON.parse(d);
[‘market’,‘sold’,‘compmarket’,‘compsold’,‘offmarket’].forEach(function(k){ if(p[k]&&p[k].length) S[k]=p[k]; });
}
} catch(e) {}
cb();
}

function sortByDate(arr, field) {
return arr.slice().sort(function(a,b) {
try { return new Date(b[field]) - new Date(a[field]); } catch(e) { return 0; }
});
}

function init() {
S.leasecomps = (typeof IMPORTED_LEASE_COMPS !== ‘undefined’) ? sortByDate(IMPORTED_LEASE_COMPS, ‘closeDate’) : [];
var baseSold = (typeof SALE_COMPS !== ‘undefined’) ? SALE_COMPS : [];
var baseJLLIn = (typeof JLL_IN_MARKET !== ‘undefined’) ? JLL_IN_MARKET : [];
var baseCompIn = (typeof COMP_IN_MARKET !== ‘undefined’) ? COMP_IN_MARKET : [];

loadFromStorage(function() {
function mergeUnique(base, stored, keyField) {
var baseKeys = {};
base.forEach(function(r) { baseKeys[r[keyField||‘property’]] = true; });
var extras = stored.filter(function(r) { return !baseKeys[r[keyField||‘property’]]; });
return base.concat(extras);
}
S.sold = sortByDate(mergeUnique(baseSold, S.sold, ‘property’), ‘closeDate’);
S.market = mergeUnique(baseJLLIn, S.market, ‘property’);
S.compmarket = mergeUnique(baseCompIn, S.compmarket, ‘property’);


renderTab('market');
document.getElementById('badge-sold').textContent = S.sold.length || '';
document.getElementById('badge-leasecomps').textContent = S.leasecomps.length > 99 ? '99+' : S.leasecomps.length;
var ct = S.compmarket.length + S.compsold.length;
document.getElementById('badge-comp').textContent = ct || '';
document.getElementById('badge-offmarket').textContent = S.offmarket.length || '';
```

});
}

window.onload = function() { init(); };