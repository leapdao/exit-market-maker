
const axios = require('axios');
const leap = require('leap-core');
const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");

const abi = require('./abi');

const provider = new HDWalletProvider(process.env.PRIV_KEY, process.env.ETH_NETWORK);
const web3 = new Web3(provider);
const exitHandler = new web3.eth.Contract(abi, process.env.EXIT_HANDLER);

let response;
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 * @param {string} event.resource - Resource path.
 * @param {string} event.path - Path parameter.
 * @param {string} event.httpMethod - Incoming request's method name.
 * @param {Object} event.headers - Incoming request headers.
 * @param {Object} event.queryStringParameters - query string parameters.
 * @param {Object} event.pathParameters - path parameters.
 * @param {Object} event.stageVariables - Applicable stage variables.
 * @param {Object} event.requestContext - Request context, including authorizer-returned key-value pairs, requestId, sourceIp, etc.
 * @param {Object} event.body - A JSON string of the request payload.
 * @param {boolean} event.body.isBase64Encoded - A boolean flag to indicate if the applicable request payload is Base64-encode
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 * @param {string} context.logGroupName - Cloudwatch Log Group name
 * @param {string} context.logStreamName - Cloudwatch Log stream name.
 * @param {string} context.functionName - Lambda function name.
 * @param {string} context.memoryLimitInMB - Function memory.
 * @param {string} context.functionVersion - Function version identifier.
 * @param {function} context.getRemainingTimeInMillis - Time in milliseconds before function times out.
 * @param {string} context.awsRequestId - Lambda request ID.
 * @param {string} context.invokedFunctionArn - Function ARN.
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * @returns {boolean} object.isBase64Encoded - A boolean flag to indicate if the applicable payload is Base64-encode (binary support)
 * @returns {string} object.statusCode - HTTP Status Code to be returned to the client
 * @returns {Object} object.headers - HTTP Headers to be returned
 * @returns {Object} object.body - JSON Payload to be returned
 * 
 */
exports.lambdaHandler = async (event, context) => {
    const from = (await web3.eth.getAccounts())[0];
    try {
        const data = JSON.parse(event.body);
        console.log(data);
        const tx = leap.Exit.txFromProof(data.transferProof);
        const sellValue = parseInt(data.signedData[1]);
        const utxoValue = tx.outputs[data.outputIndex].value;

        if (sellValue < process.env.RATE*utxoValue) {
            response = {
                'statusCode': 400,
                'body': JSON.stringify({
                    error : "Price too low"
                })
            }
        } else {

            const sendTx = () => {
                return new Promise((resolve, reject) => {
                    exitHandler.methods.startBoughtExit(
                        data.inputProof, 
                        data.transferProof,
                        data.outputIndex,
                        data.inputIndex,
                        data.signedData)
                    .send({
                        from: from,
                        gasPrice: process.env.GAS_PRICE,
                        gas: 2000000
                    }, (error, transactionHash) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(transactionHash);
                        }
                    })
                });
            }

            const txHash = await sendTx();
            console.log(txHash);

            response = {
                'statusCode': 200,
                'body': JSON.stringify({
                    txHash: txHash
                })
            }
        }        
    } catch (err) {
        console.log(err);
        return {
            'statusCode': 400,
            'body': JSON.stringify({
                error : err.message
            })
        };
    }

    return response;
};
