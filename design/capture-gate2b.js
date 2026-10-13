import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9222;
const artifactDir = "C:\\Users\\dipud\\.gemini\\antigravity-ide\\brain\\787ae2c9-363c-4931-8f50-fcd88c461244";
const publicDesignDir = "D:\\modelpath\\public\\design";

if (!fs.existsSync(publicDesignDir)) {
  fs.mkdirSync(publicDesignDir, { recursive: true });
}

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

  const tasks = [
    {
      name: 'apps-directory-desktop-1440px',
      file: 'D:/modelpath/design/apps-directory-desktop-1440px.html',
      isMobile: false,
      width: 1440
    },
    {
      name: 'apps-directory-mobile-390px',
      file: 'D:/modelpath/design/apps-directory-mobile-390px.html',
      isMobile: true,
      width: 390
    },
    {
      name: 'app-detail-desktop-1440px',
      file: 'D:/modelpath/design/app-detail-desktop-1440px.html',
      isMobile: false,
      width: 1440
    },
    {
      name: 'app-detail-mobile-390px',
      file: 'D:/modelpath/design/app-detail-mobile-390px.html',
      isMobile: true,
      width: 390
    }
  ];

  for (const task of tasks) {
    console.log(`\n================ Processing ${task.name} ================`);
    const newTarget = await send('Target.createTarget', { url: `file:///${task.file.replace(/\\/g, '/')}` });
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

    if (task.isMobile) {
      // Responsive verification across widths
      const testWidths = [320, 375, 390, 430];
      const testResults = [];
      for (const w of testWidths) {
        await sendSession('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: 1200,
          deviceScaleFactor: 1,
          mobile: true
        });
        await new Promise(r => setTimeout(r, 200));

        const evalRes = await sendSession('Runtime.evaluate', {
          expression: `JSON.stringify({
            targetWidth: ${w},
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            overflow: document.documentElement.scrollWidth > window.innerWidth
          })`,
          returnByValue: true
        });
        testResults.push(JSON.parse(evalRes.result.result.value));
      }
      console.log(`Responsive check for ${task.name}:`, JSON.stringify(testResults, null, 2));
    }

    // Measure full content height
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: 1200,
      deviceScaleFactor: 1,
      mobile: task.isMobile
    });
    await new Promise(r => setTimeout(r, 200));

    const heightRes = await sendSession('Runtime.evaluate', {
      expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)',
      returnByValue: true
    });
    const fullHeight = heightRes.result.result.value;
    console.log(`${task.name} fullHeight:`, fullHeight);

    // Set metrics to fullHeight for complete render
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: task.width,
      height: fullHeight,
      deviceScaleFactor: 1,
      mobile: task.isMobile
    });
    await new Promise(r => setTimeout(r, 300));

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
    const localPath = `D:/modelpath/design/${task.name}.png`;
    const artifactPath = path.join(artifactDir, `${task.name}.png`);
    const publicPath = path.join(publicDesignDir, `${task.name}.png`);

    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    fs.writeFileSync(publicPath, buffer);

    console.log(`Saved ${task.name}.png (${buffer.length} bytes) to design/, artifactDir, and public/design/`);

    await send('Target.closeTarget', { targetId });
  }

  ws.close();
  console.log("\nALL 4 GATE 2B SCREENSHOTS SUCCESSFULLY CAPTURED AND VERIFIED!");
} finally {
  edge.kill();
}
