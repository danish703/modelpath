import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9222;

const edge = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

// Wait for Edge to start
await new Promise(r => setTimeout(r, 1500));

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

  // Create a target
  const newTarget = await send('Target.createTarget', { url: 'file:///D:/modelpath/design/mobile-390px.html' });
  const targetId = newTarget.result.targetId;

  // Attach to target
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

  // Test across widths: 320, 375, 390, 430
  const testWidths = [320, 375, 390, 430];
  const results = [];

  for (const w of testWidths) {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 2650,
      deviceScaleFactor: 1,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 300));

    const evalRes = await sendSession('Runtime.evaluate', {
      expression: `JSON.stringify({
        innerWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    const parsed = JSON.parse(evalRes.result.result.value);
    results.push({ targetWidth: w, ...parsed });
  }

  console.log("RESPONSIVE_VERIFICATION_RESULTS:");
  console.log(JSON.stringify(results, null, 2));

  // Now capture screenshot at exact 390px
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 2650,
    deviceScaleFactor: 1,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 300));

  const screenshot = await sendSession('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: 2650,
      scale: 1
    }
  });

  const buffer = Buffer.from(screenshot.result.data, 'base64');
  fs.writeFileSync('D:/modelpath/design/homepage-mobile-390px.png', buffer);
  console.log("SCREENSHOT_SAVED_SUCCESSFULLY: Size =", buffer.length);

  ws.close();
} finally {
  edge.kill();
}
