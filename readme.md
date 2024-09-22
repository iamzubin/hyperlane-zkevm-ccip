
# Hyperlane zkeVM CCIP API

  

This project provides an API endpoint for processing cross-chain interoperability protocol (CCIP) requests using Hyperlane and zkeVM.

  

## API Endpoint

  

### POST /

  

This endpoint processes CCIP requests and returns encoded ABI data for claim transactions.

  

#### Request Body

  

The request body should be a JSON object with the following structure:

  

```json

{

"data": "string",

"sender": "string"

}
```

  
  

- `data`: A string representing the metadata of the deposit.

- `sender`: The address of the sender (currently not used in the processing).

  

#### Response

  

The API will respond with one of the following:

  

1. Success Response (200 OK):

```json

{

"data": "0x..."  // Encoded ABI data

}
```

  

2. Error Responses:

- 404 Not Found: If the deposit is not found.

- 503 Service Unavailable: If the deposit is not ready for claim or has already been claimed.

- 500 Internal Server Error: For any other errors during processing.

  

#### Process Overview

  

1. The API receives the request with deposit metadata.

2. It queries the Polygon zkeVM bridge API to find the matching deposit.

3. If found and ready for claim, it fetches the merkle proof for the deposit.

4. The API then encodes the claim data using ethers.js.

5. Finally, it returns the encoded ABI data, which can be used to submit a claim transaction.

  

## Environment Variables

  

The following environment variables need to be set:

  

- `BASE_URL`: The base URL for the Polygon zkeVM bridge API (e.g., https://bridge-api.public.zkevm-test.net)

- `ISM_ADDRESS`: The address of the Interchain Security Module (ISM)