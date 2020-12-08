// WEB3
export const web3Loaded = connection => ({
    type: 'WEB3_LOADED',
    connection
})

export const web3AccountLoaded = account => ({
    type: 'WEB3_ACCOUNT_LOADED',
    account
})

// TOKEN
export const tokenLoaded = contract => ({
    type: 'TOKEN_LOADED',
    contract
})

// exchange
export const exchangeLoaded = contract => ({
    type: 'EXCHANGE_LOADED',
    contract
})

export const cancelledOrdersLoaded = cancelledOrders => {
    return {
        type: 'CANCELLED_ORDERS_LOADED',
        cancelledOrders
    }
}

export const filledOrdersLoaded = filledOrders => {
    return {
        type: 'FILLED_ORDERS_LOADED',
        filledOrders
    }
}

export const allOrdersLoaded = allOrders => {
    return {
        type: 'ALL_ORDERS_LOADED',
        allOrders
    }
}

export function orderCancelling()  {
    return {
        type: 'ORDER_CANCELLING',
    }
}

export function orderCancelled(order)  {
    return {
        type: 'ORDER_CANCELLED',
        order
    }
}

export function orderFilling()  {
    return {
        type: 'ORDER_FILLING',
    }
}

export function orderFilled(order)  {
    return {
        type: 'ORDER_FILLED',
        order
    }
}

export function etherBalanceLoaded(balance)  {
    return {
        type: 'ETHER_BALANCE_LOADED',
        balance
    }
}

export function tokenBalanceLoaded(balance)  {
    return {
        type: 'TOKEN_BALANCE_LOADED',
        balance
    }
}

export function exchangeEtherBalanceLoaded(balance)  {
    return {
        type: 'EXCHANGE_ETHER_BALANCE_LOADED',
        balance
    }
}

export function exchangeTokenBalanceLoaded(balance)  {
    return {
        type: 'EXCHANGE_TOKEN_BALANCE_LOADED',
        balance
    }
}

export function balancesLoaded() {
    return {
        type: 'BALANCES_LOADED'
    }
}

export function balancesLoading() {
    return {
        type: 'BALANCES_LOADING'
    }
}

export function etherDepositAmountChanged(amount) {
    return {
        type: 'ETHER_DEPOSIT_AMOUNT_CHANGED',
        amount
    }
}

export function etherWithdrawAmountChanged(amount) {
    return {
        type: 'ETHER_WITHDRAW_AMOUNT_CHANGED',
        amount
    }
}

export function tokenDepositAmountChanged(amount) {
    return {
        type: 'TOKEN_DEPOSIT_AMOUNT_CHANGED',
        amount
    }
}

export function tokenWithdrawAmountChanged(amount) {
    return {
        type: 'TOKEN_WITHDRAW_AMOUNT_CHANGED',
        amount
    }
}

// Buy Order

export function buyOrderAmountChanged(amount) {
    return {
        type: 'BUY_ORDER_AMOUNT_CHANGED',
        amount
    }
}

export function buyOrderPriceChanged(price) {
    return {
        type: 'BUY_ORDER_PRICE_CHANGED',
        price
    }
}

export function buyOrderMaking(price) {
    return {
        type: 'BUY_ORDER_MAKING',
    }
}

// Sell Order

export function sellOrderAmountChanged(amount) {
    return {
        type: 'SELL_ORDER_AMOUNT_CHANGED',
        amount
    }
}

export function sellOrderPriceChanged(price) {
    return {
        type: 'SELL_ORDER_PRICE_CHANGED',
        price
    }
}

export function sellOrderMaking(price) {
    return {
        type: 'SELL_ORDER_MAKING',
    }
}

// Generic order

export function orderMade(order) {
    return {
        type: 'ORDER_MADE',
        order
    }
}