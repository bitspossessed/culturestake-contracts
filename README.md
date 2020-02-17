# CultureStake

CultureStake is a web-based voting system for cultural decision making and investment.

## Credits

CultureStake is a [Furtherfield](https://www.furtherfield.org/)/[DECAL](http://www.decal.is/) initiative.

## Development

Requires [node version 10](https://nodejs.org/en/download/)

Clone down this repo and `npm install`

Copy the example env file and add your configuration details: `cp .env.example .env`

With ganache running (`npm run ganache`), in a new console window, `node_modules/.bin/truffle compile` then `node_modules/.bin/truffle migrate`

**Note:** This is a work in progress and this should be done only for contribution and exploration purposes.

## Testing

Requires [node version 10](https://nodejs.org/en/download/)
`npm test` will re-build the contracts / tests and run all of the tests in the [test](test) directory.

Tests are executed with the help of [Truffle](https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript) and written in javascript using [Mocha](https://mochajs.org/) with the [Chai assertion library](https://www.chaijs.com/). 

When you run `npm test` a new local blockchain will be started with ganache-cli (unless you already have one running). The contracts will be deployed and the javascript tests will make transactions to this chain.

Helper functions defined in [test/helpers](test/helpers) provides functionality for more complicated tests such as: reading the event log, or checking for an EVM "revert / throw", or changing the blockstamp times.

## License

GNU Affero General Public License v3.0 `AGPL-3.0`