import React, { Component } from 'react';
import './App.css';
import axios from "axios";
import elliptic from "elliptic";
import crypto from "crypto";
import Base58 from "base-58";

// Define hex-format address and WIF privkey version bytes
const BTC_ADDR_PREFIX = "00";
const BTC_WIF_PREFIX = "80";

// This class is the main Application component
class App extends Component {
        
    // This constructor initializes component state
    constructor(props) {

        super(props);

        // React Component state
        this.state = {
            phrase : "",
            addressData : "",
            balanceData : ""
        };

        // Bind custom internal methods
        this.updatePhrase = this.updatePhrase.bind(this);
        this.computeAddress = this.computeAddress.bind(this);
        this.loadBalanceData = this.loadBalanceData.bind(this);
    }

    // Update the internal state of the brainwallet phrase
    updatePhrase(event) {
        this.setState({ phrase: event.target.value });
    }

    /* Load address balance information from a public API
    * Then we can check and see if the address has ever had a balance and has been drained
    */
    async loadBalanceData() {

         const apiHandle = axios.create({
            baseURL : "https://api.blockcypher.com/v1/btc/main/addrs/",
            timeout : 3000,
         });

         const response = await apiHandle.get(
            this.state.addressData.address,
            { crossDomain : true }
         );

         const data = response.data;
         this.setState({ balanceData: data });
    }

    /* Generate an address from a brainwallet phrase
    * The steps are as follows:
    *
    * Hash the brainwallet phrase into a 256 bit private key using 1 round of SHA-256
    * Compute the public key from the private key using secp256k1 elliptic curve
    * Run the pubkey through 1 round of SHA-256, and one round of RIPEMD160
    * Add version prefix and double SHA checksum
    * Encode in base58
    */
    computeAddress() {

        // Hash the brainwallet phrase        
        var privkeyHex = crypto.createHash("sha256").update(this.state.phrase).digest("hex");
        
        // Compute the WIF private key format
        var privkeyWithVersion = BTC_WIF_PREFIX + privkeyHex;
        var wifRound1 = crypto.createHash("sha256").update(privkeyWithVersion, "hex").digest("hex");
        var wifRound2 = crypto.createHash("sha256").update(wifRound1, "hex").digest("hex");
        var wifChecksum = wifRound2.slice(0, 8);

        var rawWifPrivkey = privkeyWithVersion + wifChecksum;
        var privkeyWif = Base58.encode(Buffer.from(rawWifPrivkey, "hex"));
        
        // Compute the ECDSA public key
        var ec = new elliptic.ec("secp256k1");
        var keyPair = ec.keyFromPrivate(privkeyHex);
        var pubkeyHex = keyPair.getPublic().encode("hex");

        // Compute the double hash
        var round1 = crypto.createHash("sha256").update(pubkeyHex, "hex").digest("hex");
        var round2 = crypto.createHash("rmd160").update(round1, "hex").digest("hex");

        // Add the version prefix and checksum
        var rawNoCheck = BTC_ADDR_PREFIX + round2;
        var checkRound1 = crypto.createHash("sha256").update(rawNoCheck, "hex").digest("hex");
        var checkRound2 = crypto.createHash("sha256").update(checkRound1, "hex").digest("hex");
        var checksum = checkRound2.slice(0, 8);
        
        // Encode the final address in base58
        var rawAddress = rawNoCheck + checksum;
        var address = Base58.encode(Buffer.from(rawAddress, "hex"));
        
        // Update the addressData state, and once that's done try and load balance information using a callback
        this.setState({ "addressData" : { "privkeyHex" : privkeyHex,
                                          "privkeyWif" : privkeyWif,
                                          "pubkeyHex" : pubkeyHex,
                                          "address" : address
        }},
        () => { this.loadBalanceData(); });
        
    }

    render() {

        var addrTable = "";
        if (this.state.addressData !== "")
        {
            addrTable = (   <table>
                        <tbody>
                            <tr><th>Private Key (Hex)</th><td>{ this.state.addressData.privkeyHex }</td></tr>
                            <tr><th>Private Key (WIF)</th><td>{ this.state.addressData.privkeyWif }</td></tr>
                            <tr><th>Public Key (Hex)</th><td>{ this.state.addressData.pubkeyHex }</td></tr>
                            <tr><th>Address</th><td>{ this.state.addressData.address }</td></tr>
                        </tbody>
                        </table>
                    );
        }
        
        var balanceTable = "";
        if (this.state.balanceData !== "")
        {
            balanceTable = (    <table>
                        <tbody>
                            <tr><th>Amount Received</th><td>{ this.state.balanceData.total_received / 100000000 }</td></tr>
                            <tr><th>Amount Sent</th><td>{ this.state.balanceData.total_sent / 100000000 }</td></tr>
                            <tr><th>Number of Transactions</th><td>{ this.state.balanceData.n_tx }</td></tr>
                            <tr><th>Emptied?</th><td>{ this.state.balanceData.final_balance === 0 ? "Yes, pwned!" : "No, but still unsafe!" }</td></tr>
                        </tbody>
                        </table>
            
                    );
        }

        return (
          <div className="App">
            <header>
                <h2>Has this Brainwallet been pwned?</h2>
            </header>
            <body>
                <p>
                    Enter Brainwallet Phrase: <input id="phrase" onChange={this.updatePhrase}></input>
                    <button onClick={ this.computeAddress }>Retrieve Brainwallet Information</button>
                </p>
               { addrTable }
               { balanceTable }
            </body>
          </div>
        );
    }
}

export default App;
