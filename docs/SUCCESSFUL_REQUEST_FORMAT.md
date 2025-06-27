# Bolt.new Successful Request Format Documentation

## Overview
This document contains the exact format that successfully authenticates and communicates with bolt.new's chat API.

## 🍪 Cookie Format
```
_fbp=fb.1.1749901457387.683074235251349705; _ga=GA1.1.687330784.1749901458; ajs_anonymous_id=ODdjMzk0MzctM2E0Yi00YjJiLWI0ZjgtODZhMGJiNTU3NWFm; hubspotutk=e388db2bbd055574895fe623abc00acc; activeOrganizationId=MjI4NTE%3D; _gcl_au=1.1.1806974786.1749901457.135721763.1749945803.1749945802; __hssrc=1; __session=eyJkIjoiZVR6SUdsdTlaZlh5cGJnblNjeWVsdVpmNTZlU0liRDRDL1k5VDB5cTJKMTNKU3o1bDRrS0RPa29FcHJDekRNSlo3cjBxRFVTelZpcVl0ajQySzZhU3l4Y29HQUtsbXFHVHk0NkRqcW8vb1RSbDl1TWQyYVdyVWY0YytvWjU1Z2Jnb0RJNXRFakIyVTFpOTdyRi9jK2VBdTYrT0dVaXlQUTM2SWVOdkJWdnAyYnh4Zi9zQ3NUSEMzc0w3eWJnbUlneU1hVDF4YXppejQvUjZwRXB1bXpKZ1VZYURUb0cwMGZsWUpRL25CWkF6UDAzYzJMc2dkcVFLL0xITkFoZ05KWEtDREdrbklOdUFidDRVVkpqV2hoMFRoTGtXbVh2dCtJTXVySjVueWozZWM9In0%3D.UVzs7gZ%2BrfXZZL8gW%2FqYnGdR%2FRhYK60tIwLMl%2FVV9Po; _ga_SLJ4P1NJFR=GS2.1.s1749952602$o5$g1$t1749952603$j59$l0$h0; _rdt_uuid=1749901458275.527a32b3-5d84-4634-819f-75fb14841ed3; __hstc=69929231.e388db2bbd055574895fe623abc00acc.1749901457549.1749947958589.1749952606059.6; __hssc=69929231.1.1749952606059
```

### Key Cookie Components:
- `__session`: Main session token (URL encoded)
- `activeOrganizationId`: Team organization ID (MjI4NTE%3D = base64 encoded)
- `_ga`, `_fbp`: Analytics cookies
- `hubspotutk`: Marketing tracking
- `__hstc`, `__hssc`, `__hssrc`: HubSpot tracking

## 📋 Required Headers

### Essential Headers:
```javascript
{
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/json',
  'Cookie': '[cookies above]',
  'Origin': 'https://bolt.new',
  'Priority': 'u=1, i',
  'Referer': 'https://bolt.new/~/sb1-sum3bqy5',
  'Sec-Ch-Ua': '"Google Chrome";v="137", "Not/A)Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'X-Bolt-Client-Revision': 'd65f6d0',
  'X-Bolt-Project-Id': '49956303'
}
```

### Critical Headers:
- `X-Bolt-Client-Revision`: Must match current bolt.new client version
- `X-Bolt-Project-Id`: Project identifier
- `Cookie`: Complete session cookies
- `Origin`: Must be https://bolt.new
- `Sec-Fetch-*`: Security headers required by browser

## 📝 Payload Structure

### Team Account Chat Request:
```javascript
{
  "id": "unique-request-id",
  "errorReasoning": null,
  "featurePreviews": { 
    "diffs": false, 
    "reasoning": false 
  },
  "framework": "DEFAULT_TO_DEV",
  "isFirstPrompt": false,
  "messages": [
    { 
      "id": "message-id", 
      "role": "user", 
      "content": "Your message here" 
    }
  ],
  "metrics": { 
    "importFilesLength": 0, 
    "fileChangesLength": 0 
  },
  "projectId": "49956303",
  "promptMode": "discussion",
  "stripeStatus": "not-configured",
  "supportIntegrations": true,
  "usesInspectedElement": false
}
```

### Required Fields:
- `id`: Unique request identifier
- `messages`: Array with user message
- `projectId`: Must match X-Bolt-Project-Id header
- `promptMode`: "discussion" for chat mode
- `framework`: "DEFAULT_TO_DEV"

## 🔄 Response Format

### Successful Response:
- **Status**: 200 OK
- **Content-Type**: Usually text/plain (streaming)
- **Body**: Streaming text response starting with "0:" prefix

### Example Response:
```
0:"I can certainly help you with that! Creating a simple React component involves defining a function that returns JSX and then rendering it.\n\n## The Plan\n\n1.  **Create a new component file**: You...
```

## 🚨 Important Notes

1. **Session Expiry**: Cookies expire and need to be refreshed regularly
2. **Client Revision**: `d65f6d0` may change with bolt.new updates
3. **Project ID**: Should match the actual project being worked on
4. **Streaming**: Responses are streamed, not JSON
5. **Team Account**: This format is for team accounts with `activeOrganizationId`

## 🔧 Testing

Use the provided test scripts to verify:
- `test-local-fresh.js` - Test against local proxy
- `test-with-fresh-cookies.js` - Test against deployed proxy

## 📅 Last Updated
2025-06-15 - Verified working with bolt.new team account
