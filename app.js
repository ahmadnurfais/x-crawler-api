const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = 3004;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/harvest', (req, res) => {
  const { keyword, numTweets, isLink } = req.body;
  const token = "53324f050f520976b4c419c7b0009962eb4551b7";
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS
  const keywordFix = keyword.replace(/[^a-zA-Z0-9-_]/g, '_'); // Replace non-alphanumeric chars with underscore
  const outputFile = `${keywordFix}-${timestamp}.csv`;
  const outputFilePath = path.join('/app/data/tweets-data', outputFile);

  // Prepare the command based on whether the input is a link or a keyword
  let command;
  if (isLink === 'true') {
    command = `npx --yes tweet-harvest@latest -o "${outputFile}" -s "A" --thread "${keyword}" -l ${numTweets} --token "${token}"`;
  } else {
    command = `npx --yes tweet-harvest@latest -o "${outputFile}" -s "${keyword}" -l ${numTweets} --token "${token}"`;
  }

  // Execute the tweet-harvest command
  exec(command, { cwd: '/app/data' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error.message}`);
      return res.status(500).json({ error: 'An error occurred while harvesting tweets.', details: stderr || stdout });
    }

    // Check if the output CSV file exists before reading
    fs.access(outputFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, return an error message along with the command output
        console.error(`File does not exist: ${outputFilePath}`);
        return res.status(500).json({
          error: 'An error occurred while processing the CSV file. File not found.',
          commandOutput: stderr || stdout,
        });
      }

      // If file exists, read and return the harvested data
      const results = [];
      fs.createReadStream(outputFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          res.json(results); // Send JSON response directly
        })
        .on('error', (error) => {
          console.error(`Error reading CSV file: ${error.message}`);
          res.status(500).json({ error: 'An error occurred while processing the CSV file.' });
        });
    });
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
