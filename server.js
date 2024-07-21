// app.js
const express = require('express');
const fileSystem = require('fs');
const csvParser = require('csv-parser');
const app = express();

app.get('/:stock/:number', (req, res) => {

    const stock = req.params.stock;
    var numberOfFiles = req.params.number;
    var selectedFiles = [];

    /**
     * Read all files in stock directory
     */
    fileSystem.readdir('./'+ stock, (error, foundFiles) => {
        if(error) {
            // return alert pop-up if stock does not exist
            return res.send(`<script> alert("Stock ${stock} was not found") </script>`);
        }

        // Filter files in stock directory to only fetch .csv files
        foundFiles = foundFiles.filter(file => file.endsWith('.csv'));

        /**
         * Citetion from Requirements:
         * If there aren’t enough files present for a given exchange, process whatever number of files are present even if it is lower.
         */
        numberOfFiles = numberOfFiles > foundFiles.length ? foundFiles.length : numberOfFiles;

        // Get the exact number of files and remove extention
        selectedFiles = foundFiles.slice(0, numberOfFiles).map(elem => elem = elem.split('.')[0]);

        // Declare matrix to store data
        const readData = [];
        selectedFiles.forEach(() => readData.push([]));

        selectedFiles.forEach((elem, index) => {
            fileSystem.createReadStream('./'+ stock + '/' + elem +'.csv')
            .pipe(csvParser(['StockID', 'Timestamp', 'Price']))
            .on('data', (row) => {
                readData[index].push(row);
            })
            .on('end', () => {
                const randomElementIndex = Math.floor(Math.random() * (readData[index].length - 10));
                const valuesToForecat = readData[index].slice(randomElementIndex, randomElementIndex + 10);
                console.log(valuesToForecat);
            })
        })

        return res.send('Stock: ' + stock + " Number: " + numberOfFiles);
    });
});

// Start the server
const usePort = 3001;
app.listen(usePort, () => {
    console.log("SERVER ON @ port: " + usePort);
});
