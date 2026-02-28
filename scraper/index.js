import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const BAJAAO_URL = 'https://www.bajaao.com/collections/electric-guitars';
const DATA_FILE = path.join(process.cwd(), 'data', 'guitars.json');

async function scrapeGuitars() {
    console.log('Starting Puppeteer scraper with Robust Infinite Scroll...');

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    // Increase timeout to handle slow loading
    page.setDefaultNavigationTimeout(120000);

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        console.log(`Navigating to ${BAJAAO_URL}...`);
        await page.goto(BAJAAO_URL, { waitUntil: 'networkidle2' });

        console.log('Scrolling to load all items...');

        let previousHeight = 0;
        let currentHeight = await page.evaluate('document.body.scrollHeight');
        let scrollAttempts = 0;
        const maxAttempts = 50; // Safety limit
        let itemsCount = 0;

        while (scrollAttempts < maxAttempts) {
            previousHeight = currentHeight;

            // Scroll down in smaller steps to be protocol-friendly
            await page.evaluate(() => window.scrollBy(0, 800));
            await new Promise(r => setTimeout(r, 2000)); // Wait for content load

            currentHeight = await page.evaluate('document.body.scrollHeight');

            const currentItems = await page.evaluate(() =>
                document.querySelectorAll('.wizzy-result-product, .product-card, .product-item').length
            );

            console.log(`Scroll attempt ${scrollAttempts + 1}: Found ${currentItems} visible items (Height: ${currentHeight})`);

            if (currentItems === itemsCount && previousHeight === currentHeight) {
                // If items and height haven't changed, try one last deep scroll
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await new Promise(r => setTimeout(r, 4000));
                currentHeight = await page.evaluate('document.body.scrollHeight');
                const lastCheck = await page.evaluate(() =>
                    document.querySelectorAll('.wizzy-result-product, .product-card, .product-item').length
                );
                if (lastCheck === currentItems && previousHeight === currentHeight) {
                    console.log('No more items loading. Stopping scroll.');
                    break;
                }
            }

            itemsCount = currentItems;
            scrollAttempts++;
        }

        console.log('Extraction starting...');
        const products = await page.evaluate(() => {
            let items = Array.from(document.querySelectorAll('.wizzy-result-product, .product-card, .product-item, .grid-item'));

            // Fallback for containers if needed
            if (items.length < 50) {
                const productLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
                const containers = new Set();
                productLinks.forEach(link => {
                    let parent = link.parentElement;
                    let depth = 0;
                    while (parent && parent.tagName !== 'BODY' && depth < 10) {
                        if (parent.querySelector('img') && (parent.innerText.match(/\d/) || parent.querySelector('.price'))) {
                            containers.add(parent);
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                });
                if (containers.size > items.length) {
                    items = Array.from(containers);
                }
            }

            return items.map(el => {
                const urlNode = el.querySelector('a[href*="/products/"]');
                const productUrl = urlNode && urlNode.href ? urlNode.href : '';

                let name = '';
                const titleNode = el.querySelector('.product-item__title, .grid-item__title, .wizzy-product-item-title, h3, .title, [class*="title"]');
                if (titleNode) {
                    name = titleNode.innerText.trim();
                } else if (urlNode && urlNode.innerText.trim()) {
                    name = urlNode.innerText.trim();
                } else {
                    name = (el.innerText || '').trim().split('\n')[0];
                }

                let brand = '';
                const vendorNode = el.querySelector('.product-item__vendor, .wizzy-product-item-brand, .vendor, [class*="brand"], [class*="vendor"]');
                if (vendorNode) {
                    brand = vendorNode.innerText.trim();
                } else {
                    const nameParts = name.split(' ');
                    if (nameParts.length > 0) brand = nameParts[0];
                }

                const imgNode = el.querySelector('img');
                let imageUrl = '';
                if (imgNode) {
                    imageUrl = imgNode.getAttribute('data-src') || imgNode.getAttribute('src') || '';
                    if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
                }

                const currentPriceNode = el.querySelector('.price--highlight, .price-item--sale, .wizzy-product-item-price-current, .price, .wizzy-product-item-price');
                let currentPriceText = currentPriceNode ? currentPriceNode.innerText.trim() : '';

                const originalPriceNode = el.querySelector('del, s, .price-item--regular, .price--compare-at, .wizzy-product-item-mrp');
                let originalPriceText = originalPriceNode ? originalPriceNode.innerText.trim() : '';

                const parsePrice = (text) => {
                    if (!text) return null;
                    // Remove commas and then find the FIRST sequence of digits.
                    // This prevents merging multiple prices (e.g. Current + MRP) into one giant number.
                    const match = text.replace(/,/g, '').match(/\d+/);
                    return match ? parseInt(match[0], 10) : null;
                };

                const currentPrice = parsePrice(currentPriceText);
                const originalPrice = parsePrice(originalPriceText) || currentPrice;

                const availabilityText = el.innerText.toLowerCase();
                const inStock = !availabilityText.includes('out of stock') && !availabilityText.includes('sold out');

                let discountPercent = 0;
                if (originalPrice && currentPrice && originalPrice > currentPrice) {
                    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                }

                let id = '';
                if (productUrl) {
                    id = productUrl.split('/').pop().split('?')[0];
                } else {
                    id = name.replace(/\s+/g, '-').toLowerCase();
                }

                return {
                    id,
                    name: name || 'Unknown Guitar',
                    brand,
                    currentPrice: currentPrice || 0,
                    originalPrice: originalPrice || currentPrice || 0,
                    discountPercent,
                    imageUrl,
                    productUrl,
                    inStock
                };
            }).filter(item => item.productUrl && item.name !== 'Unknown Guitar');
        });

        console.log(`Scraper successfully extracted ${products.length} unique items.`);

        if (products.length > 0) {
            await updateDataFile(products);
        }

    } catch (error) {
        console.error('Scraper Error:', error);
    } finally {
        await browser.close();
    }
}

async function updateDataFile(scrapedGuitars) {
    let existingData = [];
    try {
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Error reading existing data:', error);
    }

    const timestamp = new Date().toISOString();
    const guitarMap = new Map();
    existingData.forEach(g => guitarMap.set(g.id, g));

    let updatedCount = 0;
    let addedCount = 0;

    scrapedGuitars.forEach(g => {
        if (guitarMap.has(g.id)) {
            const existing = guitarMap.get(g.id);
            Object.assign(existing, {
                name: g.name,
                brand: g.brand,
                imageUrl: g.imageUrl,
                productUrl: g.productUrl,
                inStock: g.inStock,
                currentPrice: g.currentPrice,
                originalPrice: g.originalPrice,
                discountPercent: g.discountPercent
            });

            const lastHistoryEntry = existing.priceHistory[existing.priceHistory.length - 1];
            if (!lastHistoryEntry || lastHistoryEntry.price !== g.currentPrice) {
                existing.priceHistory.push({ date: timestamp, price: g.currentPrice });
                updatedCount++;
            }
        } else {
            g.priceHistory = [{ date: timestamp, price: g.currentPrice }];
            g.firstSeen = timestamp;
            guitarMap.set(g.id, g);
            addedCount++;
        }
    });

    const finalData = Array.from(guitarMap.values());
    await fs.writeFile(DATA_FILE, JSON.stringify(finalData, null, 2));
    console.log(`Saved ${finalData.length} records. (${addedCount} new, ${updatedCount} updated)`);
}

scrapeGuitars().catch(console.error);
