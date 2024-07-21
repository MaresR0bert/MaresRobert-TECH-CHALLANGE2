// app.js
const express = require('express');
const fileSystem = require('fs');
const csvParser = require('csv-parser');
const app = express();

/**
 * First Function in Requirements, used to read CSV and Parse values
 */
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

        /**
         * Read all selected csv files asynchroniously, then forecasting the values using Simple Moving Average
         */
        selectedFiles.forEach((elem, index) => {
            fileSystem.createReadStream('./'+ stock + '/' + elem +'.csv')
            .pipe(csvParser(['StockID', 'Timestamp', 'Price']))
            .on('data', (row) => {
                readData[index].push(row);
            })
            .on('end', () => {
                const randomElementIndex = Math.floor(Math.random() * (readData[index].length - 10));
                const valuesToForecat = readData[index].slice(randomElementIndex, randomElementIndex + 10);

                const forecast = applySimpleMovingAverage(valuesToForecat);
                fileSystem.writeFileSync(elem + "-forecasted.csv", forecast.map(elemF => elemF.StockID + ',' + elemF.Timestamp + ',' + elemF.Price).join('\n'), 'utf8');
            })
        })

        return res.send('Stock: ' + stock + " Number: " + numberOfFiles);
    });
});

/**
 * Second Function in Requirements, used to forecast the next three values in the timeseries using Simple Moving Average.
 * 
 * Simple Moving Average uses the last N values (where N is a natural number) as elements of an arithmetic average, for which the result will be
 * considered as the forecasted value of the next element.
 * 
 * Having a small sample of only 10 values the recommended amount of elements in the arithmetic average is about 3
 */
const applySimpleMovingAverage = timeSeries => {
    for(let i = 0; i < 3; i++) {
        const tsLength = timeSeries.length;
        
        // Arithmetic average and string parsing to number
        const forcastedPrice = (parseInt(timeSeries[tsLength - 1].Price) + parseInt(timeSeries[tsLength - 2].Price) + parseInt(timeSeries[tsLength - 3].Price)) / 3;

        // Fixing Date format to respect dd-mm-yyyy
        const [dayStr, monthStr, yearStr] = timeSeries[tsLength - 1].Timestamp.split('-');
        const fullDateObj = new Date(yearStr, monthStr - 1, dayStr); // Months are stored as indexes with base 0 so a correction is needed
        fullDateObj.setDate(fullDateObj.getDate() + 1); // Adding one extra day

        // Formatting Date back to string of format dd-mm-yyyy
        const newDayStr = fullDateObj.getDate().toString().padStart(2, '0');
        const newMonthStr = (fullDateObj.getMonth() + 1).toString().padStart(2, '0'); // Same correction for months
        const newYearStr = fullDateObj.getFullYear();

        const newDateStr = newDayStr + '-' + newMonthStr + '-' + newYearStr; // Formatting string to respect date format in Requirements

        timeSeries.push({
            'StockID': timeSeries[0].StockID,
            'Timestamp': newDateStr,
            'Price': forcastedPrice.toFixed(2)
        });
    }
    return timeSeries;
}

// Start the server
const usePort = 3001;
app.listen(usePort, () => {
    console.log("SERVER ON @ port: " + usePort);
});
