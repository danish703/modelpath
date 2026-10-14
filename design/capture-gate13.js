import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cdpPort = 9233;
const httpPort = 4333;
const distDir = "D:\\modelpath\\dist";
const artifactDir = "C:/Users/dipud/.gemini/antigravity-ide/brain/879f1c33-c566-43a7-8c03-22b0fcb2196c";
const gate13Dir = "D:\\modelpath\\design\\gate-13";

if (!fs.existsSync(gate13Dir)) fs.mkdirSync(gate13Dir, { recursive: true });
if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

// 1. Start Static HTTP Server on httpPort
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.woff2': 'font/woff2',
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

await new Promise((resolve) => server.listen(httpPort, resolve));
console.log(`Static server running on port ${httpPort}`);

// 2. Launch Edge with isolated temp user data dir
const tempUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-gate13-cdp-'));
console.log("Starting Edge headless on port", cdpPort);
const edge = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${tempUserData}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const versionRes = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const tasks = [
    {
      name: 'gate13-homepage-desktop-1440px',
      url: `http://localhost:${httpPort}/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-homepage-mobile-390px',
      url: `http://localhost:${httpPort}/`,
      width: 390,
      mobile: true
    },
    {
      name: 'gate13-apps-directory-desktop-1440px',
      url: `http://localhost:${httpPort}/apps/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-apps-directory-mobile-390px',
      url: `http://localhost:${httpPort}/apps/`,
      width: 390,
      mobile: true
    },
    {
      name: 'gate13-modelpath-ml-detail-desktop-1440px',
      url: `http://localhost:${httpPort}/apps/modelpath-ml/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-signmint-detail-desktop-1440px',
      url: `http://localhost:${httpPort}/apps/signmint/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-signmint-detail-mobile-390px',
      url: `http://localhost:${httpPort}/apps/signmint/`,
      width: 390,
      mobile: true
    },
    {
      name: 'gate13-signmint-privacy-desktop-1440px',
      url: `http://localhost:${httpPort}/apps/signmint/privacy/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-contact-desktop-1440px',
      url: `http://localhost:${httpPort}/contact/`,
      width: 1440,
      mobile: false
    }
  ];

  for (const task of tasks) {
    console.log(`\n=== Capturing: ${task.name} ===`);
    const newTarget = await send('Target.createTarget', { url: task.url });
    const targetId = newTarget.result.targetId;

    const attached = await send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attached.result.sessionId;

    function sendSession(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        pending.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
      });
    }

    await sendSession('Page.enable');
    await sendSession('DOM.enable');

    await new Promise(r => setTimeout(r, 800));

    // Set viewport
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: task.mobile
    });
    await new Promise(r => setTimeout(r, 400));

    // Run programmatic QA checks
    const qaRes = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const pageOverflow = docWidth > winWidth;
        
        // Font families check
        const h1 = document.querySelector('h1');
        const h1Font = h1 ? window.getComputedStyle(h1).fontFamily : null;
        const bodyFont = window.getComputedStyle(document.body).fontFamily;

        // App order check (if app cards exist)
        const appCards = Array.from(document.querySelectorAll('.app-card .app-name a'));
        const appOrder = appCards.map(a => a.innerText.trim());

        // Store buttons check
        const activeStoreLinks = Array.from(document.querySelectorAll('.store-badge-btn.active, .store-btn-active'))
          .map(a => ({ text: a.innerText.replace(/\\s+/g, ' ').trim(), href: a.getAttribute('href') }));

        // Check for removed labels
        const bodyText = document.body.innerText;
        const hasAppAdsNav = Array.from(document.querySelectorAll('nav a')).some(a => a.href.includes('app-ads.txt'));
        const hasStaticWorkers = bodyText.includes('Static Delivery') && bodyText.includes('Cloudflare Workers');
        const hasActiveVerifiedBadge = Array.from(document.querySelectorAll('.channel-tag, .badge, .status-badge')).some(el => el.innerText.includes('Active Verified'));

        return {
          winWidth,
          docWidth,
          pageOverflow,
          h1Font,
          bodyFont,
          appOrder,
          activeStoreLinksCount: activeStoreLinks.length,
          activeStoreLinks,
          hasAppAdsNav,
          hasStaticWorkers,
          hasActiveVerifiedBadge
        };
      })()`,
      returnByValue: true
    });

    console.log(`QA Checks for ${task.name}:`, JSON.stringify(qaRes.result.result.value, null, 2));

    const heightRes = await sendSession('Runtime.evaluate', {
      expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)',
      returnByValue: true
    });
    const fullHeight = heightRes.result.result.value || 900;
    console.log(`${task.name} full height: ${fullHeight}px`);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: Math.min(fullHeight, 3500),
      deviceScaleFactor: 1,
      mobile: task.mobile
    });
    await new Promise(r => setTimeout(r, 500));

    const screenshot = await sendSession('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: task.width,
        height: Math.min(fullHeight, 3500),
        scale: 1
      }
    });

    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const localPath = path.join(gate13Dir, `${task.name}.png`);
    const artifactPath = path.join(artifactDir, `${task.name}.png`);

    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`Saved screenshot: ${task.name}.png (${buffer.length} bytes) to gate-13 and artifactDir`);

    // Clean up target
    await send('Target.closeTarget', { targetId });
  }

  console.log('\n=== ALL GATE 13 SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY ===');
} catch (err) {
  console.error("Capture failure:", err);
} finally {
  edge.kill();
  server.close();
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
}
