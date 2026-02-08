const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scanWebsite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const stylesDir = path.join(__dirname, 'style-analysis');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir);
  }

  try {
    console.log('Navigating to Pearly Nails website...');
    await page.goto('https://pearlynailscomox.square.site/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Take full page screenshot of home
    console.log('Capturing homepage...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage-full.png'),
      fullPage: true
    });

    // Extract font information from homepage
    const fontInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, span');
      const styles = new Map();

      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const className = el.className || 'no-class';
        const key = `${tag}.${className}`;

        if (!styles.has(key)) {
          styles.set(key, {
            tag,
            className,
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            color: computed.color,
            textTransform: computed.textTransform,
            letterSpacing: computed.letterSpacing
          });
        }
      });

      return Array.from(styles.values());
    });

    fs.writeFileSync(
      path.join(stylesDir, 'font-styles.json'),
      JSON.stringify(fontInfo, null, 2)
    );

    // Extract color palette
    const colorInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Set();
      const bgColors = new Set();

      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.color) colors.add(computed.color);
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          bgColors.add(computed.backgroundColor);
        }
      });

      return {
        textColors: Array.from(colors),
        backgroundColors: Array.from(bgColors)
      };
    });

    fs.writeFileSync(
      path.join(stylesDir, 'color-palette.json'),
      JSON.stringify(colorInfo, null, 2)
    );

    // Find all navigation links
    console.log('Finding navigation links...');
    const links = await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('a[href]'));
      return navLinks
        .map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
        .filter(link => link.href.includes('pearlynailscomox.square.site'));
    });

    console.log(`Found ${links.length} internal links`);

    // Get unique pages
    const uniquePages = [...new Set(links.map(l => l.href))];
    console.log('Unique pages:', uniquePages);

    // Take mobile screenshot of home
    await context.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage-mobile.png'),
      fullPage: true
    });

    // Visit each unique page
    let pageNum = 2;
    for (const url of uniquePages.slice(0, 10)) { // Limit to 10 pages
      if (url === 'https://pearlynailscomox.square.site/') continue;

      try {
        console.log(`\nVisiting: ${url}`);

        // Desktop screenshot
        await context.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const pageName = url.split('/').filter(p => p).pop() || 'page';
        await page.screenshot({
          path: path.join(screenshotsDir, `${String(pageNum).padStart(2, '0')}-${pageName}-desktop.png`),
          fullPage: true
        });

        // Mobile screenshot
        await context.setViewportSize({ width: 375, height: 812 });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(screenshotsDir, `${String(pageNum).padStart(2, '0')}-${pageName}-mobile.png`),
          fullPage: true
        });

        pageNum++;
      } catch (error) {
        console.log(`Error visiting ${url}:`, error.message);
      }
    }

    console.log('\n✓ Screenshots saved to ./screenshots/');
    console.log('✓ Style analysis saved to ./style-analysis/');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

scanWebsite();
