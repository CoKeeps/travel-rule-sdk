# Travel Rule SDK

Travel Rule SDK for VASPs to exchange required originator/beneficiary data securely and meet global compliance requirements.

## Features

- **IVMS101 Compliance** - Supports the IVMS101 data model standard

## Installation

```bash
npm install @cokeeps/travel-rule-sdk
```

Or using yarn/pnpm:

```bash
yarn add @cokeeps/travel-rule-sdk
pnpm add @cokeeps/travel-rule-sdk
```

## Quick Start

```typescript
import { createTravelSDK } from '@cokeeps/travel-rule-sdk';

// Initialize client
const client = createTravelSDK({
  endpoint: 'https://api.example.com',
  debug: true,
});

// Set VASP keys
const vaspKeys = {
  vasp_id: 'your-vasp-id',
  sig: { priv: { /* JWK */ }, pub: { /* JWK */ } },
  dpop: { priv: { /* JWK */ }, pub: { /* JWK */ } },
  enc: { priv: { /* JWK */ }, pub: { /* JWK */ } },
};

// Send a message
const response = await client.sendMessageWithAuth(vaspKeys, {
  ivms101Version: '1.0',
  messageId: 'msg-123',
  createdAt: new Date().toISOString(),
  transfer: {
    direction: 'OUTBOUND',
    asset: 'USDT',
    amount: '1000.00',
    network: 'TRC20',
    txHash: '0x...',
    originatingAddress: 'TWallet...',
    beneficiaryAddress: 'TWallet...',
  },
  originatingVasp: { vaspName: 'My VASP' },
  beneficiaryVasp: { vaspName: 'Partner VASP' },
  originator: {
    type: 'NATURAL',
    name: {
      nameIdentifier: [{
        primaryIdentifier: 'John',
        nameIdentifierType: 'LEGL',
      }],
    },
  },
  beneficiary: {
    type: 'NATURAL',
    name: {
      nameIdentifier: [{
        primaryIdentifier: 'Jane',
        nameIdentifierType: 'LEGL',
      }],
    },
  },
});

console.log('Message sent:', response.messageId);

// Retrieve a message
const message = await client.getMessageWithAuth(vaspKeys, response.messageId);
console.log('Retrieved message:', message);
```

## Configuration

```typescript
interface SDKConfig {
  endpoint: string;                    // Required: API endpoint URL
  timeout?: number;                     // Optional: Request timeout (default: 30000ms)
  headers?: Record<string, string>;    // Optional: Additional headers
  debug?: boolean;                      // Optional: Enable debug logging
  logger?: (message: string, data?: any) => void; // Optional: Custom logger
}
```

## Authentication

The SDK supports automatic and manual authentication:

```typescript
// Automatic
const token = await client.authenticate(vaspKeys);
const message = await client.getMessageWithAuth(vaspKeys, 'message-id');

// Manual
client.setVaspKeys(vaspKeys);
const token = await client.getAccessToken();
const message = await client.getMessage(token.access_token, 'message-id');
```

## Error Handling

```typescript
import { SDKError, ValidationError } from '@cokeeps/travel-rule-sdk';

try {
  await client.sendMessageWithAuth(vaspKeys, messageData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message, error.field);
  } else if (error instanceof SDKError) {
    console.error('SDK error:', error.message);
  }
}
```

## API Methods

### Authentication
- `authenticate(vaspKeys)` - Authenticate and get access token
- `getAccessToken()` - Get OAuth access token
- `getClientAssertion(client_id)` - Generate client assertion JWT
- `getDpopProof(purpose, accessToken?, messageID?)` - Generate DPoP proof

### Messages
- `sendMessage(messageData, accessToken)` - Send a message
- `sendMessageWithAuth(vaspKeys, messageData)` - Send with auto-auth
- `getMessage(accessToken, messageID)` - Retrieve a message
- `getMessageWithAuth(vaspKeys, messageID)` - Get with auto-auth

### Configuration
- `setVaspKeys(vaspKeys)` - Set VASP keys
- `getVaspKeys()` - Get current VASP keys
- `updateEndpoint(endpoint)` - Update API endpoint
- `getEndpoint()` - Get current endpoint

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  SDKConfig,
  VaspKeys,
  MessageFormData,
  AccessTokenResponse,
  SendMessageResponse,
} from '@cokeeps/travel-rule-sdk';
```

## Requirements

- Node.js 18 or higher
- TypeScript

## Documentation

For comprehensive documentation, see [here](https://github.com/CoKeeps/travel-rule-sdk/wiki).

## License



---

**Package:** `@cokeeps/travel-rule-sdk`  
**Repository:** [GitHub](https://github.com/CoKeeps/travel-rule-sdk)
