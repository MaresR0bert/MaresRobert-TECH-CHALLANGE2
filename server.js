// app.js
const express = require('express');
const fileSystem = require('fs');
const csvParser = require('csv-parser');
const archiver = require('archiver');
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
    fileSystem.readdir('./'+ stock, async (error, foundFiles) => {
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


        // Extra Validation
        if (selectedFiles.length === 0) {
            return res.send(`<script> alert("No values in Stock: ${stock}") </script>`);
        }

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

                // Apply SimpleMovingAverage
                const forecast = applySimpleMovingAverage(valuesToForecat);

                // Write new csv files with forecasted values
                fileSystem.writeFileSync(elem + "-forecasted.csv", forecast.map(elemF => elemF.StockID + ',' + elemF.Timestamp + ',' + elemF.Price).join('\n'), 'utf8');
            })
        })
        
        // FIXME: Quick fix to resolve Async
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create archive if more then one file
        if (selectedFiles.length > 1) {
            const outputZip = fileSystem.createWriteStream('./forecastedFile.zip');
            const archive = archiver('zip', {zlib: {level: 9}});

            selectedFiles.forEach(elem => {
                const finalFileName = elem + '-forecasted.csv';
                archive.file(finalFileName, {name: finalFileName});
            })

            archive.finalize();
            outputZip.on('close', () => {
                // Download Archive
                res.download('./forecastedFile.zip')
            })
            archive.pipe(outputZip)
        } else {
            // Download CSV file
            res.download(selectedFiles[0] + '-forecasted.csv');
        }
        // const awaitedForecastedFiles = await new Promise((resolve) => {
        //     const forecastedFiles = [];
        //     //selectedFiles.forEach((elem, index) => {
        //         fileSystem.createReadStream('./'+ stock + '/' + selectedFiles[0] +'.csv')
        //         .pipe(csvParser(['StockID', 'Timestamp', 'Price']))
        //         .on('data', (row) => {
        //             readData[0].push(row);
        //         })
        //         .on('end', () => {
        //             const randomElementIndex = Math.floor(Math.random() * (readData[0].length - 10));
        //             const valuesToForecat = readData[0].slice(randomElementIndex, randomElementIndex + 10);
    
        //             const forecast = applySimpleMovingAverage(valuesToForecat);
        //             fileSystem.writeFileSync(selectedFiles[0] + "-forecasted.csv", forecast.map(elemF => elemF.StockID + ',' + elemF.Timestamp + ',' + elemF.Price).join('\n'), 'utf8');
        //             forecastedFiles.push(selectedFiles[0] + '-forecasted.csv');
        //             resolve(forecastedFiles);
        //         })
        //     //})
        // });

        // return res.send('Stock: ' + stock + " Number: " + numberOfFiles);
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
