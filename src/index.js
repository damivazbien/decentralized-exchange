import React from 'react'
import ReactDOM from 'react-dom'
import './index.styl'

class Main extends React.Component {
    constructor () {
        super();
    }

    render() {
        return (
            <div>
                <Sidebar/>
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

ReactDOM.render(<Main />, document.querySelector('#root'))