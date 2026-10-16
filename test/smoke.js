/* 网申记事本 app/index.html — jsdom 冒烟测试（CI 用）
 * 测试脚本内置静态 http 服务（同进程起停，不留僵尸进程），
 * 走 http:// origin 以支持 localStorage。报告由 fs 直接写 UTF-8 文件。
 * 退出码：有失败项或运行时错误 → 1（CI 判红），全过 → 0。
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 相对脚本位置定位被测页面，保证本地和 CI 都能跑
const SITE = path.join(__dirname, '..', 'app');
const REPORT = path.join(__dirname, '..', 'smoke-report.txt');
const PORT = 8777;

const lines = [];
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; lines.push('PASS  ' + name + (detail ? '  (' + detail + ')' : '')); }
  else { fail++; lines.push('FAIL  ' + name + (detail ? '  (' + detail + ')' : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const file = path.join(SITE, urlPath === '/' ? 'index.html' : urlPath);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('[jsdomError] ' + (e && e.message)));
  vc.on('error', (...a) => errors.push('[console.error] ' + a.join(' ')));
  vc.on('warn', (...a) => errors.push('[console.warn] ' + a.join(' ')));

  let dom;
  try {
    dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(window) {
        // jsdom 的 confirm 未实现（调用会抛 jsdomError 并返回 undefined），必须桩掉
        try { window.confirm = () => true; } catch (e) {}
        try { Object.defineProperty(window, 'confirm', { value: () => true, configurable: true, writable: true }); } catch (e) {}
        window.__copied = null;
        try {
          Object.defineProperty(window.navigator, 'clipboard', {
            value: { writeText: t => { window.__copied = t; return Promise.resolve(); } },
            configurable: true
          });
        } catch (e) { /* ignore */ }
      }
    });
  } catch (e) {
    lines.push('FATAL  加载页面失败: ' + e.message);
    fs.writeFileSync(REPORT, lines.join('\n') + '\n', 'utf8');
    server.close();
    process.exit(1);
  }

  const { window } = dom;
  const doc = window.document;
  const $ = s => doc.querySelector(s);
  const $$ = s => Array.from(doc.querySelectorAll(s));

  await new Promise(r => {
    if (doc.readyState === 'complete') return r();
    window.addEventListener('load', r);
    setTimeout(r, 4000);
  });
  await sleep(300);

  /* 1. 首屏 */
  check('页面加载无运行时错误', errors.length === 0, errors.join(' | ') || '无');
  check('标题正确', doc.title.indexOf('网申记事本') >= 0, doc.title);
  check('空状态提示可见', $('#emptyCompanies').hidden === false);
  check('统计区已渲染', $('#stats').textContent.indexOf('企业') >= 0);
  check('首屏弹窗不可见', $('#modalBackdrop').hidden === true && window.getComputedStyle($('#modalBackdrop')).display === 'none');

  /* 1.5 关键回归：hidden 属性必须真正隐藏（作者样式 display 会压过默认样式表规则） */
  {
    // 静态守卫：样式表里必须存在 [hidden] -> display:none 防御规则
    var ruleOk = false;
    try {
      ruleOk = Array.from(doc.styleSheets).some(function(ss){
        return Array.from(ss.cssRules || []).some(function(r){
          var t = (r.cssText || '').replace(/\s+/g, '');
          return t.indexOf('[hidden]{display:none') >= 0;
        });
      });
    } catch (e) {}
    check('样式表含 [hidden] 防御规则', ruleOk);
    var bd = $('#modalBackdrop');
    bd.hidden = false;
    var openDisp = window.getComputedStyle(bd).display;
    bd.hidden = true;
    var closedDisp = window.getComputedStyle(bd).display;
    check('弹窗打开态计算样式 display=flex', openDisp === 'flex', openDisp);
    check('弹窗 hidden 态计算样式 display=none', closedDisp === 'none', closedDisp);
  }

  /* 2. 添加企业（含全部关闭路径：取消 / Esc / 保存后自动关） */
  function modalOpen(){ return $('#modalBackdrop').hidden === false && window.getComputedStyle($('#modalBackdrop')).display !== 'none'; }
  function modalClosed(){ return $('#modalBackdrop').hidden === true && window.getComputedStyle($('#modalBackdrop')).display === 'none'; }

  $('#btnAdd').click();
  await sleep(50);
  check('弹窗打开', modalOpen());
  $('#btnCancel').click();
  await sleep(50);
  check('取消按钮可关闭弹窗', modalClosed());

  $('#btnAdd').click();
  await sleep(50);
  check('重新打开弹窗', modalOpen());
  $('#fName').value = '测试科技有限公司';
  $('#fUrl').value = 'example.com/campus/2027';
  $('#fAccount').value = '13800138000';
  $('#fPassword').value = 'Passw0rd!';
  $('#fNote').value = '截止 10-31，内推码 ABC123';
  $('#btnSave').click();
  await sleep(80);
  let rows = $$('#companyRows tr');
  if (rows.length === 0) {
    $('#companyForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(80);
    rows = $$('#companyRows tr');
  }
  check('添加后出现 1 行', rows.length === 1, rows.length + ' 行');
  check('保存后弹窗自动关闭', modalClosed());
  check('企业名称渲染正确', rows.length === 1 && rows[0].querySelector('.c-name').textContent === '测试科技有限公司');
  const href = rows.length ? rows[0].querySelector('a.link').getAttribute('href') : '';
  check('链接自动补全 https://', href === 'https://example.com/campus/2027', href);
  check('统计企业数=1', $('#stats').textContent.indexOf('企业 1') >= 0, $('#stats').textContent.trim());
  check('localStorage 已写入', (window.localStorage.getItem('jobbench.v1') || '').indexOf('测试科技有限公司') >= 0);

  /* 2.5 Esc 键关闭 */
  $('#btnAdd').click();
  await sleep(50);
  check('弹窗再次打开', modalOpen());
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(50);
  check('Esc 键可关闭弹窗', modalClosed());

  /* 3. 状态三方框循环 */
  let box = rows[0].querySelector('.statusbox');
  check('初始为待投递', box.classList.contains('s-pending'));
  box.click(); await sleep(50);
  box = $('#companyRows tr .statusbox');
  check('点击一次=已投递(✓)', box.classList.contains('s-applied') && box.textContent === '✓', box.className);
  check('统计已投递=1', $('#stats').textContent.indexOf('已投递 1') >= 0);
  box.click(); await sleep(50);
  box = $('#companyRows tr .statusbox');
  check('点击两次=已终止(✗)', box.classList.contains('s-terminated') && box.textContent === '✗', box.className);
  box.click(); await sleep(50);
  box = $('#companyRows tr .statusbox');
  check('点击三次回到待投递', box.classList.contains('s-pending'));

  /* 4. 复制账号/密码/链接 */
  const row = () => $('#companyRows tr');
  row().querySelector('[data-act="copy"][data-field="account"]').click();
  await sleep(30);
  check('复制账号', window.__copied === '13800138000', String(window.__copied));
  row().querySelector('[data-act="copy"][data-field="password"]').click();
  await sleep(30);
  check('复制密码', window.__copied === 'Passw0rd!', String(window.__copied));
  row().querySelector('[data-act="copy"][data-field="url"]').click();
  await sleep(30);
  check('复制链接(规范化后)', window.__copied === 'https://example.com/campus/2027', String(window.__copied));

  /* 5. 密码显示/隐藏 */
  check('密码默认掩码', row().querySelector('.c-pw').textContent.indexOf('••••••') >= 0);
  row().querySelector('[data-act="reveal"]').click();
  await sleep(50);
  check('点击后显示明文', row().querySelector('.c-pw').textContent.indexOf('Passw0rd!') >= 0);
  row().querySelector('[data-act="reveal"]').click();
  await sleep(50);
  check('再点击恢复掩码', row().querySelector('.c-pw').textContent.indexOf('••••••') >= 0);

  /* 6. 搜索与筛选 */
  const sb = $('#searchBox');
  sb.value = '测试'; sb.dispatchEvent(new window.Event('input', { bubbles: true }));
  await sleep(80);
  check('搜索命中 1 行', $$('#companyRows tr').length === 1);
  sb.value = '不存在的公司xyz'; sb.dispatchEvent(new window.Event('input', { bubbles: true }));
  await sleep(80);
  check('搜索无结果时空态出现', $$('#companyRows tr').length === 0 && $('#emptyCompanies').hidden === false);
  sb.value = ''; sb.dispatchEvent(new window.Event('input', { bubbles: true }));
  await sleep(80);
  check('清空搜索恢复 1 行', $$('#companyRows tr').length === 1);

  $$('#statusChips .chip').find(b => b.dataset.status === 'applied').click();
  await sleep(80);
  check('筛选「已投递」=0 行', $$('#companyRows tr').length === 0);
  $$('#statusChips .chip').find(b => b.dataset.status === 'pending').click();
  await sleep(80);
  check('筛选「待投递」=1 行', $$('#companyRows tr').length === 1);
  $$('#statusChips .chip').find(b => b.dataset.status === 'all').click();
  await sleep(80);
  check('筛选「全部」=1 行', $$('#companyRows tr').length === 1);

  /* 7. 编辑 */
  row().querySelector('[data-act="edit"]').click();
  await sleep(50);
  check('编辑弹窗带出原值', $('#fName').value === '测试科技有限公司' && $('#fPassword').value === 'Passw0rd!');
  $('#fName').value = '测试科技集团';
  $('#btnSave').click();
  await sleep(80);
  if (row().querySelector('.c-name').textContent !== '测试科技集团') {
    $('#companyForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await sleep(80);
  }
  check('编辑后名称更新', row().querySelector('.c-name').textContent === '测试科技集团');

  /* 8. 记事本（v1.0.3：默认折叠 + 点击展开） */
  $('#btnAddNote').click();
  await sleep(80);
  let cards = $$('.note-card');
  check('新建笔记出现 1 张卡片', cards.length === 1, cards.length + ' 张');
  check('新建笔记默认展开', !!cards[0].querySelector('.note-body'), '含正文编辑区');
  const title = cards[0].querySelector('.note-title');
  const body = cards[0].querySelector('.note-body');
  title.value = '个人基本信息';
  title.dispatchEvent(new window.Event('input', { bubbles: true }));
  body.value = '姓名：张三；身份证号：110101199901011234；手机：13800138000';
  body.dispatchEvent(new window.Event('input', { bubbles: true }));
  await sleep(750); // 等 500ms 防抖保存落地
  const stored = JSON.parse(window.localStorage.getItem('jobbench.v1') || '{}');
  check('笔记自动保存到 localStorage',
    stored.notes && stored.notes.length === 1 && stored.notes[0].content.indexOf('110101199901011234') >= 0);
  check('保存提示已更新', cards[0].querySelector('.save-hint').textContent.indexOf('已保存') >= 0);
  window.__copied = null;
  cards[0].querySelector('[data-act="copy-note"]').click();
  await sleep(30);
  check('展开态复制笔记内容', window.__copied === '姓名：张三；身份证号：110101199901011234；手机：13800138000', String(window.__copied));

  /* 8.5 折叠/展开交互（v1.0.3 回归） */
  cards[0].querySelector('[data-act="toggle-note"]').click();
  await sleep(50);
  cards = $$('.note-card');
  check('点击箭头后折叠', cards[0].classList.contains('collapsed') && !cards[0].querySelector('.note-body'), '正文区不在 DOM');
  var pv = cards[0].querySelector('.note-preview');
  check('折叠态显示内容预览', !!pv && pv.textContent.indexOf('110101199901011234') >= 0, (pv || {}).textContent || '');
  pv.click();
  await sleep(50);
  cards = $$('.note-card');
  check('点击预览后展开', !cards[0].classList.contains('collapsed') && !!cards[0].querySelector('.note-body'));
  cards[0].querySelector('.note-head').click();
  await sleep(50);
  cards = $$('.note-card');
  check('点击标题栏空白处折叠', cards[0].classList.contains('collapsed') && !cards[0].querySelector('.note-body'));
  cards[0].querySelector('.note-title').click();
  await sleep(50);
  cards = $$('.note-card');
  check('点击标题输入框不触发折叠', cards[0].classList.contains('collapsed'), '仍保持折叠（标题可直接编辑）');
  window.__copied = null;
  cards[0].querySelector('[data-act="copy-note"]').click();
  await sleep(30);
  check('折叠态可复制内容', window.__copied === '姓名：张三；身份证号：110101199901011234；手机：13800138000', String(window.__copied));

  /* 8.6 新建第二篇：新笔记展开，旧笔记保持折叠 */
  $('#btnAddNote').click();
  await sleep(80);
  cards = $$('.note-card');
  check('新建第二篇出现 2 张卡片', cards.length === 2, cards.length + ' 张');
  check('新笔记默认展开', !!cards[0].querySelector('.note-body'));
  check('旧笔记保持折叠', cards[1].classList.contains('collapsed') && !cards[1].querySelector('.note-body'));

  /* 9. 删除 */
  cards[0].querySelector('[data-act="del-note"]').click();
  await sleep(80);
  check('删除展开态笔记后剩 1 张', $$('.note-card').length === 1, $$('.note-card').length + ' 张');
  $$('.note-card')[0].querySelector('[data-act="del-note"]').click();
  await sleep(80);
  check('删除折叠态笔记后 0 张卡片', $$('.note-card').length === 0);
  row().querySelector('[data-act="del"]').click();
  await sleep(80);
  check('删除企业后 0 行且空态可见', $$('#companyRows tr').length === 0 && $('#emptyCompanies').hidden === false);
  check('localStorage 企业已清空', JSON.parse(window.localStorage.getItem('jobbench.v1') || '{}').companies.length === 0);

  /* 10. 导出/导入按钮存在（不触发下载：jsdom 不支持 Blob） */
  check('导出/导入按钮存在', !!$('#btnExport') && !!$('#btnImport'));
  check('全程无运行时错误', errors.length === 0, errors.join(' | ') || '无');

  window.close();
  lines.push('');
  lines.push('==== 汇总：共 ' + (pass + fail) + ' 项，通过 ' + pass + '，失败 ' + fail + '；运行时错误 ' + errors.length + ' 条 ====');
  fs.writeFileSync(REPORT, lines.join('\n') + '\n', 'utf8');
  console.log(lines.join('\n'));
  server.close();
  process.exit(fail || errors.length ? 1 : 0);
});
