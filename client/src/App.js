import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3"; import ipfs from './ipfs'

import "./App.css";

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      accounts: null,
      contract: null,
      buffer: null,
      ipfsHash: '',
    }
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    // await contract.methods.set(5).send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();

    // Update state with the result.
    console.log('response', response)
    this.setState({ ipfsHash: response });
  };
  captureFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    console.log(file);
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  onSubmit(event) {
    event.preventDefault()
    const { accounts, contract } = this.state;

    ipfs.files.add(this.state.buffer, async (error, result) => {
      if (error) {
        console.error(error)
        return
      }
      await contract.methods.set(result[0].hash).send({ from: accounts[0] });

      this.setState({ ipfsHash: result[0].hash })
      return console.log('ifpsHash', this.state.ipfsHash)
    })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">

        <h2 className="text-3xl font-bold underline">IPFS file upload with Ethereum contract example</h2>
        <h1>Your Image</h1>
        <p>{'This image is stored on IPFS & The Ethereum Blockchain!'}</p>
        <div className="flex justify-center align-middle">

          <img className="h-40 " src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" />
        </div>
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit} >
          <input type='file' onChange={this.captureFile} />
          <input type='submit' />
        </form>
      </div>
    );
  }
}

export default App;
