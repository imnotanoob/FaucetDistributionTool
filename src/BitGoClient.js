var app = require('./app');
let Faucet = app.Faucet;
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.ACCESS_TOKEN });
let coin = bitgo.coin(process.env.COIN);

class BitGoClient {
    static getWallet(walletID, callback) {
        coin.wallets().get({id:walletID}).then(function(wallet) {
            callback(wallet);
        }).catch(err => console.log(err));
    }
    static async UnlockandSend(wallet, recipients) {
        if (recipients.length === 1) {
            let recipient = recipients[0];
            await UnlockPromise(SendSinglePromise, recipient, wallet);
        } else if (recipients.length> 1) {
            await UnlockPromise(SendManyPromise, recipients, wallet);
        } else {
            return;
        }
    }
}

/*
PRIVATE FUNCTIONS
*/

function SendSinglePromise(recipient, wallet) {
    return new Promise((resolve, reject) => {
        let params = {
            amount: recipient.amount,
            address: recipient.address,
            walletPassphrase: process.env.WALLET_PASSPHRASE
        }
        wallet.send(params).then(() => resolve()).catch(function(err) {
            
            if (!err.hasOwnProperty('result')) {
                return;
            } else if (!err.result.hasOwnProperty('name')){
                return;
            }
            //@TODO: Notify yourself via e-mail, when there are insufficient funds, so you can get more.
            if (err.result.name === 'InsufficientBalance') {
                console.log(err);
            }
            //Only if the error was an invalid address, should we skip, and not send money. For the other cases such as insufficient funds, service being down
            //we should add to the queue in the front, for re-processing.
            if (err.result.name !== 'Invalid') {
                Faucet.FrontFaucetAdd(recipient);
            }
            resolve();
            
        });
    });
   
}

function UnlockPromise(callback, params, wallet) {
    return new Promise((resolve, reject) => {
        bitgo.unlock({ otp: '0000000', duration:60 }).then(function(unlockResponse) {
            callback(params, wallet).then(function() {
                resolve();
            });
        }).catch(function(err) {
            console.log(err);
            reject();
        });
    });
    //unlocked for 600 seconds only in order to send the transaction.
    
}

function SendManyPromise(recipients, wallet) {
    return new Promise((resolve, reject) => {
        let params = {
            recipients: recipients,
            walletPassphrase: process.env.WALLET_PASSPHRASE
        }
        //This error typically comes if there was an invalid address included inside the group. If so, send individually.
        //We also need to ensure we do not send requests concurrently (which JS tends do as it's an async language). So we separate each request out by a second:
        //https://bitgo.freshdesk.com/support/solutions/articles/27000048457-does-bitgo-support-concurrent-sends-
        wallet.sendMany(params).then(() => resolve()).catch(function(err) {
            var x = 0;
            var intervalID = setInterval(function () {
                UnlockPromise(SendSinglePromise, recipients[x], wallet).then(() => {
                    if (++x === recipients.length) {
                        clearInterval(intervalID);
                        resolve();
                     }
                });
                
            }, 6000);
        
        });
    });
}

module.exports = BitGoClient;