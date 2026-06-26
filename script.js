/* ============================================================
   CALCITE — Glassmorphism Calculator · script.js
   CodeAlpha Frontend Internship · Task 2
   ============================================================ */

/* ── 1. STATE ──────────────────────────────────────────────── */
const state = {
  expr:      '',       // full expression string shown in top display
  prev:      null,     // previous operand (number)
  op:        null,     // pending operator: + − × ÷ xʸ
  current:   '0',      // what the user is typing right now
  result:    null,     // last computed result
  freshResult: false,  // true just after = so next digit starts fresh
  isDeg:     true,     // DEG vs RAD for trig
  history:   [],       // [{expr, result}]
};

/* ── 2. DOM ────────────────────────────────────────────────── */
const displayExpr   = document.getElementById('displayExpr');
const displayResult = document.getElementById('displayResult');
const displayMode   = document.getElementById('displayMode');
const sciPanel      = document.getElementById('sciPanel');
const sciToggle     = document.getElementById('sciToggle');
const degRadToggle  = document.getElementById('degRadToggle');
const historyPanel  = document.getElementById('historyPanel');
const historyToggle = document.getElementById('historyToggle');
const historyList   = document.getElementById('historyList');
const historyEmpty  = document.getElementById('historyEmpty');
const clearHistory  = document.getElementById('clearHistory');
const themeToggle   = document.getElementById('themeToggle');
const kbHint        = document.getElementById('kbHint');

/* ── 3. DISPLAY UPDATE ─────────────────────────────────────── */
function updateDisplay() {
  // Top line: expression or live input
  const exprText = state.expr
    ? state.expr + (state.freshResult ? '' : ' ' + state.current)
    : state.current;

  displayExpr.textContent = exprText || '0';

  // Shrink font for long expressions
  displayExpr.classList.toggle('small', exprText.length > 18);

  // Bottom line: preview result or pending op label
  if (state.result !== null && !state.freshResult) {
    displayResult.textContent = '= ' + formatNum(state.result);
    displayResult.classList.remove('error');
  } else if (state.freshResult && state.result !== null) {
    displayResult.textContent = formatNum(state.result);
    displayResult.classList.remove('error');
  } else {
    displayResult.textContent = '';
  }
}

function showError(msg) {
  displayExpr.textContent    = msg;
  displayResult.textContent  = 'Try again';
  displayResult.classList.add('error');
  displayExpr.classList.remove('small');
}

function formatNum(n) {
  if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'Error';
  // Avoid floating-point noise
  const rounded = parseFloat(n.toPrecision(12));
  if (Math.abs(rounded) >= 1e15 || (Math.abs(rounded) < 1e-7 && rounded !== 0)) {
    return rounded.toExponential(5);
  }
  // Trim unnecessary decimals
  return parseFloat(rounded.toFixed(10)).toString();
}

/* ── 4. CORE CALCULATION ───────────────────────────────────── */
function applyOp(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    case 'xʸ': return Math.pow(a, b);
    default:  return b;
  }
}

function toRad(deg) { return (deg * Math.PI) / 180; }

/* ── 5. ACTION HANDLERS ────────────────────────────────────── */
function handleDigit(val) {
  if (state.freshResult) {
    // Starting a new calculation after =
    state.expr        = '';
    state.prev        = null;
    state.op          = null;
    state.result      = null;
    state.freshResult = false;
    state.current     = val === '0' ? '0' : val;
  } else {
    if (state.current === '0' && val !== '.') {
      state.current = val;
    } else if (state.current.length < 18) {
      state.current += val;
    }
  }
  updateDisplay();
}

function handleDecimal() {
  if (state.freshResult) {
    state.current     = '0.';
    state.freshResult = false;
    state.expr        = '';
    state.prev        = null;
    state.op          = null;
    state.result      = null;
    updateDisplay();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    updateDisplay();
  }
}

function handleOp(op) {
  const cur = parseFloat(state.current);

  if (state.op && !state.freshResult) {
    // Chain operations
    const res = applyOp(state.prev, state.op, cur);
    if (!isFinite(res) && isNaN(res)) { showError('Cannot divide by zero'); return; }
    state.result  = res;
    state.expr    = formatNum(res) + ' ' + op;
    state.prev    = res;
  } else {
    state.expr    = (state.freshResult ? formatNum(state.result) : formatNum(cur)) + ' ' + op;
    state.prev    = state.freshResult ? state.result : cur;
  }

  state.op          = op;
  state.current     = '0';
  state.freshResult = false;

  // Highlight active op button
  document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
  const opBtn = [...document.querySelectorAll('.btn.op')].find(b => b.dataset.val === op);
  if (opBtn) opBtn.classList.add('active');

  updateDisplay();
}

function handleEquals() {
  if (!state.op || state.prev === null) return;

  const cur  = parseFloat(state.current);
  const res  = applyOp(state.prev, state.op, cur);

  if (isNaN(res))         { showError('Cannot divide by zero'); return; }
  if (!isFinite(res))     { showError(res > 0 ? 'Overflow' : 'Underflow'); return; }

  const exprStr = (state.expr || formatNum(state.prev)) + ' ' + formatNum(cur);

  // Save to history
  addHistory(exprStr, res);

  state.result      = res;
  state.expr        = exprStr + ' =';
  state.freshResult = true;
  state.current     = formatNum(res);
  state.prev        = null;
  state.op          = null;

  document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
  updateDisplay();
}

function handleClear() {
  state.expr        = '';
  state.prev        = null;
  state.op          = null;
  state.current     = '0';
  state.result      = null;
  state.freshResult = false;
  displayResult.classList.remove('error');
  document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
  updateDisplay();
}

function handleBackspace() {
  if (state.freshResult) return;
  if (state.current.length <= 1 || state.current === '0') {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
  }
  updateDisplay();
}

function handleSign() {
  if (state.current !== '0') {
    state.current = state.current.startsWith('-')
      ? state.current.slice(1)
      : '-' + state.current;
    updateDisplay();
  }
}

function handlePercent() {
  const n = parseFloat(state.current);
  if (!isNaN(n)) {
    state.current = formatNum(n / 100);
    updateDisplay();
  }
}

/* ── 6. SCIENTIFIC FUNCTIONS ───────────────────────────────── */
function handleSci(action) {
  const n   = parseFloat(state.current);
  let   res = NaN;
  let   label = '';

  switch (action) {
    case 'sin':   res = Math.sin(state.isDeg ? toRad(n) : n);   label = `sin(${n})`; break;
    case 'cos':   res = Math.cos(state.isDeg ? toRad(n) : n);   label = `cos(${n})`; break;
    case 'tan': {
      // tan(90°) is undefined
      const r = state.isDeg ? toRad(n) : n;
      res = Math.abs(Math.cos(r)) < 1e-10 ? NaN : Math.tan(r);
      label = `tan(${n})`;
      break;
    }
    case 'log':   res = n <= 0 ? NaN : Math.log10(n);           label = `log(${n})`; break;
    case 'ln':    res = n <= 0 ? NaN : Math.log(n);             label = `ln(${n})`;  break;
    case 'sqrt':  res = n < 0  ? NaN : Math.sqrt(n);            label = `√${n}`;     break;
    case 'square':res = n * n;                                   label = `${n}²`;     break;
    case 'cube':  res = n * n * n;                               label = `${n}³`;     break;
    case 'inv':   res = n === 0 ? NaN : 1 / n;                  label = `1/${n}`;    break;
    case 'pi':    state.current = formatNum(Math.PI); updateDisplay(); return;
    case 'e':     state.current = formatNum(Math.E);  updateDisplay(); return;
    case 'fact':  res = factorial(n);                            label = `${n}!`;     break;
    case 'abs':   res = Math.abs(n);                             label = `|${n}|`;    break;
    case 'percent': handlePercent(); return;
    case 'pow':   handleOp('xʸ'); return;
  }

  if (isNaN(res)) { showError('Math Error'); return; }

  addHistory(label, res);
  state.result      = res;
  state.expr        = label + ' =';
  state.current     = formatNum(res);
  state.freshResult = true;
  updateDisplay();
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/* ── 7. HISTORY ─────────────────────────────────────────────── */
function addHistory(expr, result) {
  state.history.unshift({ expr, result: formatNum(result) });
  if (state.history.length > 50) state.history.pop();
  renderHistory();
}

function renderHistory() {
  const items = state.history;
  historyEmpty.style.display = items.length === 0 ? 'block' : 'none';
  historyList.innerHTML      = '';
  items.forEach(({ expr, result }) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('role', 'listitem');
    li.setAttribute('title', 'Click to recall result');
    li.innerHTML = `
      <div class="hist-expr">${expr}</div>
      <div class="hist-result">${result}</div>
    `;
    li.addEventListener('click', () => {
      state.current     = result;
      state.freshResult = false;
      state.expr        = '';
      state.prev        = null;
      state.op          = null;
      state.result      = parseFloat(result);
      state.freshResult = true;
      updateDisplay();
    });
    historyList.appendChild(li);
  });
}

clearHistory.addEventListener('click', () => {
  state.history = [];
  renderHistory();
});

/* ── 8. BUTTON CLICK DISPATCH ──────────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ripple(btn);
    const { action, val } = btn.dataset;
    switch (action) {
      case 'digit':    handleDigit(val);    break;
      case 'decimal':  handleDecimal();     break;
      case 'op':       handleOp(val);       break;
      case 'equals':   handleEquals();      break;
      case 'clear':    handleClear();       break;
      case 'backspace':handleBackspace();   break;
      case 'sign':     handleSign();        break;
      case 'percent':  handlePercent();     break;
      default:
        if (action) handleSci(action);
    }
  });
});

function ripple(btn) {
  btn.classList.remove('ripple');
  void btn.offsetWidth;  // reflow
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 420);
}

/* ── 9. KEYBOARD SUPPORT ───────────────────────────────────── */
const KEY_MAP = {
  '0':'digit:0','1':'digit:1','2':'digit:2','3':'digit:3','4':'digit:4',
  '5':'digit:5','6':'digit:6','7':'digit:7','8':'digit:8','9':'digit:9',
  '.':'decimal',',':'decimal',
  '+':'op:+',   '-':'op:−',   '*':'op:×',  '/':'op:÷',
  'Enter':'equals','=':'equals',
  'Backspace':'backspace','Delete':'clear','Escape':'clear',
  '%':'percent', 'p':'sci:pi',  'e':'sci:e',
  's':'sci:sin','c':'sci:cos','t':'sci:tan',
  'l':'sci:log','n':'sci:ln', 'q':'sci:sqrt',
};

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  const mapped = KEY_MAP[e.key];
  if (!mapped) return;

  e.preventDefault();

  // Flash keyboard hint
  kbHint.classList.add('flash');
  clearTimeout(kbHint._t);
  kbHint._t = setTimeout(() => kbHint.classList.remove('flash'), 600);

  const [type, val] = mapped.split(':');
  switch (type) {
    case 'digit':   handleDigit(val);   highlightBtn(`[data-action="digit"][data-val="${val}"]`); break;
    case 'decimal': handleDecimal();    highlightBtn(`[data-action="decimal"]`); break;
    case 'op':      handleOp(val);      highlightBtn(`[data-action="op"][data-val="${val}"]`); break;
    case 'equals':  handleEquals();     highlightBtn(`[data-action="equals"]`); break;
    case 'backspace':handleBackspace(); highlightBtn(`[data-action="backspace"]`); break;
    case 'clear':   handleClear();      highlightBtn(`[data-action="clear"]`); break;
    case 'percent': handlePercent();    break;
    case 'sci':     handleSci(val);     break;
  }
});

function highlightBtn(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  ripple(el);
  el.style.transform = 'scale(.92)';
  setTimeout(() => { el.style.transform = ''; }, 160);
}

/* ── 10. SCIENTIFIC PANEL TOGGLE ───────────────────────────── */
sciToggle.addEventListener('click', () => {
  const open = sciPanel.classList.toggle('open');
  sciToggle.setAttribute('aria-expanded', open);
  sciPanel.setAttribute('aria-hidden', !open);
});

/* ── 11. DEG / RAD TOGGLE ──────────────────────────────────── */
degRadToggle.addEventListener('click', () => {
  state.isDeg = !state.isDeg;
  const label = state.isDeg ? 'DEG' : 'RAD';
  degRadToggle.textContent  = label;
  displayMode.textContent   = label;
});

/* ── 12. HISTORY PANEL TOGGLE ──────────────────────────────── */
historyToggle.addEventListener('click', () => {
  const open = historyPanel.classList.toggle('open');
  historyPanel.setAttribute('aria-hidden', !open);
});

/* ── 13. DARK MODE ─────────────────────────────────────────── */
const THEME_KEY = 'calcite_theme';
const saved = localStorage.getItem(THEME_KEY);
if (saved) document.documentElement.dataset.theme = saved;

themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
});

/* ── 14. INIT ──────────────────────────────────────────────── */
updateDisplay();
renderHistory();
