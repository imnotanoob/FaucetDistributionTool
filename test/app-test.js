let assert = require('assert');
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../src/app');
let app = server.app;
let BitGoClient = require('../src/BitGoClient');
let Queue = require('../src/Queue');
let should = chai.should();
let importFaucet = require('../src/Faucet');
let Faucet = server.Faucet;
chai.use(chaiHttp);

var sendingAmount = process.env.TEST_SENDING_AMOUNT;


describe('/GET Withdraw', () => {
    describe('#check api endpoint', () => {
        it('should not succeed if the format sent was in correct, or not all items were present #1', (done) => {
            chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: 'QMwnVKrvz4U5mqB4T7sbMzTAT2vPyVy2cC'}).end((err, res) => {
                res.should.have.status(400);
                done();
            })
        });
        it('should not succeed if the format sent was in correct, or not all items were present #2', (done) => {
            chai.request(app).get('/withdraw').query({address: 'QMwnVKrvz4U5mqB4T7sbMzTAT2vPyVy2cC', amount: .005}).end((err, res) => {
                res.should.have.status(400);
                done();
            })
        });
    });
    
    describe('#check queue and processing single', () => {
        Faucet.faucetQueue = new Queue();
        var balance = 0;
        beforeEach(function(done) {
            this.timeout(5000);
            BitGoClient.getWallet(process.env.TEST_WALLET_ID, function(wallet) {
                balance = wallet.balance();
                done();
            });
        });
        //Wait at least 80 seconds before checking, because the queue runs every minute, and it typically takes upto 20 seconds for balance transfers to show
        it('should add request to queue, process it, and send the funds', function (done) {
            this.timeout(90000);
            chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: process.env.TEST_ADDRESS_1, amount: sendingAmount}).end((err, res) => {
                res.should.have.status(200);
                setTimeout(function() {
                    BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                        var newBalance = wallet.balance();
                        assert.equal(newBalance, balance+ (sendingAmount * 1e8));
                        done();
                    });
                }, 80000)
            });
        });
        it('should not allow due to exceeded asking amount', function(done)  {
            chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: process.env.TEST_ADDRESS_1, amount: 5}).end((err, res) => {
                res.should.have.status(400);
                done();
            });
        });    
    });
    //Wait at least 80 seconds before checking, because the queue runs every minute, and it typically takes upto 20 seconds for balance transfers to show
    describe('#check queue and processing multiple', () => {
        var balance = 0;
        beforeEach((done) => {
            Faucet.faucetQueue = new Queue();
            BitGoClient.getWallet(process.env.TEST_WALLET_ID, function(wallet) {
                balance = wallet.balance();
                done();
            });
        });
        it('should add all requests to queue, process the ones that are valid addresses, and send the funds', function(done) {
            var length = 6;
            this.timeout((1000 * ((length * 6) + 30 + 60 + 20)));
            for (var i = 0; i < length-2; i++) {
                chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: process.env.TEST_ADDRESS_1, amount: sendingAmount}).end((err, res) => {
                    res.should.have.status(200);
                });
            }
            for (var i = length - 2; i < length; i++) {
                chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: 'RANDOM ADDRESS ' + i.toString(), amount: sendingAmount}).end((err, res) => {
                    res.should.have.status(200);
                });
            }
            //Wait a bit over 60 seconds so that sendSingle can run
            setTimeout(function() {
                BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                    var newBalance = wallet.balance();
                    assert.equal(newBalance, balance + (sendingAmount * (length -2) * 1e8));
                    done();
                });
            }, (1000 * ((length * 6) + 30 + 60)));
        });
        //Since there are wrong addresses, it will send single every 6 seconds.
        it('should add all requests to queue, add entropy, process the ones that are valid addresses, and send the funds', function(done) {
            var length = 6;
            this.timeout((1000 * ((length * 6) + 30 + 60 + 20)));
            var counter = 0;
            for (var i = 0; i < length; i++) {
                var randomNumber = Math.floor(Math.random() * 2);
                var address = process.env.TEST_ADDRESS_1;
                //Randomly choosing where to put incorrect addresses.
                if (i % 2 === randomNumber) {
                    address = "RANDOM ADDRESS " + i.toString();
                } else {
                    counter++; //Keep track of number of valid times it will be sent to our test wallet address.
                }
                chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: address, amount: sendingAmount}).end((err, res) => {
                    res.should.have.status(200);
                });
            }
            //Wait a bit over 60 seconds so that sendSingle can run
            setTimeout(function() {
                BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                    var newBalance = wallet.balance();
                    assert.equal(newBalance, balance + (sendingAmount * counter * 1e8));
                    done();
                });
            }, (1000 * ((length * 6) + 30 + 60)));
        });
        it('should add all requests to queue, process them all, and send the funds', function(done) {
            this.timeout(90000);
            var length = 100;
            for (var i = 0; i < length; i++) {
                chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: process.env.TEST_ADDRESS_1, amount: sendingAmount}).end((err, res) => {
                    res.should.have.status(200);
                });
            }
            //Wait a bit over 60 seconds so that sendMany can run
            setTimeout(function() {
                BitGoClient.getWallet(process.env.TEST_WALLET_ID, (wallet) => {
                    var newBalance = wallet.balance();
                    assert.equal(newBalance, balance + (sendingAmount * length * 1e8));
                    done();
                });
            }, 80000);
        });
        it('should still be processing, when given many invalid addresses', function(done) {
            var length = 20;
            //Takes 6 seconds when Sending Single because of invalid addresses
            var timeout = (65) * 1000;
            this.timeout(timeout + 2000);
            for (var i = 0; i < length; i++) {
                chai.request(app).get('/withdraw').query({ip: '108.80.86.140', address: 'RANDOM ADDRESS ' + i.toString(), amount: sendingAmount}).end((err, res) => {
                    res.should.have.status(200);
                });
            }
            setTimeout(function() {
                assert.equal(Faucet.processing, true);
                done();
            }, timeout)
        });

        

    });
});