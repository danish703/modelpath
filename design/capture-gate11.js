import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9223;
const artifactDir = "C:/Users/dipud/.gemini/antigravity-ide/brain/879f1c33-c566-43a7-8c03-22b0fcb2196c";
const gate11DesignDir = "D:\\modelpath\\design\\gate-11";

if (!fs.existsSync(gate11DesignDir)) {
  fs.mkdirSync(gate11DesignDir, { recursive: true });
}
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

console.log("Starting Edge headless...");
const edge = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

await new Promise(r => setTimeout(r, 1600));

try {
  const versionRes = await fetch(`http://127.0.0.1:${port}/json/version`);
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
      name: 'homepage-desktop-1440px',
      url: 'http://localhost:4321/',
      isMobile: false,
      width: 1440
    },
    {
      name: 'homepage-mobile-390px',
      url: 'http://localhost:4321/',
      isMobile: true,
      width: 390
    },
    {
      name: 'signmint-detail-desktop-1440px',
      url: 'http://localhost:4321/apps/signmint/',
      isMobile: false,
      width: 1440
    },
    {
      name: 'signmint-detail-mobile-390px',
      url: 'http://localhost:4321/apps/signmint/',
      isMobile: true,
      width: 390
    },
    {
      name: 'apps-directory-desktop-1440px',
      url: 'http://localhost:4321/apps/',
      isMobile: false,
      width: 1440
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

    // Wait for page to render and hydrate
    await new Promise(r => setTimeout(r, 600));

    if (task.isMobile) {
      // Responsive overflow audit
      const testWidths = [320, 375, 390, 430];
      const overflowResults = [];
      for (const w of testWidths) {
        await sendSession('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true
        });
        await new Promise(r => setTimeout(r, 150));
        const evalRes = await sendSession('Runtime.evaluate', {
          expression: `JSON.stringify({
            targetWidth: ${w},
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth
          })`,
          returnByValue: true
        });
        overflowResults.push(JSON.parse(evalRes.result.result.value));
      }
      console.log(`Overflow audit (${task.name}):`, JSON.stringify(overflowResults));
    }

    // Set viewport
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: task.isMobile
    });
    await new Promise(r => setTimeout(r, 300));

    // Get full height
    const heightRes = await sendSession('Runtime.evaluate', {
      expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)',
      returnByValue: true
    });
    const fullHeight = heightRes.result.result.value;
    console.log(`${task.name} height: ${fullHeight}px`);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: fullHeight,
      deviceScaleFactor: 1,
      mobile: task.isMobile
    });
    await new Promise(r => setTimeout(r, 400));

    // Capture full-page screenshot
    const screenshot = await sendSession('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: task.width,
        height: fullHeight,
        scale: 1
      }
    });

    const buffer = Buffer.from(screenshot.result.data, 'base64');
    const localPath = path.join(gate11DesignDir, `${task.name}.png`);
    const artifactPath = path.join(artifactDir, `${task.name}.png`);

    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`Saved screenshot: ${task.name}.png (${buffer.length} bytes)`);

    // Functional tests on the page
    if (task.name === 'homepage-desktop-1440px') {
      const heroCheck = await sendSession('Runtime.evaluate', {
        expression: `JSON.stringify({
          constellationReady: document.querySelector('[data-constellation]')?.getAttribute('data-constellation-ready'),
          motionState: document.querySelector('[data-constellation]')?.getAttribute('data-motion'),
          canvasExists: Boolean(document.querySelector('canvas[data-constellation-canvas]')),
          staticSvgExists: Boolean(document.querySelector('svg.constellation-static')),
          heroHeadline: document.querySelector('.hero-headline')?.textContent?.trim()
        })`,
        returnByValue: true
      });
      console.log('Homepage constellation check:', heroCheck.result.result.value);
    }

    if (task.name === 'signmint-detail-desktop-1440px') {
      const detailCheck = await sendSession('Runtime.evaluate', {
        expression: `JSON.stringify({
          productName: document.querySelector('.product-name')?.textContent?.trim(),
          carouselSlides: document.querySelectorAll('[data-carousel-slide]').length,
          carouselControls: Boolean(document.querySelector('[data-carousel-controls]')),
          platformCards: Array.from(document.querySelectorAll('[data-platform]')).map(el => ({
            platform: el.getAttribute('data-platform'),
            state: el.getAttribute('data-store-state'),
            text: el.querySelector('.platform-name')?.textContent?.trim(),
            status: el.querySelector('.platform-status-pill')?.textContent?.trim(),
            btnEnabled: Boolean(el.querySelector('a.store-btn.is-enabled')),
            btnDisabled: Boolean(el.querySelector('.store-btn.is-disabled'))
          }))
        })`,
        returnByValue: true
      });
      console.log('SignMint detail check:', detailCheck.result.result.value);
    }

    if (task.name === 'apps-directory-desktop-1440px') {
      // Test category filtering
      const filterCheck = await sendSession('Runtime.evaluate', {
        expression: `(() => {
          const totalBefore = document.querySelectorAll('[data-app-card]:not([hidden])').length;
          const prodBtn = document.querySelector('[data-category-filter="productivity"]');
          prodBtn?.click();
          const prodCount = document.querySelectorAll('[data-app-card]:not([hidden])').length;
          const allBtn = document.querySelector('[data-category-filter="all"]');
          allBtn?.click();
          const totalAfter = document.querySelectorAll('[data-app-card]:not([hidden])').length;
          return JSON.stringify({ totalBefore, prodCount, totalAfter });
        })()`,
        returnByValue: true
      });
      console.log('Category filter check:', filterCheck.result.result.value);
    }

    await send('Target.closeTarget', { targetId });
  }

  // Next, test prefers-reduced-motion behavior on Homepage
  console.log('\n=== Testing prefers-reduced-motion ===');
  const motionTarget = await send('Target.createTarget', { url: 'http://localhost:4321/' });
  const motionAttached = await send('Target.attachToTarget', { targetId: motionTarget.result.targetId, flatten: true });
  const motionSessionId = motionAttached.result.sessionId;

  function sendMotion(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId: motionSessionId, method, params }));
    });
  }

  await sendMotion('Page.enable');
  await sendMotion('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await new Promise(r => setTimeout(r, 600));

  const motionEval = await sendMotion('Runtime.evaluate', {
    expression: `JSON.stringify({
      mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionAttr: document.querySelector('[data-constellation]')?.getAttribute('data-motion'),
      bodyFont: getComputedStyle(document.body).fontFamily
    })`,
    returnByValue: true
  });
  console.log('Reduced motion audit result:', motionEval.result.result.value);
  await send('Target.closeTarget', { targetId: motionTarget.result.targetId });

  ws.close();
  console.log('\n=== ALL AUDITS & SCREENSHOTS COMPLETED SUCCESSFULLY ===');
} catch (err) {
  console.error("Capture failed:", err);
} finally {
  edge.kill();
}
