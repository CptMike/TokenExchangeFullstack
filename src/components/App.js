import React, { Component } from 'react';
import './App.css';
import { loadWeb3, loadAccount, loadToken, loadExchange, update } from '../store/interactions';
import { connect } from 'react-redux';
import Navbar from './Navbar'
import Content from './Content';
import { contractsLoadedSelector } from "../store/selectors";

class App extends Component {
  async componentDidMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== 'undefined')
    await update(dispatch)

    window.ethereum.on('accountsChanged', async accounts => {
      await update(dispatch)
    })

    window.ethereum.on('chainChanged', async (chainId) => {
      await update(dispatch)
    })
  }
  // async loadBlockchainData(dispatch) {
  //   const web3 = await loadWeb3(dispatch)
  //   await web3.eth.net.getNetworkType()
  //   const networkId = await web3.eth.net.getId()
  //   await loadAccount(web3, dispatch)
  //   const token = await loadToken(web3, networkId, dispatch)
  //   if (!token) {
  //     window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
  //     return
  //   }
  //   const exchange = await loadExchange(web3, networkId, dispatch);
  //   if (!exchange) {
  //     window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
  //     return
  //   }
  // }
  

  render() {
    return (
      <div >
        <Navbar />
        { this.props.contractsLoaded ? <Content /> : <div className="content"></div> }
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}
export default connect(mapStateToProps)(App);
