require('dotenv').config();
var express = require('express');
var app = express();
var importFaucet = require('./Faucet');

var Faucet = new importFaucet();



app.get('/withdraw', async function (req, res) {
  if (Faucet.maximumSend === 0) {
      await Faucet.getBalance();
  }
  if (req.query.ip && req.query.address && req.query.amount && Number(req.query.amount)) {
      var askingAmount = Number(req.query.amount);
      if (askingAmount > Faucet.maximumSend) {
          res.status(400).send('Exceeded maximum sending amount of ' + Faucet.maximumSend);
          return;
      }
    var insertDetails = {
        address: req.query.address,
        amount: askingAmount * 1e8
    }
    Faucet.faucetQueue.enqueue(insertDetails);
    res.sendStatus(200);
  } else {
      res.status(400).send('Address or Amount was not sent.');
  }
});



//Process the queue every minute, this lowers the load on the server, helps manage scalability, as well as ensures the unlock and API request limit timings
//are met
setInterval(() => {
    Faucet.start();
}, 60000 );


app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ', process.env.PORT);
});

module.exports = {
    app,
    Faucet
}