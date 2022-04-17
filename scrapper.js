const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const pretty = require('pretty');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriterWithoutBody = createCsvWriter({
  path: './data/ProductsWithoutBody.csv',
  header: [
    { id: 'Title', title: 'Title' },
    { id: 'Vendor', title: 'Vendor' },
    { id: 'Price', title: 'Price' },
    { id: 'MRP', title: 'MRP' },
    { id: 'Images', title: 'Images' },
    { id: 'Url', title: 'Url' },
  ],
});

const csvWriterWithBody = createCsvWriter({
  path: './data/ProductsWithBody.csv',
  header: [
    { id: 'Title', title: 'Title' },
    { id: 'Body', title: 'Body' },
    { id: 'Vendor', title: 'Vendor' },
    { id: 'Price', title: 'Price' },
    { id: 'MRP', title: 'MRP' },
    { id: 'Images', title: 'Images' },
    { id: 'Url', title: 'Url' },
  ],
});

const productDetails = [];

const scrape = async URL => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL);
  await page.waitForSelector('div.prodDiv');

  let lastHeight = await page.evaluate('document.body.scrollHeight');

  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(2000);
    let newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }

  const urlPromises = (await page.$$('div.prodDiv')).map(async product => {
    const URL = await product.$eval('a', a => a.href);
    return Promise.resolve(URL);
  });

  const productURLS = await Promise.all(urlPromises);

  for (let i = 0; i < productURLS.length; i++) {
    let productImages = new Set();
    let productTitle, productBody, productPrice, productMrp;

    try {
      await page.goto(productURLS[i]);
      await page.waitForSelector('img');

      const html = await page.content();
      const $ = cheerio.load(html);

      productTitle = $('h1.titleFontFamily > span').text();
      productBody = pretty($.html());

      for (let j = 0; j < 4; j++) {
        $('img.prodProductDiv').each(function (i, img) {
          let thing = $(img).attr('src');
          productImages.add(thing);
        });
        await page.$eval(
          '#__next > div > div.d-none.d-md-block > div.container > div.pt-3.shadow > div:nth-child(1) > div > div.col-3.col-lg-3.product2DesktopSwatchWrapper > div > div:nth-child(2)',
          el => el.click()
        );
      }

      productPrice = $('span[style="font-size: 18px;"]').text().split(' ')[1];
      productMrp = $('span[style="font-size: 18px; text-decoration: line-through;"]')
        .text()
        .split(' ')[1];
    } catch (err) {
      productTitle = null;
      productBody = null;
      productPrice = null;
      productMrp = null;
      productImages = [];
    }

    productDetails.push({
      Title: productTitle,
      Body: productBody,
      Vendor: 'Sugar Cosmetics',
      Price: productPrice || 'null',
      MRP: productMrp || 'null',
      Images: [...productImages],
      Url: productURLS[i],
    });
  }
  console.log(`--- ${URL} scraping done ---`);
  browser.close();
};

(async () => {
  console.log('');

  await Promise.all([
    scrape('https://sugarcosmetics.com/makeup/lips-makeup'),
    scrape('https://sugarcosmetics.com/makeup/face-makeup'),
    scrape('https://sugarcosmetics.com/makeup/eye-makeup'),
    scrape('https://sugarcosmetics.com/blend-trend-makeup-brush'),
    scrape('https://sugarcosmetics.com/collections/merch-station'),
    scrape('https://sugarcosmetics.com/collections/kit-collection'),
    scrape('https://sugarcosmetics.com/sugar-clearance'),
    scrape('https://sugarcosmetics.com/sugar-cosmetics-gifts-boxes'),
  ]);

  console.log(`\nTotal scrapped products: ${productDetails.length}`);

  csvWriterWithBody
    .writeRecords(productDetails) // returns a promise
    .then(() => {
      console.log('Created CSV file With_Body successfully');
    });

  csvWriterWithoutBody
    .writeRecords(productDetails) // returns a promise
    .then(() => {
      console.log('\nCreated CSV file With_out_Body successfully');
    });
})();

/**
 ** TRY 1
 */

// const title = await product.$eval('p', p => p.innerHTML);
// const sellingPrice = await product.$eval('div.text-muted', div => div.innerHTML);
// const MRP = await product.$eval('div.collPrice', div => div.innerHTML);

// const page2 = await browser.newPage();
// await page2.goto(URL);
// await page2.waitForTimeout(2000);
// const title2 = await page2.$eval('h1.titleFontFamily', h1 => h1.innerHTML);
// console.log(title2);

// const productTitle = await page.evaluate(() => {
//   const element = document.querySelector('.titleFontFamily > span');
//   return element && element.innerText; // will return undefined if the element is not found
// });

// const productTitle = await page.$(
//   '#__next > div > div.d-none.d-md-block > div.container > div.pt-3.shadow > div:nth-child(1) > div > div.col-12.col-lg-5.d-flex > div > h1 > span',
//   span => span.innerText
// );

// await page.goto('https://sugarcosmetics.com/products/matte-as-hell-crayon-lipstick');
// await page.waitForSelector('img');
// const html = await page.content();
// console.log(html);

// const productsHTMLPromises = productURLS.map(async URL => {
//   console.log(URL);
// });

// const productsHTML = await Promise.all(productsHTMLPromises);

// console.log(productsHTMLPromises);
// console.log(productsHTML);

/**
 ** TRY 2
 */

// const productTitle =
//   'Sugar Cosmetics ' + (await page.$eval('.titleFontFamily > span', h1 => h1.innerHTML));

// let productPrice, productMrp;

// try {
//   productPrice = await page.$eval('span[style="font-size: 18px;"]', span => span.innerText);
// } catch (err) {
//   productPrice = null;
// }

// try {
//   productMrp = await page.$eval(
//     'span[style="font-size: 18px; text-decoration: line-through;"]',
//     span => span.innerText
//   );
// } catch (err) {
//   productMrp = null;
// }

// const productImages = await page.$$eval('.prodProductDiv', images =>
//   images.map(img => img.src)
// );
