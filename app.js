const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = 3004;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/harvest', (req, res) => {
  const { keyword, numTweets } = req.body;
  const token = "753c3386415a2de82a51b27a2e4ffd934533ad62";
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS
  const keywordFix = keyword.replace(/[ ;&:]+/g, '_'); // remove spaces, underscores, ampersands, and colons
  const outputFile = `${keywordFix}-${timestamp}.csv`;

  // Execute tweet-harvest with user inputs
  exec(`npx --yes tweet-harvest@latest -o "${outputFile}" -s "${keyword}" -l ${numTweets} --token "${token}"`, { cwd: '/app/data' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'An error occurred while harvesting tweets.' });
    }

    // Redirect to the JSON return page
    res.redirect(`/return/${keywordFix}-${timestamp}`);
  });
});

app.get('/return/:filename', (req, res) => {
  const filename = req.params.filename;
  const results = [];

  fs.createReadStream(path.join('/app/data/tweets-data', `${filename}.csv`))
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);  // Send JSON response directly
    })
    .on('error', (error) => {
      console.error(`Error reading CSV file: ${error}`);
      res.status(500).json({ error: 'An error occurred while processing the CSV file.' });
    });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
