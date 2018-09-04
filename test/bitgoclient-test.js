var BitGoClient = require('../src/BitGoClient');
var assert = require('assert');
var sendingAmount = process.env.TEST_SENDING_AMOUNT * 1e8;

describe('Bit Go Requests', () => {
    var recipients = [];
    var balance = 0;
    var faucetWallet = null;
    beforeEach((done) => {
        recipients = [];
        BitGoClient.getWallet(process.env.TEST_WALLET_ID, function(wallet) {
            balance = wallet.balance();
            BitGoClient.getWallet(process.env.WALLET_ID, function(wallet) {
                faucetWallet = wallet;
                done();
            });
        });
    });
    it('Gets the wallet, and verifies the ID', (done) => {
        var id = process.env.WALLET_ID;
        BitGoClient.getWallet(process.env.WALLET_ID, (wallet) => {
            assert.equal(wallet._wallet.id, id);
            done();
        });
    });
    //Typically takes upto 15 seconds for BitGo to propogate wallet amount changes, so to be safe set timeout to 30000, and check back in 25 seconds
    it('Unlocks, and sends Single', function(done) {
        this.timeout(30000);
        var recipient = {address: process.env.TEST_ADDRESS_1, amount: sendingAmount};
        recipients.push(recipient);
        BitGoClient.UnlockandSend(faucetWallet, recipients);
        setTimeout(function() {
            BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                var newBalance = wallet.balance();
                assert.equal(newBalance, balance+ (sendingAmount));
                done();
            })
        }, 25000)
    });
    it('Even with invalid addresses, it should send coin to valid address', function(done) {
        this.timeout(60000);
        var recipient = {address: 'INVALID ADDRESS', amount: sendingAmount};
        var recipient2 = {address: 'INVALID ADDRESS2', amount: sendingAmount};
        var recipient3 = {address: process.env.TEST_ADDRESS_1, amount: sendingAmount};

        recipients.push(recipient);
        recipients.push(recipient2);
        recipients.push(recipient3);
        BitGoClient.UnlockandSend(faucetWallet, recipients);
        setTimeout(function() {
            BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                var newBalance = wallet.balance();
                assert.equal(newBalance, balance+ (sendingAmount));
                done();
            });
        }, 40000); //18000 ms to process + give about 20 seconds for it to update.
    });
    it('Should still process correct addresses, even with many invalid addresses', function(done) {
        var length = 15;
        var correctAddresses = 3;
        //Since there are invalid addresses, it takes 6 seconds per invalid address, add another 20 seconds for all changes to propogate.
        var timeoutLength = (((length * 6) + 20) * 1000);
        this.timeout(timeoutLength + 2000);
        for (var i = 0; i < length - correctAddresses; i++) {
            var recipient = {address: 'RANDOM ADDRESS ' + i.toString(), amount: sendingAmount };
            recipients.push(recipient);
        }
        for (var i = length - correctAddresses; i < length; i++) {
            var recipient = {address: process.env.TEST_ADDRESS_1, amount: sendingAmount };
            recipients.push(recipient);
        }
        BitGoClient.UnlockandSend(faucetWallet, recipients);
        setTimeout(function() {
            BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                var newBalance = wallet.balance();
                assert.equal(newBalance, balance+ (sendingAmount * correctAddresses));
                done();
            });
        }, timeoutLength);
    });
});