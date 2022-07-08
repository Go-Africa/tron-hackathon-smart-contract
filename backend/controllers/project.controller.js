const { tronWeb } = require("../configs/tron.config");
// import { tronWeb } from '../configs/tron.config';
const { converter, isAddress } = require("../configs/tron.addresses.config");
require('dotenv').config({ path: '.env' });
const schedule = require('node-schedule');
const axios = require('axios');
const projectAbi = require("../../build/contracts/Project.json").abi;
var contract;
var projectContract;
var stableToken;

/* Transaction options */
let options = {
    feeLimit: 1_000_000_000,
    callValue: 0
};

/*
*   Initialize project contract
*   Get Contributions of the Project
*/
const getContributions = async () => {
    await initProjectContract(address);
    const data = await projectContract.getContributions().call();
    console.log("contributions", data);
    if (data) {
        return data;
    } else {
        throw "Unable to get contributions";
    }
}

/* Init Contract and set default Variable *Contract* */
async function init() {
    try {
        contract = await tronWeb.contract().at('TRUeV3TqZdgzimt73ukLB6JZXFsU2bDvum');
    } catch (error) {
        throw "Unable to get contract instance";
    }
}

/* Init Project Contract and set default Variable *projectContract* */
async function initProjectContract(address) {
    if (isAddress(address)) {
        try {
            projectContract = await tronWeb.contract().at(address);
            projectContract.loadAbi(projectAbi);
        } catch (error) {
            throw "Unable to get contract instance; check your address !";
        }
    } else {
        throw "Real address needed!"
    }
}

/* Get Stable token (USDT) */
async function getStableToken() {
    try {
        stableToken = await tronWeb.contract().at("TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"); /* USDT NILE Contract */
    } catch (error) {
        throw "Unable to get stable token";
    }
}

/* check transactio hash */
exports.checkTransactionHash = async (req, res) => {
    const projectAddress = req.params.address;
    const userId = req.params.user;
    const txnHash = req.params.hash;
    try {
        await initProjectContract(projectAddress);
        const isInvestor = await projectContract.checkIfExist(userId).call();
        if (isInvestor) {
            try {
                const tnxChecker = await tronWeb.trx.getConfirmedTransaction(txnHash);
                return "SUCCESS";
            } catch (error) {
            console.log("An error:",error);
                return "ERROR";
            }
        }
        return "ERROR";
    } catch (error) {
        return "ERROR";
    }
}

/* Get all available project addresses */
exports.getAllProjects = async (req, res) => {
    try {
        await init(); /* First init contract instance */
        let data = await contract.returnProjectsAddresses().call();
        return res.status(200).json({ msg: "Success", success: true, data: data });
    } catch (error) {
        return res.status(500).json({ msg: "unable to find project list !", success: false, data: error });
    }
}

/* Create a project and return address */
exports.createproject = async (req, res) => {
    // console.log("24a6da2e40f392be1ef0f102b2918ae47b72b64122704c041a5e6a296f9b262a");
    const body = req.body;

    /* Check reference and amount */
    if (isNaN(Number(body.ref)) || isNaN(Number(body.amount))) {
        return res.status(400).json({ msg: "Only Number need for amount or ref", success: false, data: null });
    }

    try {
        await init();
        await getStableToken();
    console.log("Enter");
        const projectGoal = Number(body.amount) * 1e6; /* convert amount of the project */
        const result = await contract.createProject(
            converter(stableToken.address),
            Number(body.ref),
            projectGoal,
            body.title
        ).send({
            feeLimit: 1_000_000_000,
            callValue: 0,
            shouldPollResponse: true
        });
        return res.status(200).json({ msg: "Success", success: true, data: tronWeb.address.fromHex(result) });
    } catch (error) {console.log("Error",error);
        return res.status(500).json({ msg: "unable to create project", success: false, data: error.error });
    }
};

/* get all project details */
exports.getProjectById = async (req, res) => {
    let id = req.params.id;

    /* Check if the id is a real number */
    if (isNaN(Number(id))) {
        return res.status(400).json({ msg: "Only Number need here", success: false, data: null });
    }

    try {
        await init();
        const project = await contract.getProjectByRef(Number(id)).call();
        if (project) {
            // Convert
            const result = {
                address: project["proj"],
                addressFromHex: tronWeb.address.fromHex(project["proj"]),
                projectRef: project["ref"],
                goalAmount: project["goalAmount"],
                currentAmount: project["currentAmount"],
                title: project["title"]
            }

            return res.status(200).json({ msg: "Success", success: true, data: result });
        } else {
            return res.status(500).json({ msg: "unable to create project", success: false, data: error.error });
        }
    } catch (error) {
        console.log("Error", error);
        return res.status(500);
    }
};

// project details converter
function convertAllData(data) {
    return {
        creatorAddress: data["creator"],
        projectRef: data["projectRef"],
        projectTitle: data["projectTitle"],
        currentState: data["currentState"],
        projectGoalAmount: data["projectGoalAmount"],
        currentAmount: data["currentAmount"],
        investments: data["investmentss"],
        cashins: data["cashinss"],
        cashouts: data["cashoutss"]
    };
}

/*
*   Get all Project Details
*   Pass address of the project
*   Return details, investments, cashins, cashout...
*/
exports.getAllProjectDetails = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const project = await projectContract.getDetails().call();
        return res.status(200).json({ msg: "Success", success: true, data: convertAllData(project) });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get project", success: false, data: error.error });
    }
}


/* Convert contributions data */
function convertContribsData(data) {
    return {
        investments: data["invests"],
        currentBalance: data["currentAmount"],
        goalAmount: data["goal"]
    }
}
/*
*   Get Project Contributions
*   Pass address of the project
*   Return investments, golAmount and current amount
*/
exports.getProjectContributions = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const contribs = await projectContract.getContributions().call();
        console.log("Contribs", contribs);
        return res.status(200).json({ msg: "Success", success: true, data: convertContribsData(contribs) });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get data", success: false, data: error.error });
    }
}

/*
*   Get Project Cash In
*/
exports.getProjectCashIns = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const cashins = await projectContract.getCashIns().call();
        return res.status(200).json({ msg: "Success", success: true, data: cashins });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get data", success: false, data: error.error });
    }
}


/*
*   Get Project Cash Out
*/
exports.getProjectCashOuts = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const cashouts = await projectContract.getCashOuts().call();
        return res.status(200).json({ msg: "Success", success: true, data: cashouts });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get data", success: false, data: error.error });
    }
}


/*
*   Make a Cash In
*/
exports.addCashIn = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const amount = req.body.amount * 1e6;
        const today = new Date().toISOString();
        const cashin = await projectContract.cashIn(today, req.body.address, req.body.reason, amount)
            .send({
                feeLimit: 1_000_000_000,
                callValue: 0,
                shouldPollResponse: true
            });
        return res.status(200).json({ msg: "Success", success: true, data: cashin });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get data", success: false, data: error.error });
    }
}


/*
*   Make a Cash Out
*/
exports.sendCashOut = async (req, res) => {
    try {
        await initProjectContract(req.params.address);
        const amount = req.body.amount * 1e6;
        const today = new Date().toISOString();
        const cashout = await projectContract.cashOut(today, req.body.address, req.body.reason, amount)
            .send({
                feeLimit: 1_000_000_000,
                callValue: 0,
                shouldPollResponse: true
            });
        return res.status(200).json({ msg: "Success", success: true, data: cashout });
    } catch (error) {
        return res.status(500).json({ msg: "unable to get data", success: false, data: error.error });
    }
}

/*
*   Set Project State
*/
exports.setProjectState = async (req, res) => {
    let pk = req.headers.authorization.toString();
    if (pk.includes("pk;")) {
        pk = ak.replace("pk;", "");

        if (pk === tronWeb.defaultPrivateKey) {
            await initProjectContract(req.params.address);
            try {
                const cashouts = await projectContract.getCashOuts().call();
                return res.status(200).json({ msg: "Success", success: true, data: cashouts });
            } catch (error) {
                return res.status(500).json({ msg: "unable to get project", success: false, data: error.error });
            }
        } else {
            return res.status(400).json({ msg: "Bad token sent !", success: false, data: null });
        }
    } else {
        return res.status(401).json({ msg: "Token needed !", success: false, data: null });
    }
}


// Invest to a project
exports.invest = async (req, res) => {
    let body = req.body;
    
    var amount = parseInt(body.amount) * 1e6;
    
    try {
        await initProjectContract(req.params.addr);
        await getStableToken();
        var approve = await stableToken.approve(projectContract.address, amount)
            .send({
                feeLimit: 1_000_000_000,
                callValue: 0,
                shouldPollResponse: true
            });
        console.log("Approve", approve);

        let trx = await tronWeb.trx.sign(approve, tronWeb.defaultPrivateKey);

        console.log("Approbation", trx);
        res.send("WEll");
        // try {
        //     const result = await projectContract.invest(amount, body.email)
        //         .send({
        //             feeLimit: 1_000_000_000,
        //             callValue: amount,
        //             shouldPollResponse: true
        //         });
        //     console.log("result", result);
        //     return res.status(200).json({ success: true, data: result });
        // } catch (error) {
        //     console.log("error invest", error);
        //     return res.status(500).json({ msg: "unable to invest", success: false, data: error.error });
        // }
    } catch (error) {
        console.log("error approval", error);
        return res.status(500).json({ msg: "Transaction could not be approved !", success: false, data: error.error });
    }


};

/*
*   Project scheduler for pay all investors
*   get all investments, use contract "sendIncome" method
*   on each investor's address and also save in a table all
*   failed transaction to repeat the process again
*/
exports.setScheduler = async (req, res) => {
    schedule.scheduleJob(req.body.dateToLaunch, async () => {
        // Define array of real amount investors may have and failed sending transactions
        var logicInvestment = [];
        var failedSending = [];

        try {
            const contribs = await getContributions(req.params.address);
            const goalAmount = contribs.goal;
            const currentAmount = contribs.currentAmount;

            for (const invest of contribs.invests) {
                const rate = invest.amount / goalAmount;
                logicInvestment.push({
                    address: invest.investorAddress,
                    amount: rate * currentAmount,
                    mail: invest.email
                });
            }

            // Now sendIncomes
            let first = true;
            do {
                // Firstly send income with normal array of contributors
                if (first) {
                    for (const investor of logicInvestment) {
                        try {
                            let parameter = [
                                {
                                    type: 'address',
                                    value: investor.address,
                                },
                                {
                                    type: 'uint256',
                                    value: investor.amount,
                                }
                            ];

                            const txn = await tronWeb.transactionBuilder.triggerSmartContract(
                                contract.address,
                                "sendIncome(address,uint256)",
                                options,
                                parameter
                            );
                            const signedtxn = await tronWeb.trx.sign(txn.transaction, "24a6da2e40f392be1ef0f102b2918ae47b72b64122704c041a5e6a296f9b262a");
                            const response = await tronWeb.trx.sendRawTransaction(signedtxn);
                            // console.log('amount', investor.amount);
                            // const sending = await projectContract.sendIncome(investor.address, investor.amount)
                            //     .send({
                            //         feeLimit: 1_000_000_000,
                            //         callValue: 0,
                            //         shouldPollResponse: true
                            //     });
                            // console.log(`Sending result for ${investor.address}`, sending)

                            // Send email to successful notified
                            axios.get(`https://tron-hackathon-spring-backend.go-africa.io/project/income/${req.params.id}/${investor.mail}`)
                                .then(
                                    res => {
                                        if (~~(res.status / 200) <= 4) {
                                            console.log("Everything work successfully", res.status);
                                        } else {
                                            console.log("Nothing works");
                                        }
                                    }
                                ).catch(
                                    err => {
                                        console.log('Here the error', err);
                                    }
                                )
                        } catch (error) {
                            console.log("The error", error);
                            failedSending.push(investor);
                        }
                    }
                    first = false;
                } else {
                    // If some send has failed send income with failed array of contributors
                    for (const investor of failedSending) {
                        let parameter = [
                            {
                                type: 'address',
                                value: investor.address,
                            },
                            {
                                type: 'uint256',
                                value: investor.amount,
                            }
                        ];

                        const txn = await tronWeb.transactionBuilder.triggerSmartContract(
                            contract.address,
                            "sendIncome(address,uint256)",
                            options,
                            parameter
                        );
                        const signedtxn = await tronWeb.trx.sign(txn.transaction, "24a6da2e40f392be1ef0f102b2918ae47b72b64122704c041a5e6a296f9b262a");
                        const response = await tronWeb.trx.sendRawTransaction(signedtxn);
                        axios.get(`https://tron-hackathon-spring-backend.go-africa.io/project/income/${req.params.id}/${investor.mail}`)
                            .then(
                                res => {
                                    if (~~(res.status / 200) <= 4) {
                                        console.log("Everything work successfully", res.status);
                                    } else {
                                        console.log("Nothing works");
                                    }
                                }
                            ).catch(
                                err => {
                                    console.log('Here the error', err);
                                }
                            )
                        // try {
                        //     await projectContract.sendIncome(investor.address, investor.amount)
                        //         .send({
                        //             feeLimit: 1_000_000_000,
                        //             callValue: 0,
                        //             shouldPollResponse: true
                        //         });
                        // } catch (error) {
                        //     console.log("The investor", investor);
                        //     console.log("The error", error);
                        //     failedSending.push(investor)
                        // }
                    }
                }
            } while (failedSending.length > 0);

            console.log("Everything work successfully");
        } catch (error) {
            throw error;
        }
    });

    res.status(200).json({ message: 'set successfully !' });

};
