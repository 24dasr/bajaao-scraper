import puppeteer from 'puppeteer';

async function testScrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(60000);
    console.log('Navigating to Bajaao...');
    await page.goto('https://www.bajaao.com/collections/electric-guitars', { waitUntil: 'networkidle2' });

    console.log('Page loaded. Extracting products...');

    // Try to find product elements. Let's look for standard Shopify classes
    const products = await page.evaluate(() => {
        let items = Array.from(document.querySelectorAll('.product-item'));
        if (items.length === 0) {
            items = Array.from(document.querySelectorAll('.grid-item'));
        }
        if (items.length === 0) {
            items = Array.from(document.querySelectorAll('a[href*="/products/"]'));
        }

        return items.slice(0, 3).map(el => {
            // Find the closest div with a class that looks like a product card
            let parent = el.parentElement;
            let classes = [];
            while (parent && parent.tagName !== 'BODY' && classes.length < 5) {
                if (parent.className) classes.push(parent.className);
                parent = parent.parentElement;
            }
            return {
                parentClasses: classes,
                href: el.href
            };
        });
    });

    console.log(`Found ${products.length} products (sample showing 3):`);
    console.log(JSON.stringify(products, null, 2));

    await browser.close();
}

testScrape().catch(console.error);
