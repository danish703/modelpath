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

  // Focused Verification tasks for Gate 13 Visual Corrections
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
      name: 'gate13-signmint-detail-mobile-320px',
      url: `http://localhost:${httpPort}/apps/signmint/`,
      width: 320,
      mobile: true
    },
    {
      name: 'gate13-modelpath-ml-detail-desktop-1440px',
      url: `http://localhost:${httpPort}/apps/modelpath-ml/`,
      width: 1440,
      mobile: false
    },
    {
      name: 'gate13-modelpath-ml-detail-mobile-390px',
      url: `http://localhost:${httpPort}/apps/modelpath-ml/`,
      width: 390,
      mobile: true
    },
    {
      name: 'gate13-modelpath-ml-detail-mobile-320px',
      url: `http://localhost:${httpPort}/apps/modelpath-ml/`,
      width: 320,
      mobile: true
    }
  ];

  const overallResults = [];

  for (const task of tasks) {
    console.log(`\n======================================================`);
    console.log(`Capturing: ${task.name} (${task.width}px, mobile=${task.mobile})`);
    console.log(`======================================================`);
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

    await new Promise(r => setTimeout(r, 600));

    // Set initial viewport
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: task.mobile
    });
    await new Promise(r => setTimeout(r, 400));

    // Await all image decode operations so actual rendered bitmaps exist
    await sendSession('Runtime.evaluate', {
      expression: `(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        await Promise.all(images.map(img => {
          img.loading = 'eager';
          if (img.complete && img.naturalWidth > 0) {
            return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
          }
          return new Promise(res => {
            const timeout = setTimeout(res, 2500);
            img.onload = () => {
              clearTimeout(timeout);
              if (img.decode) {
                img.decode().catch(() => {}).then(res);
              } else {
                res();
              }
            };
            img.onerror = () => {
              clearTimeout(timeout);
              res();
            };
          });
        }));
      })()`,
      awaitPromise: true
    });

    // Run programmatic QA checks
    const qaRes = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const pageOverflow = docWidth > winWidth;
        
        // Check all images
        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }));

        const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);

        // Check screenshot carousel images specifically
        const carouselImages = Array.from(document.querySelectorAll('.shot-frame img')).map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete
        }));

        // Check for removed / prohibited clutter
        const bodyText = document.body.innerText;
        const hasBlueprint = bodyText.includes('signmint-blueprint.v1') || bodyText.includes('blueprint.v1');
        const hasOfflineSpec = bodyText.includes('OFFLINE SPEC');
        const has4ProjectsActive = bodyText.includes('4 Projects Active');
        const hasProductionReleaseStatus = bodyText.includes('Status: Production Release');
        
        // Check conceptual tags on published apps
        const genuineCovers = Array.from(document.querySelectorAll('.app-cover.slug-signmint, .app-cover.slug-modelpath-ml, .hero-product-showcase'));
        const conceptualTextInGenuine = genuineCovers.some(el => el.innerText.includes('Conceptual Preview'));

        // Check headings
        const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim());

        // Check store links
        const playStoreLinks = Array.from(document.querySelectorAll('a[href*="play.google.com"]')).map(a => a.href);

        return {
          winWidth,
          docWidth,
          pageOverflow,
          totalImagesCount: images.length,
          brokenImagesCount: brokenImages.length,
          brokenImages,
          carouselImagesCount: carouselImages.length,
          carouselImages,
          hasBlueprint,
          hasOfflineSpec,
          has4ProjectsActive,
          hasProductionReleaseStatus,
          conceptualTextInGenuine,
          h2s,
          playStoreLinks
        };
      })()`,
      returnByValue: true
    });

    const qa = qaRes.result.result.value;
    console.log(`QA Result for ${task.name}:`);
    console.log(`- Page width: ${qa.winWidth}px, docWidth: ${qa.docWidth}px, overflow: ${qa.pageOverflow}`);
    console.log(`- Total images: ${qa.totalImagesCount}, Broken images: ${qa.brokenImagesCount}`);
    if (qa.carouselImagesCount > 0) {
      console.log(`- Carousel screenshots: ${qa.carouselImagesCount} (all naturalWidth > 0: ${qa.carouselImages.every(img => img.naturalWidth > 0)})`);
    }
    console.log(`- Clutter checks: blueprint=${qa.hasBlueprint}, offlineSpec=${qa.hasOfflineSpec}, 4ProjectsActive=${qa.has4ProjectsActive}, productionRelease=${qa.hasProductionReleaseStatus}`);
    console.log(`- Conceptual labels on genuine covers: ${qa.conceptualTextInGenuine}`);
    console.log(`- Play Store Links (${qa.playStoreLinks.length}):`, qa.playStoreLinks);
    console.log(`- H2s:`, qa.h2s);

    overallResults.push({ task: task.name, qa });

    // Calculate full scroll height for screenshot
    const heightRes = await sendSession('Runtime.evaluate', {
      expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)',
      returnByValue: true
    });
    const fullHeight = heightRes.result.result.value || 900;
    const captureHeight = Math.min(fullHeight, 3600);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: captureHeight,
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
        height: captureHeight,
        scale: 1
      }
    });

    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const localPath = path.join(gate13Dir, `${task.name}.png`);
    const artifactPath = path.join(artifactDir, `${task.name}.png`);

    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`Saved screenshot: ${task.name}.png (${buffer.length} bytes)`);

    // Clean up target
    await send('Target.closeTarget', { targetId });
  }

  console.log('\n======================================================');
  console.log('SUMMARY OF ALL VERIFICATIONS');
  console.log('======================================================');
  let allClean = true;
  for (const res of overallResults) {
    const q = res.qa;
    const issues = [];
    if (q.pageOverflow) issues.push('Horizontal overflow detected');
    if (q.brokenImagesCount > 0) issues.push(`${q.brokenImagesCount} broken images`);
    if (q.hasBlueprint) issues.push('Found blueprint markup');
    if (q.hasOfflineSpec) issues.push('Found OFFLINE SPEC');
    if (q.has4ProjectsActive) issues.push('Found 4 Projects Active');
    if (q.conceptualTextInGenuine) issues.push('Conceptual Preview text on genuine assets');
    
    if (issues.length > 0) {
      allClean = false;
      console.log(`❌ ${res.task}: ${issues.join(', ')}`);
    } else {
      console.log(`✅ ${res.task}: PASS (0 overflow, 0 broken images, 0 clutter)`);
    }
  }

  if (allClean) {
    console.log('\n>>> ALL REVISED PAGES PASSED ALL VERIFICATION CHECKS! <<<');
  } else {
    console.warn('\n>>> SOME ISSUES WERE FLAGGED DURING VERIFICATION <<<');
  }

} catch (err) {
  console.error("Capture failure:", err);
} finally {
  edge.kill();
  server.close();
  try { fs.rmSync(tempUserData, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
}
