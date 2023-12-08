const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const qs = require("qs");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors');
const app = express();
app.use(cors({
    origin: "http://localhost:3000", // Allow only your React app's origin
}));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",  // Allow only your React app's origin
        methods: ["GET", "POST"]          // Allowable methods
    }
}); // setup Socket.IO

let token ='';
const config = {
  	// Service address
	host: "https://openapi.tuyaeu.com",
	// Access Id
	accessKey: "7xr5c83e4h5xtdrpyxyy",
	// Access Secret
	secretKey: "7d1b054948a44f5ea0620d5595fa841e",
	// Interface example device_id
	deviceId: "bf5d82c1587548915fcz8i",
};

const httpClient = axios.create({
    baseURL: config.host,
    timeout: 5000,
});

async function main() {
	await getToken();
	const data = await getDeviceInfo(config.deviceId);
//	console.log("success: ", JSON.stringify(data.result));
  const status = data.result.status
  console.log(status);
}

// fetch highway login token
async function getToken() {
	const method = "GET";
	const timestamp = Date.now().toString();
	const signUrl = "/v1.0/token?grant_type=1";
	const contentHash = crypto.createHash("sha256").update("").digest("hex");
	const stringToSign = [method, contentHash, "", signUrl].join("\n");
	const signStr = config.accessKey + timestamp + stringToSign;

	const headers = {
		t: timestamp,
		sign_method: "HMAC-SHA256",
		client_id: config.accessKey,
		sign: await encryptStr(signStr, config.secretKey),
	};

	const { data: login } = await httpClient.get("/v1.0/token?grant_type=1", {
		headers,
	});
	if (!login || !login.success) {
		throw new Error(`Authorization Failed: ${login.msg}`);
	}
	token = login.result.access_token;
}

// fetch highway business data
async function getDeviceInfo(deviceId) {
	const query = {};
	const method = "GET";
	const url = `/v1.0/devices/${deviceId}/`;
	const reqHeaders = await getRequestSign(url, method, {}, query);

	try {
		const response = await httpClient.request({
			method,
			data: {},
			params: {},
			headers: reqHeaders,
			url: reqHeaders.path,
		});

		// Logging the entire response
		// console.log("Response from getDeviceInfo:", response);

		if (!response || !response.data || !response.data.success) {
			throw new Error(
				`Request failed: ${
					response ? response.data.msg : "No response"
				}`
			);
		}

		// Return or log the actual data
		return response.data;
	} catch (error) {
		console.error(`Error in getDeviceInfo: ${error.message}`);
		throw error; // Rethrow the error to handle it in main
	}
}

// HMAC-SHA256 crypto function
async function encryptStr(str, secret) {
	return crypto
		.createHmac("sha256", secret)
		.update(str, "utf8")
		.digest("hex")
		.toUpperCase();
}

// Request signature, which can be passed as headers
async function getRequestSign(
	path,
	method,
	headers = {},
	query = {},
	body = {}
) {
	const t = Date.now().toString();
	const [uri, pathQuery] = path.split("?");
	const queryMerged = Object.assign(query, qs.parse(pathQuery));
	const sortedQuery = {};
	Object.keys(queryMerged)
		.sort()
		.forEach((i) => (sortedQuery[i] = query[i]));

	const querystring = decodeURIComponent(qs.stringify(sortedQuery));
	const url = querystring ? `${uri}?${querystring}` : uri;
	const contentHash = crypto
		.createHash("sha256")
		.update(JSON.stringify(body))
		.digest("hex");
	const stringToSign = [method, contentHash, "", url].join("\n");
	const signStr = config.accessKey + token + t + stringToSign;
	return {
		t,
		path: url,
		client_id: config.accessKey,
		sign: await encryptStr(signStr, config.secretKey),
		sign_method: "HMAC-SHA256",
		access_token: token,
	};
}

main().catch((err) => {
	throw new Error(`ERROR: ${err}`);
});

io.on('connection', (socket) => {
    console.log('New client connected');


    const sendData = async () => {
        try {
            await getToken();
            const data = await getDeviceInfo(config.deviceId);
            console.log("This is data:",data);
            socket.emit('realtimeData', data.result); // Emitting data to the client
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    };

    // Sending data every 5 seconds (or as per your requirement)
    const interval = setInterval(() => sendData(), 5000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
