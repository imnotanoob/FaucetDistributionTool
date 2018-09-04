let BitGoClient = require('./BitGoClient');
let Queue = require('./Queue');

class Faucet {
    constructor() {
        this.processing = false;
        this.walletBalance = 0;
        this.maximumSend = 0;
        this.faucetQueue = new Queue();
    }
    async ProcessQueue(wallet) {
        let recipients = [];
        //Update balance, each time we are running the queue.
        this.walletBalance = wallet.balance();
        this.maximumSend = this.getMaximumSend();
        let runningAmount = 0;
        let index = 0;
        while(!this.faucetQueue.isEmpty()) {
            let queueItem = this.faucetQueue.peek();
            //This is the amount the user provided, + a transaction fee worse case. Transaction fee on average worst case is 
            //upto 16.3% (https://en.bitcoin.it/wiki/Transaction_fees). Set it to an upper limit of 20% to ensure accounting for worst case scenarios
            let totalPossibleAmount = queueItem.amount + (queueItem.amount * .2);
            runningAmount += totalPossibleAmount;
            if (runningAmount <= this.walletBalance) {
                recipients.push(this.faucetQueue.dequeue());
            } else if (index === 0 && queueItem.amount < this.walletBalance) { //In the case that our faucet wallet indeed has enough money, but doesn't 
            //quite fit the worst case transaction fee, we should still attempt and send it. If there's an error, we know that we definitely
            //did not have enough funds. Only select the first index, because we would be sending this one at a time using the sendSingle API call.
                recipients.push(this.faucetQueue.dequeue());
                break;
            }
            else {
                break;
            }
            index++;
        }
        await BitGoClient.UnlockandSend(wallet, recipients);
        this.processing = false;
    }
    
    start() {
        //If the function was called, while a previous function is still processing, simply ignore the new call and let the queue finish out.
        if (this.processing) {
            return;
        }
        this.processing = true;
        BitGoClient.getWallet(process.env.WALLET_ID, this.ProcessQueue.bind(this));
        
    }
    
    FrontFaucetAdd(value) {
        this.faucetQueue.addFirst(value);
    }
    
    getBalance() {
        return new Promise((resolve, reject) => {
            BitGoClient.getWallet(process.env.WALLET_ID, (wallet) => {
                this.walletBalance = wallet.balance();
                this.maximumSend = this.getMaximumSend();
                resolve();
            });
        });
    }
    
    getMaximumSend() {
        return (this.walletBalance / 1e8) / 100;
    }
}



module.exports = Faucet;