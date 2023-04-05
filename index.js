const axios = require("axios");
const cheerio = require("cheerio");
const fsExtra = require("fs-extra");
const TurndownService = require("turndown");
const path = require("path");
const fs = require("fs");
const URL = require("url");

const baseURL = "https://newskit.co.uk";

const outputDir = path.join(__dirname, "output");

async function crawlPage(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    $('[data-testid="nav-container"]').remove();
    $('[data-testid="dialog-content"]').remove();
    $('nav,script,header,footer,style').remove();
    
    const turndownService = new TurndownService();
    //turndownService.remove("style", "svg", "footer", "script", "header");
    const markdown = turndownService.turndown($.html());
    return markdown;
  } catch (error) {
    console.error(error);
  }
}

async function crawlSite() {
  const response = await axios.get(baseURL);
  const $ = cheerio.load(response.data);
  const links = $('a[href^="/"]');
  links.each(async function () {
    const url = `${baseURL}${$(this).attr("href")}`;
    const markdown = await crawlPage(url);
    const fileName = `${URL.parse(url).path.slice(0, -1)}.md`;

    const filePath = path.join(outputDir, fileName);
    fsExtra.outputFile(filePath, markdown, (err) => {
      if (err) throw err;
      console.log(`File ${fileName} saved successfully!`);
    });
  });
}

(async () => {
  fsExtra.emptyDirSync(outputDir);
  await crawlSite();
})();
