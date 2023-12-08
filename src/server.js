const qs = require("qs");
const crypto = require("crypto");
const axios = require("axios");

// User local maintenance highway token
let token = "";

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
	const url = `/v1.0/devices/${deviceId}//statistics/months`;
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
