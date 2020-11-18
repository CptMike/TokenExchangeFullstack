import {tokens, ether, EVM_REVERT, ETHER_ADDRESS} from './helpers';

const Exchange = artifacts.require('./Exchange');

const Token = artifacts.require('./Token');

require('chai')
.use(require('chai-as-promised'))
.should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
    let exchange;
    let token;
    const feePercent = 10;

    beforeEach(async () => {
        
        //deploy token
        token = await Token.new()
        //transfer some tokens to user1
        token.transfer(user1, tokens(100), { from: deployer })
        //deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent)
    })

    describe('fallback', () => {
        it('reverts if ether is sent', async () => {
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })
    
    describe('deployment', () => {
        
        it('tracks the feeAccount', async () => {
            const result =  await exchange.feeAccount()
            result.should.equal(feeAccount)
           
        })

        it('tracks the feePercent', async() => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })

        
    })

    describe('depositing Ether', async () => {
        let result;
        let amount;

        beforeEach(async() => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount})
        })

        it('tracks the ether deposit', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })

        it('emits Deposit event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Deposit')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS, 'token is correct')
            event.user.should.equal(user1, 'user is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')

        })
    })

    describe('withdrawing Ether', async () => {
        let result;
        let amount;

        beforeEach(async () => {
            amount = ether(1);
            await exchange.depositEther({ from: user1, value: amount })

        })

        describe('success', async () => {

            beforeEach(async () => {
                result = await exchange.withdrawEther(amount, { from: user1 })
            })

            it('withdraws Ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.eq('0')
            })

            it('emits a withdraw event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS, 'token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal((0).toString(), 'balance is correct')  
            })

        })

        describe('failure', async () => {
            it('rejects withdraws for insufficient balances', async () => {
                await exchange.withdrawEther(ether(100), { from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('depositing tokens', () => {
        let result;
        let amount;
       

        describe('success', () => {
            
            beforeEach(async() => {
                amount = tokens(10);
                await token.approve(exchange.address, amount, { from: user1 })
                result = await exchange.depositToken(token.address, amount, { from: user1 })
            })    

            it('tracks the token deposit', async () => {
                // check token balance
                let balance;
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                //check tokens on exchange
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })

            it('emits Deposit event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Deposit')
                const event = log.args
                event.token.should.equal(token.address, 'token is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')

            })
        })

        describe('failure', () => {
            
            it('rejects ether deposits', async () => {
                await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1}).should.be.rejectedWith(EVM_REVERT)
            })

            it('fails when no tokens are approved', async () => {
                //dont approve any tokens before depositing
                await exchange.depositToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('withdrawing tokens', () => {
        let result;
        let amount;

        describe('success', async () => {
            
            beforeEach(async () => {
                //deposit tokens first
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                await exchange.depositToken(token.address, amount, { from: user1 })

                //withdraw tokens
                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
            })

            it('withdraw token funds', async () => {
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal((0).toString())
            })

            it('emits a withdraw event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.should.equal(token.address)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString())
                event.balance.toString().should.equal('0')

            })
        })

        describe('failure', async () => {
            it('rejects Ether withdraws', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })

            it('fails for insufficient balances', async () => {
                await exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balances', () => {
        beforeEach(async ()=> {
            exchange.depositEther({ from: user1, value: ether(1) })
        })
        
        it('returns the user balance', async () => {
            const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
            result.toString().should.equal(ether(1).toString())
        })
    })

    describe('making orders', () => {
        let result;

        beforeEach(async () => {
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
        })

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')
            const order = await exchange.orders('1')
            order.id.toString().should.equal('1')
            order.user.should.equal(user1)
            order.tokenGet.should.equal(token.address)
            order.amountGet.toString().should.equal(tokens(1).toString())
            order.tokenGive.should.equal(ETHER_ADDRESS)
            order.amountGive.toString().should.equal(ether(1).toString())
            order.timestamp.toString().length.should.be.at.least(1)
        })

        it('emits an order event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Order')
            const event = log.args
            event.id.toString().should.equal('1')
            event.user.should.equal(user1)
            event.tokenGet.should.equal(token.address)
            event.amountGet.toString().should.equal(tokens(1).toString())
            event.tokenGive.should.equal(ETHER_ADDRESS)
            event.amountGive.toString().should.equal(ether(1).toString())
            event.timestamp.toString().length.should.be.at.least(1)

        })


    })

    describe('order actions', () => {
        
        beforeEach(async () => {
            //user1 deposits ether
            await exchange.depositEther({ from: user1, value: ether(1) })
            //give tokens to user2
            await token.transfer(user2, tokens(100), { from: deployer })
            //user2 deposits tokens only
            await token.approve(exchange.address, tokens(2), { from: user2 })
            await exchange.depositToken(token.address, tokens(2), { from: user2 })
            //user1 makes an order to buy tokens with Ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
        })


        describe('filling orders', async () => {
            let result;

            describe('success', async () => {
                beforeEach(async () => {
                    //user2 fills order
                    result = await exchange.fillOrder('1', { from: user2 })
                })

                it('executes the trade & charges fees', async () => {
                    let balance
                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                    balance.toString().should.equal(ether(1).toString(), 'user2 received ether')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                    balance.toString().should.equal('0', 'user2 Ether deducted')
                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens decucted with fee applied')
                    const feeAccount = await exchange.feeAccount()
                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
                })
    
                it('updates filled orders', async () => {
                    const orderFilled = await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })
    
                it('emits a "Trade" event', async () => {
                    const log = result.logs[0]
                    log.event.should.equal('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1')
                    event.user.should.equal(user1)
                    event.tokenGet.should.equal(token.address)
                    event.amountGet.toString().should.equal(tokens(1).toString())
                    event.tokenGive.should.equal(ETHER_ADDRESS)
                    event.amountGive.toString().should.equal(ether(1).toString())
                    event.userFill.should.equal(user2)
                    event.timestamp.toString().length.should.be.at.least(1)
                })
            })

            

            describe('failure', async () => {
                
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999;
                    await exchange.fillOrder(invalidOrderId, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects already filled orders', async () => {
                    //fill the order
                    await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
                    //try to fill it again
                    await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects already cancelled orders', async () => {
                    //cancel the order
                    await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
                    //try to fill order
                    await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })

        describe('cancelling orders', async () => {
            let result;

            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', { from: user1 })
                })

                it('updates cancelled order', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })

                it('emits a cancel event', async () => {
                    const log = result.logs[0]
                    log.event.should.equal('Cancel')
                    const event = log.args
                    event.id.toString().should.equal('1')
                    event.user.should.equal(user1)
                    event.tokenGet.should.equal(token.address)
                    event.amountGet.toString().should.equal(tokens(1).toString())
                    event.tokenGive.should.equal(ETHER_ADDRESS)
                    event.amountGive.toString().should.equal(ether(1).toString())
                    event.timestamp.toString().length.should.be.at.least(1)
        
                })
            })

            describe('failure', async () => {
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 999
                    await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)

                })
                
                it('rejects unauthorized cancelations', async () => {
                    //try to cancel the order form another user
                    await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                
                })
            })
        })
    })
   
})