# Mares Robert - Tech Challange (Challange 2)
### Date: 21st of July 2024
---
<br/>

**Declaration:**
<br/>
I herby declare that the presented solution is in its entirety the result of my own work, analysis and research.
<br/>
<br/>

**Required software to run the solution:**
* Node.js version 20.12.2 or later
* Any internet browser with access to localhost:7777
* Any software that may open a CSV file in order to verify the result
<br/>
<br/>

**How to run the solution:**
<br/>
1. Run `npm install` in the terminal in order to generate node_modules file required for the solution to run.
2. Run `node server.js` in order to start the API.
<br/>
<br/>
<br/>

**How to test the solution:**
* In order to test the solution the user may access the API through an internet browser's Address bar.
* The server is running on port 7777 (a free port in Windows OS, as well as the default port for the popular indie game Terraria).
* The API has only one endpoint that requires two path variables: The name of the stock and the number of files that may be computed.
* Some examples of calls using the browser's address bar:<br/>
`localhost:7777/LSE/2` -> Should initiate a download of a zip file containing 2 forecasted csv files.<br/>
`localhost:7777/LSE/1` -> Should initiate a download of a single forecasted csv file.<br/>
`localhost:7777/fffff/2` -> Should alert an error stating that there is no fffff stock<br/>
`localhost:7777/FAKESTOCK/2` -> Should alert an error stating that there are no files in the FAKESTOCK directory. <br/>
`localhost:7777/NASDAQ/2` -> Should initiate a download of a single forecasted csv file.<br/>
`localhost:7777/NYSE/3` -> Should alert an error stating that the only values available for the number of files to be computed are 1 or 2.
<br/>
<br/>
<br/>

**Discussion:**
* In the context of an API I considered the .csv files as a local database, thus a user may indicate the stock he is interested in forecasting by the `stock` variable in the path of the request.
* The forecasted files should indicate Output and are transmitted to the user through browser download protocol. In the case of multiple files, they may be archived, as modern browsers tend to stop an application from downloading multiple files at once for security reasons.
* For the forecasting itself I wanted to use Simple Moving Average algoirthm (explained in code comments), since I used to use it frequently in my Statistics Classes.
* The computed files get replaced with each computation. Deleting them would be incosistent as they need to be present for the download process.