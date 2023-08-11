
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', async (req, res) => {
    const searchTerm = req.body.term;
    const url = 'https://www.italgiure.giustizia.it/sncass/';

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(url);
        
        await page.type('#searchterm', searchTerm);
        await page.click('button[title="Avvia ricerca"]');
        
        await page.waitForTimeout(5000);

        const results = await page.$$eval('h3.doctitle', h3Elements => {
            return h3Elements.map(h3 => {
                const linkElement = h3.querySelector('.toDocument.pdf');
                const link = linkElement ? "https://www.italgiure.giustizia.it" + decodeURIComponent(linkElement.getAttribute('data-arg')) : null;

                const section = h3.querySelector('.risultato[data-role="content"][data-arg="szdec"]')?.textContent;
                const type = h3.querySelector('[data-role="content"][data-arg="tipoprov"]')?.textContent;
                const number = h3.querySelector('.chkcontent [data-role="content"][data-arg="numcard"]')?.textContent;
                const date = h3.querySelector('.chkcontent [data-role="content"][data-arg="datdep"]')?.textContent;

                return {
                    link,
                    section,
                    type,
                    number,
                    date
                };
            });
        });

        await browser.close();

        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
