// app.js
const express = require('express');
const app = express();

app.get('/:stock/:number', (req, res) => {

    const stock = req.params.stock;
    var number = req.params.number;

    res.send("Stock: " + stock + ' Number: '+ number);
});

// Start the server
const usePort = 3001;
app.listen(usePort, () => {
    console.log("SERVER ON @ port: " + usePort);
});
