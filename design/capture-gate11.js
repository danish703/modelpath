import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9224;
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

  // Targeted capture: exactly the two requested views
  const tasks = [
    {
      name: 'homepage-desktop-1440px',
      url: 'http://localhost:4321/',
      isMobile: false,
      width: 1440
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

    await new Promise(r => setTimeout(r, 600));

    // Viewport setup
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 300));

    const heightRes = await sendSession('Runtime.evaluate', {
      expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)',
      returnByValue: true
    });
    const fullHeight = heightRes.result.result.value;
    console.log(`${task.name} full height: ${fullHeight}px`);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: fullHeight,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 400));

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
    console.log(`Saved screenshot: ${task.name}.png (${buffer.length} bytes) to design/gate-11 and artifactDir`);

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

    if (task.name === 'apps-directory-desktop-1440px') {
      // Verify differentiated covers are present
      const coversCheck = await sendSession('Runtime.evaluate', {
        expression: `JSON.stringify(
          Array.from(document.querySelectorAll('.app-card')).map(card => ({
            name: card.querySelector('.app-name')?.textContent?.trim(),
            coverTag: card.querySelector('.cover-tag')?.textContent?.trim(),
            hasMotifSvg: Boolean(card.querySelector('.motif-svg'))
          }))
        )`,
        returnByValue: true
      });
      console.log('Application covers check:', coversCheck.result.result.value);

      // Verify category filtering has no regressions
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

  // Regression check: SignMint detail page placeholders & carousel
  console.log('\n=== Regression check: SignMint detail page ===');
  const signmintTarget = await send('Target.createTarget', { url: 'http://localhost:4321/apps/signmint/' });
  const signmintAttached = await send('Target.attachToTarget', { targetId: signmintTarget.result.targetId, flatten: true });
  const smSessionId = signmintAttached.result.sessionId;

  function sendSm(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId: smSessionId, method, params }));
    });
  }

  await sendSm('Page.enable');
  await new Promise(r => setTimeout(r, 600));

  const smCheck = await sendSm('Runtime.evaluate', {
    expression: `JSON.stringify({
      productName: document.querySelector('.product-name')?.textContent?.trim(),
      placeholderTitles: Array.from(document.querySelectorAll('.placeholder-title')).map(el => el.textContent.trim()),
      hasOrganizerPlaceholder: document.body.innerText.includes('Multi-Page Document Organizer'),
      hasNavigationPlaceholder: document.body.innerText.includes('Document Navigation & Review'),
      carouselExists: Boolean(document.querySelector('[data-carousel]')),
      carouselControls: Boolean(document.querySelector('[data-carousel-controls]'))
    })`,
    returnByValue: true
  });
  console.log('SignMint placeholder audit:', smCheck.result.result.value);
  await send('Target.closeTarget', { targetId: signmintTarget.result.targetId });

  // Regression check: Mobile overflow check (390px)
  console.log('\n=== Regression check: Mobile responsiveness (390px) ===');
  const mobileTarget = await send('Target.createTarget', { url: 'http://localhost:4321/' });
  const mobileAttached = await send('Target.attachToTarget', { targetId: mobileTarget.result.targetId, flatten: true });
  const mbSessionId = mobileAttached.result.sessionId;

  function sendMb(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId: mbSessionId, method, params }));
    });
  }

  await sendMb('Page.enable');
  await sendMb('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 300));

  const mobileOverflow = await sendMb('Runtime.evaluate', {
    expression: `JSON.stringify({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    })`,
    returnByValue: true
  });
  console.log('Mobile overflow audit (390px):', mobileOverflow.result.result.value);
  await send('Target.closeTarget', { targetId: mobileTarget.result.targetId });

  // Regression check: prefers-reduced-motion
  console.log('\n=== Regression check: prefers-reduced-motion ===');
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
  await new Promise(r => setTimeout(r, 500));

  const motionEval = await sendMotion('Runtime.evaluate', {
    expression: `JSON.stringify({
      mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionAttr: document.querySelector('[data-constellation]')?.getAttribute('data-motion')
    })`,
    returnByValue: true
  });
  console.log('Reduced motion audit result:', motionEval.result.result.value);
  await send('Target.closeTarget', { targetId: motionTarget.result.targetId });

  ws.close();
  console.log('\n=== ALL TARGETED AUDITS & SCREENSHOTS COMPLETED SUCCESSFULLY ===');
} catch (err) {
  console.error("Capture failed:", err);
} finally {
  edge.kill();
}
