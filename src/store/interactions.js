import Web3 from 'web3'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { 
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled,
    orderFilling,
    orderFilled,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoaded,
    balancesLoading,
    buyOrderMaking,
    sellOrderMaking,
    orderMade
} from "./actions";
import { ETHER_ADDRESS } from '../helpers.js';
import { resetWarningCache } from 'prop-types';

export const loadWeb3 = async (dispatch) => {
    if (typeof window.ethereum!=='undefined') {
        window.ethereum.autoRefreshOnNetworkChange = false; 
        const web3 = new Web3(window.ethereum)
        dispatch(web3Loaded(web3))
        return web3
    } else {
        window.alert('Please install MetaMask')
        window.location.assign("https://metamask.io/")
    }
}


// export const loadWeb3 = async (dispatch) => {
//     let ethereum = window.ethereum;
//     let web3 = window.web3;
//     if(typeof ethereum !== 'undefined') {
//         await ethereum.enable();
//         web3 = new Web3(ethereum)
//     } else if (typeof web3 !== 'undefined') {
//         web3 = new Web3(web3.currentProvider)
//     } else {
//         web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER))
//     }
//     dispatch(web3Loaded(web3))
//     return web3
// }





// export const loadWeb3 = async (dispatch) => {
//     const web3 = new Web3(window.ethereum)
    
//     dispatch(web3Loaded(web3))
//     return web3
// }


// export const loadWeb3 = async (dispatch) => {
//     const web3 = new Web3(window.web3.givenProvider || 'http://localhost:8545')
//     dispatch(web3Loaded(web3))
//     return web3
// }

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    const account = accounts[0]
    console.log(account)
    dispatch(web3AccountLoaded(account))
    return account
}

export const loadToken = async (web3, networkId, dispatch) => {
    try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
        dispatch(tokenLoaded(token))
        return token
    } catch(error) {
        console.log('Contract not deployed to the current network')
        return null
    }
}

export const loadExchange = async (web3, networkId, dispatch) => {
    try {
        const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
        dispatch(exchangeLoaded(exchange))
        return exchange
    } catch(error) {
        console.log('Contract not deployed to the current network')
        return null
    }
}

export const loadAllOrders = async (exchange, dispatch) => {
    // Fetch cancelled orders with the Cancel stream
    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
    // Format cancelled orders
    const cancelledOrders = cancelStream.map(event => event.returnValues)
    // Add cancelled orders to the redux store
    dispatch(cancelledOrdersLoaded(cancelledOrders))
    
    // Fetch filled orders with the Trade event stream
    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
    // Format filled orders
    const filledOrders = tradeStream.map(event => event.returnValues)
    // Add filled orders to the redux store
    dispatch(filledOrdersLoaded(filledOrders))

    // Load Order stream
    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
    // Format order stream
    const allOrders = orderStream.map(event => event.returnValues)
    // Add open orders to the redux store
    dispatch(allOrdersLoaded(allOrders))
}

export const subscribeToEvents = async (exchange, dispatch) => {
    exchange.events.Cancel({}, (error, event) => {
        dispatch(orderCancelled(event.returnValues))
    })
    
    exchange.events.Trade({}, (error, event) => {
        dispatch(orderFilled(event.returnValues))
    })

    exchange.events.Deposit({}, (error, event) => {
        dispatch(balancesLoaded())
    })

    exchange.events.Withdraw({}, (error, event) => {
        dispatch(balancesLoaded())
    })

    exchange.events.Order({}, (error, event) => {
        dispatch(orderMade(event.returnValues))
    })
}

export const cancelOrder = (dispatch, exchange, order, account) => {
    exchange.methods.cancelOrder(order.id).send({ from: account })
    .on('transactionHash', (hash) => {
        dispatch(orderCancelling())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const fillOrder = (dispatch, exchange, order, account) => {
    exchange.methods.fillOrder(order.id).send({ from: account })
    .on('transactionHash', (hash) => {
        dispatch(orderFilling())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
    
    if (typeof account !== 'undefined') {
        // Ether balance in wallet
        const etherBalance = await web3.eth.getBalance(account)
        dispatch(etherBalanceLoaded(etherBalance))

        // Token balance in wallet 
        const tokenBalance = await token.methods.balanceOf(account).call()
        dispatch(tokenBalanceLoaded(tokenBalance))

        // Ether Balance in exchange 
        const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
        dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

        // Token balance in exchange
        const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
        dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

        // Trigger all balances loaded
        dispatch(balancesLoaded())
    } else {
        window.alert('Please login with MetaMask!')
    }   
}

export const depositEther = (dispatch, exchange, web3, amount, account) => {
    exchange.methods.depositEther().send({ from: account, value: web3.utils.toWei(amount, 'ether') })
    .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
    exchange.methods.withdrawEther(web3.utils.toWei(amount.toString(), 'ether')).send({ from: account })
    .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
    amount = web3.utils.toWei(amount, 'ether')

    token.methods.approve(exchange.options.address, amount).send({ from: account })
    .on('transactionHash', hash => {
        exchange.methods.depositToken(token.options.address, amount).send({ from: account })
        .on('transactionHash', hash => {
            dispatch(balancesLoading())
        })
        .on('error', error => {
            console.log(error)
            window.alert('There was an error!')
        })
    })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
    exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
    .on('transactionHash', hash => {
        dispatch(balancesLoading())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
    const tokenGet = token.options.address
    const amountGet = web3.utils.toWei(order.amount, 'ether')
    const tokenGive = ETHER_ADDRESS
    const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether') 

    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', hash => {
        dispatch(buyOrderMaking())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
    const tokenGet = ETHER_ADDRESS
    const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
    const tokenGive = token.options.address
    const amountGive = web3.utils.toWei(order.amount.toString(), 'ether')

    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
    .on('transactionHash', hash => {
        dispatch(sellOrderMaking())
    })
    .on('error', error => {
        console.log(error)
        window.alert('There was an error!')
    })
}

export const update = async (dispatch) => {
    let account, web3, netId, exchange, token

    web3 = await loadWeb3(dispatch)
    netId = await web3.eth.net.getId()
    account = await loadAccount(web3, dispatch)
    token = await loadToken(web3, netId, dispatch)
    exchange = await loadExchange(web3, netId, dispatch)

    if (!token || !exchange || !account) {
        await reset(dispatch);
    } else {
        await loadAllOrders(exchange, dispatch)
        await loadBalances(dispatch, web3, exchange, token, account)
    }
}

export const reset = async (dispatch) => {
    window.alert('Please login/switch network with MetaMask')

    //balances
    dispatch(exchangeEtherBalanceLoaded(0))
    dispatch(exchangeTokenBalanceLoaded(0))
    dispatch(etherBalanceLoaded(0))
    dispatch(tokenBalanceLoaded(0))
    dispatch(balancesLoaded())

    //orders
    dispatch(cancelledOrdersLoaded())
    dispatch(filledOrdersLoaded())
    dispatch(allOrdersLoaded())
}
