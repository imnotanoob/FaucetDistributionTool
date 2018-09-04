# Faucet Distribution Tool
This is a faucet distribution tool developed in node js. Node js is a single-threaded language, and I wanted to build this so it would be scalable.
I tried to utilize BitGo's sendMany features to queue transactions, and send in batches. If for some reason anyone supplies an invalid address,
it will not run through BitGo's function, so we Send each transaction singly every 6 seconds. We batch every 60 seconds.
If transactions are running singly, it won't be batched at the same time. 
This project has a strong focus on testing, and designing vs. features. You can easily add in features in order to verify addresses, the reason I did not
do so was because the testnet addresses provided by BitGo, do not match the REGEX of actual testnet addresses.

## Endpoints
One end point: /withdraw. You can call it using a GET request, with parameters as amount, address, and IP address.

# Asides
I ensure to do basic checking such as amount checking, at no time can a user request > totalBalance/100, because I want to make sure I can at least support 100 users at a time. This was built and tested based on LTC, but I made it flexible to support other coins, if you have the resources to get testnet
coins for other coins.

# Test Running Time
Tests take > 10 minutes to run (around 11 minutes on average), this is okay and good, because each test thoroughly tests features inside the program.
I had to stagger it because the queue batches every minute, we also need to give some time for pending transactions to go through and BitGo's API to actually receive the changes.