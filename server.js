const express = require('express');
const fileSystem = require('fs');
const csvParser = require('csv-parser');
const archiver = require('archiver');
const app = express();

/**
 * First Function in Requirements, used to read CSV and Parse values
 */
app.get('/:number', async (req, res) => {

    var numberOfFiles = parseInt(req.params.number);
    const stockExchanges = ['LSE', 'NASDAQ', 'NYSE'];
    var selectedFiles = [];

    if (numberOfFiles !== 1 && numberOfFiles !== 2) {
        return res.status(404).send(`<script> alert("1 or 2 are the only permitted values for the number of files to be computed.") </script>`);
    }

    /**
     * Get files according to volume intended
     */
    stockExchanges.forEach(stockEx => {
        const foundCsvFiles = fileSystem.readdirSync('./' + stockEx).filter(file => file.endsWith('.csv'));
        const requiredFilesNumber = numberOfFiles > foundCsvFiles.length ? foundCsvFiles.length : numberOfFiles;
        foundCsvFiles.slice(0, requiredFilesNumber).map(elem => elem = elem.split('.')[0]).forEach(file => {
            selectedFiles.push(stockEx + '/' + file);
        })
    });

    // Declare matrix to store data
    const readData = [];
    selectedFiles.forEach(() => readData.push([]));

    /**
     * Read all selected csv files asynchroniously, then forecasting the values using Simple Moving Average
     */
    const promiseQueue = selectedFiles.map((elem, index) => {
        return new Promise((resolve, reject) => {
            fileSystem.createReadStream('./' + elem + '.csv')
                .pipe(csvParser(['StockID', 'Timestamp', 'Price']))
                .on('data', (row) => {
                    readData[index].push(row);
                })
                .on('end', () => {
                    const randomElementIndex = Math.floor(Math.random() * (readData[index].length - 10));
                    const valuesToForecat = readData[index].slice(randomElementIndex, randomElementIndex + 10);

                    const forecast = applySimpleMovingAverage(valuesToForecat);

                    const forecastedFileName = elem.replace('/', "_") + "-forecasted.csv";
                    fileSystem.writeFileSync(forecastedFileName,
                        forecast.map(elemF => elemF.StockID + ',' + elemF.Timestamp + ',' + elemF.Price).join('\n'),
                        'utf8');
                    resolve(forecastedFileName);
                })
        })
    })

    const forecastedFiles = await Promise.all(promiseQueue);

    if (forecastedFiles.length === 0) {
        return res.status(404).send(`<script> alert("There are no stocks in database") </script>`);
    }

    // Create archive if more then one file
    if (forecastedFiles.length > 1) {
        const outputZip = fileSystem.createWriteStream('./forecastedFile.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });

        forecastedFiles.forEach(elem => {
            const finalFileName = elem;
            archive.file(finalFileName, { name: finalFileName });
        })

        archive.finalize();
        outputZip.on('close', () => {
            // Download Archive
            res.download('./forecastedFile.zip')
        })
        archive.pipe(outputZip)
    } else if (forecastedFiles.length === 1) {
        // Download CSV file
        res.download(forecastedFiles[0]);
    }
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
    for (let i = 0; i < 3; i++) {
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
const usePort = 7777;
app.listen(usePort, () => {
    console.log("SERVER ON @ port: " + usePort);
});
