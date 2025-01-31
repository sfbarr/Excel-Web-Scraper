// const urls = [                  // All 200 urls (eventually)
//   'https://pmc.ncbi.nlm.nih.gov/articles/PMC10445503/',
//   'https://www.research.va.gov/about/funded_research/proj-details-FY2022.cfm?pid=652987'
// ];
// OLD IMPORTS

// CURRENT IMPORTS
import fetch from 'node-fetch'; // Import fetch
import * as cheerio from 'cheerio';
import * as punycode from 'punycode/punycode.js';

import * as XLSX from 'xlsx'; // Import XLSX library to read Excel files
import { readFileSync } from 'fs'; // Import fs to read the Excel file
import fs from 'node:fs/promises'; // write to file

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { stringify } from 'querystring';


// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'GrantsURLs.xlsx'); 

// Log the file path to check if it's correct
console.log('Looking for Excel file at:', filePath);

// Function to read URLs from the Excel file
function readURLsFromExcel(filePath) {

  // Read the file content as a binary string (Buffer) & translate
  const fileBuffer = readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0]; // URLs are in the first (only) sheet
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet data to a 2D array
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Extract URLs from the second column (index 1)
  const urls = data.slice(1) // Skip header row, start at 2nd row
    .map(row => row[1]) // Get the second column (URLs)
    .filter(Boolean); // Filter out empty values

  return urls;
}





// (OLD) Function to read URLs from the Excel file
// function readURLsFromExcel(filePath) {
//   const workbook = XLSX.readFile(filePath);
//   const sheetName = workbook.SheetNames[0]; // Assuming the URLs are in the first sheet
//   const sheet = workbook.Sheets[sheetName];
//   const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read as a 2D array

//   // Extract URLs from the second column (index 1)
//   const urls = data.slice(1).map(row => row[1]).filter(Boolean); // Skip header and filter empty rows
//   return urls;
// }

async function scrapeSites(urls) {

  const listOfFunds = [];

  for (const url of urls) {
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // const abstract = $('div.abstract').next().text().trim();
    
      
      /* Only looks for <td> tag */

      // var dollarAmount = $('td').filter
      // (function() 
      // { 
      //   return $(this).text().includes('$');  
      // })
      // .text();

     // Initialize the variable to store the result
      let dollarAmount = null;

     // Search for the first element containing a dollar amount
      $("td, b, div").each((_, el) => {     // Checks any: <td>, <b>, or <div>.
        const text = $(el).text().trim();

        // Match `$`, then 1-15 digits, then any number of the [comma]+3-digit pattern, and a decimal followed by 1 or 2 digits
        const match = text.match(/\$\d{1,15}(,\d{3})*(\.\d{1,2})?/); // Regex

        if (match) {
          dollarAmount = match[0]; // Capture the first match
          return false; // Stop further iterations once a match is found
        }
      });

      if (dollarAmount) {
        let dollarNoSign = dollarAmount.trim().replace(/^\$/, ""); // get rid of $
        dollarNoSign = dollarNoSign.replace(/,/g, "");  // get rid of all commas

        let dollar = parseInt(dollarNoSign); // Turn string of nums to int
        totalFunding += dollar;
      
        // Push values to listOfFunds[]
        let fund = {};
        fund[url] = dollar;
        listOfFunds.push(fund);
        console.log(`${url}: ${dollar}`);
      } else {
        console.log(`No dollarAmount found at ${url}`);
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
    }
  }

  return listOfFunds;
}

var totalFunding = 0.00;

(async () => {
  const urls = readURLsFromExcel(filePath);
  console.log(`Loaded ${urls.length} URLs from Excel file.`);

  const results = await scrapeSites(urls);
  // console.log("Scraping complete! Results: \n", results);
  
  try {
    fs.writeFile('funding.txt',  JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nTotal funding: ` + totalFunding);
  } catch (err) {
    console.log(err);
  }

})();


