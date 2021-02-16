import React from 'react'
import ReactDOM from 'react-dom'
import MyWeb3 from 'web3'
import './index.styl'
import ABI from '../build/contracts/DAX.json'
import TokenABI from '../build/contracts/IERC20.json'

const batToken = '0x850Cbb38828adF8a89d7d799CCf1010Dc238F665'
const watToken = '0x029cc401Ef45B2a2B2D6D2D6677b9F94E26cfF9d'
const dax = ABI.networks['3'].address

// The main section to see live trades taking place
class Trades extends React.Component {
    constructor(){
        super()
    }

    render() {
        let buyTrades = this.props.trades.filter(trade => trade.type == 'buy')

        buyTrades = buyTrades.map((trade, index) => (
            <div key={trade.id + index} className="trade-container buy-trade">
                <div className="trade-symbol">
                    {trade.firstSymbol}
                </div>
                <div className="trade-symbol">
                    {trade.secondSymbol}
                </div>
                <div className="trade-pricing">
                    {trade.type} {trade.firstSymbol} at {trade.price} each
                </div>
            </div>
        ));

        let sellTrades = this.props.trades.filter(trade => trade.type == 'sell')
            sellTrades = sellTrades.map((trade, index) => (
                <div key={trade.id + index} className="trade-container sell-trade">
                    <div className="trade-symbol">
                        {trade.firstSymbol}
                    </div>
                    <div className="trade-symbol">
                        {trade.secondSymbol}
                    </div>
                    <div className="trade-pricing">
                    {trade.type} {trade.firstSymbol} at {trade.price} each
                </div>
            </div>
        ));
        
        return (
            <div className="trades">
                <div className="buy-trades-title heading">Buy</div>
                <div className="buy-trades-container">{buyTrades}</div>
                <div className="sell-trades-title">Sell</div>
                <div className="sell-trades-title">{sellTrades}</div>
            </div>
        )

    }
}


class Sidebar extends React.Component {
    constructor() {
        super()
        this.state = {
            showLimitOrderInput: false
        }
    }

    render() {
        return (
                <div className="sidebar">
                    <div className="selected-assets-title">Selectde assets:</div>
                    <div className="selected-asset-one">ETH</div>
                    <div className="your-portofolio">Your portofolio:</div>
                    <div className="grid-center">ETH:</div>
                    <div className="grid-center">10</div>
                    <div className="grid-center">BAT:</div>
                    <div className="grid-center">200</div>
                    <div className="money-management">Money management:</div>
                    <button className="button-outline">Deposit</button>
                    <button className="button-outline">Withdraw</button>
                    <div className="Actions">Actions:</div>
                    <button className="button-outline">Buy</button>
                    <button className="button-outline">Sell</button>
                    <select defaultValue="market-order" onChange={selected => {
                                                                                if(selected.target.value == 'limit-order') 
                                                                                    this.setState({showLimitOrderInput: true}) 
                                                                                else this.setState({showLimitOrderInput: false})}}>
                        <option value="market-order">Market</option>
                        <option value="limit-order">Limit Order</option>
                    </select>
                    <input ref="limit-order-amount" className={ this.state.showLimitOrderInput? '' : 'hidden'} type="number" placeholder="Price to buy or sell at..."/>
                </div>
                )
    }
}

// Past historical trades
class History extends React.Component{
    constructor(){
        super()
    }

    render() {
        const historicalTrades = this.props.history.map((trade, index) => (<div key={trade.id + index} className="historical-trade">
            <div className={trade.type == 'sell' ? 'sell-trade' : 'buy-trade'}>
                {trade.type} {trade.quantity} {trade.firstSymbol} for {trade.quantity * trade.price} {trade.secondSymbol} at {trade.price} each
            </div>
        </div>))
    

    return (
        <div className="history">
            <div className="heading">Recent history</div>
            <div className="historical-trades-container">{historicalTrades}</div>
        </div>
    )
    }
}


class Main extends React.Component {
    constructor () {
        super()

        this.state = {
            contractInstance: {},
            tokenInstance: {},
            secondTokenInstance: {},
            userAddress: '',
            firstSymbol: 'BAT',
            secondSymbol: 'WAT',
            balanceFirstSymbol: 0,
            balanceSecondSymbol: 0,
            escrow: '',
            buyOrders: [],
            sellOrders: [],
            closedOrders: []

        }

        this.setup()
    }

    // To use bytes32 functions
    bytes32(name){
        return myWeb3.utils.fromAscii(name)
    }
    
    async setup() {
        // Create the contract instance
        window.myWeb3 = new MyWeb3(ethereum)
        try {
            await ethereum.enable()
        } catch (error)
        {
            console.error('You must approve this dApp to interactwith it')
        }
        console.log('Setting up contract instances')
        await this.setCOntractInstances()
        console.log('Setting up orders')
        await this.setOrders()
        console.log('Setting up pairs')
        await this.setPairs()
    }

    async setCOntractInstances() {
        const userAddress = (await myWeb3.eth.getAccount())[0]
        if(!userAddress) return console.error('You must unlock metamask to use this dApp on ropsten')
        await this.setState({userAddress})
        const contractInstance = new myWeb3.eth.Contract(ABI.abi, dax, {
            from: this.state.userAddress,
            gasprice: 2e9
        })
        const tokenInstance = new myWeb3.eth.Contract(TokenABI.abi, batToken, {
            from: this.state.userAddress,
            gasPrice: 2e9
        })
        await this.setState({contractInstance, tokenInstance, secondTokenInstance})
    }

    async setOrders() {
        // First get the length of all orders so that you can loop through them
        const buyOrdersLength = await this.state.contractInstance.methods.getOrderLength(this.bytes32("buy")).call({from: this.state.userAddress })
        const sellOrdersLength = await this.state.contractInstance.methods.getOrderLength(this.bytes32("sell")).call({from: this.state.userAddress })

        const closedOrdersLength = await this.state.contractInstance.methods.getOrderLength(this.bytes32('closed')).call({from: this.state.userAddress})

        let buyOrders = []
        let sellOrders= []
        let closedOrders = []

        for(let i = 0; i < buyOrdersLength; i++)
        {
            const order = await this.state.contractInstance.methods.getOrder(this.bytes32('buy', i)).call({from: this.state.userAddress})

            const orderObject = {
                id: order[0],
                owner: order[1],
                type: myWeb3.utils.toUtf8(order[2]),
                firstSymbol: myWeb3.utils.toUtf8(order[3]),
                secondSymbol: myWeb3.utils.toUtf8(order[4]),
                quantity: order[5],
                price: order[6],
                timestamp: order[7],
                state: order[8]
            }

            buyOrders.push(orderObject);
        }

        for(let i = 0; i < sellOrdersLength; i++)
        {
            const order = await this.state.contractInstance.methods.getOrder(this.bytes32('sell'), 0).call({from :  this.state.userAddress})

            const orderObject = {
                id: order[0],
                owner: order[1],
                type: myWeb3.utils.toUtf8(order[2]),
                firstSymbol: myWeb3.utils.toUtf8(order[3]),
                secondSymbol: myWeb3.utils.toUtf8(order[4]),
                quantity: order[5],
                price: order[6],
                timestamp: order[7],
                state: order[8]
            }
            sellOrders.push(orderObject);
        }

        for(let i = 0; i < closedOrdersLength; i++)
        {
            const order = await this.state.contractInstance.methods.closedOrder(this.bytes32('close'), 0).call({from :  this.state.userAddress})

            const orderObject = {
                id: order[0],
                owner: order[1],
                type: myWeb3.utils.toUtf8(order[2]),
                firstSymbol: myWeb3.utils.toUtf8(order[3]),
                secondSymbol: myWeb3.utils.toUtf8(order[4]),
                quantity: order[5],
                price: order[6],
                timestamp: order[7],
                state: order[8]
            }
            closedOrders.push(orderObject);
        }
        this.setState({buyOrders, sellOrders, closedOrders})
    }

    async setPairs() {
        // Here you'd add all the logic to get all the token symbols, in this case we're keeping it simple with one fixed pair
        // If there are no pairs, whitelist a new one automatically if this is the owner of the DAX contract
        const owner = await this.state.contractInstance.methods.owner().call({ from: this.state.userAddress })
        const isWhitelisted = await this.state.contractInstance.methods.isTokenWhitelisted(batToken).call({ from: this.state.userAddress })
        if(owner == this.state.userAddress && !isWhitelisted) {
            await this.state.contractInstance.methods.whitelistToken(this.bytes32('BAT'), batToken, [this.bytes32('WAT')], [watToken]).send({ from: this.state.userAddress, gas: 8e6 })
        }

        // Set the balance of each symbol considering how many tokens you have in escrow
        const escrow = await this.state.contractInstance.methods.escrowByUserAddress(this.state.userAddress).call({ from: this.state.userAddress })
        const balanceOne = await this.state.tokenInstance.methods.balanceOf(escrow).call({ from: this.state.userAddress })
        const balanceTwo = await this.state.secondTokenInstance.methods.balanceOf(escrow).call({ from: this.state.userAddress })
        this.setState({escrow, balanceOne, balanceTwo})
    }

    async whitelistTokens(symbol, token, pairSymbols, pairAddresses) {
        await this.state.contractInstance.methods.whitelistToken(this.bytes32(symbol), token, pairSymbols, pairAddresses).send({ from: this.state.userAddress })
    }

    async depositTokens(symbol, amount) {
        if(symbol == 'BAT') {
            // Check the token balace before approving
            const balance = await this.state.tokenInstance.methods.balanceOf(this.state.userAddress).call({ from: this.state.userAddress })
            if(balance < amount) return alert(`You can't deposit ${amount} BAT since you have ${balance} BAT in your account, get more tokens before depositing`)
            // First approve to 0 to avoid errors and then increase it
            await this.state.tokenInstance.methods.approve(dax, 0).send({ from: this.state.userAddress })
            await this.state.tokenInstance.methods.approve(dax, amount).send({ from: this.state.userAddress })
            // Create the transaction
            await this.state.contractInstance.methods.depositTokens(batToken, amount).send({ from: this.state.userAddress })
        } else if(symbol == 'WAT') {
            // Check the token balace before approving
            const balance = await this.state.secondTokenInstance.methods.balanceOf(this.state.userAddress).call({ from: this.state.userAddress })
            if(balance < amount) return alert(`You can't deposit ${amount} WAT since you have ${balance} WAT in your account, get more tokens before depositing`)
            // First approve to 0 to avoid errors and then increase it
            await this.state.secondTokenInstance.methods.approve(dax, 0).send({ from: this.state.userAddress })
            await this.state.secondTokenInstance.methods.approve(dax, amount).send({ from: this.state.userAddress })
            // Create the transaction
            await this.state.contractInstance.methods.depositTokens(watToken, amount).send({ from: this.state.userAddress })
        }
    }

    async withdrawTokens(symbol, amount) {
        if(symbol == 'BAT') {
            await this.state.contractInstance.methods.extractTokens(batToken, amount).send({ from: this.state.userAddress })
        } else if(symbol == 'WAT') {
            await this.state.contractInstance.methods.extractTokens(watToken, amount).send({ from: this.state.userAddress })
        }
    }

    async createLimitOrder(type, firstSymbol, secondSymbol, quantity, pricePerToken) {
        // Create the limit order
        await this.state.contractInstance.methods.limitOrder(type, firstSymbol, secondSymbol, quantity, pricePerToken).send({ from: this.state.userAddress })
    }

    async createMarketOrder(type, firstSymbol, secondSymbol, quantity) {
        // Create the market order
        await this.state.contractInstance.methods.marketOrder(type, firstSymbol, secondSymbol, quantity).send({ from: this.state.userAddress })
    }

    render() {
        return (
            <div className="main-container">
                <Sidebar/>
                <Trades 
                    trades={this.state.trades}
                />
                <History    
                    history={this.state.history}
                />
            </div>
        )
    }
}

ReactDOM.render(<Main />, document.querySelector('#root'))