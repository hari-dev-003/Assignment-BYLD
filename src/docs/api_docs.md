
# POST /v1/portfolios
## Create Portfolio

Creates a new investment portfolio for a client with a specified risk profile.

---

### Request Body

Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientName` | `string` | Yes | The full name of the client who owns the portfolio. |
| `riskProfile` | `string` | Yes | The risk tolerance level for the portfolio. Accepted values: `MODERATE`, `AGGRESSIVE`, `CONSERVATIVE`. |

**Example:**
```json
{
  "clientName": "Hari Dev",
  "riskProfile": "MODERATE"
}
```

---

### Response

#### `201 Created`

Returns the newly created portfolio object.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier for the portfolio. |
| `clientName` | `string` | The name of the client associated with the portfolio. |
| `riskProfile` | `string` | The risk profile assigned to the portfolio (`MODERATE`, `AGGRESSIVE`, `CONSERVATIVE`). |
| `cashBalance` | `string` | The current cash balance of the portfolio. Defaults to `"0"` on creation. |
| `createdAt` | `string` (ISO 8601) | Timestamp of when the portfolio was created. |

**Example:**
```json
{
  "id": "74646615-3698-46a7-9625-c1293fdb91e7",
  "clientName": "Hari Dev",
  "riskProfile": "MODERATE",
  "cashBalance": "0",
  "createdAt": "2026-04-26T12:13:48.547Z"
}
```

#### `400 Bad Request`

Returned when the request body fails validation.

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | A message describing the validation failure. |
| `details` | `array` | List of field-level errors with `path` and `message`. |

**Example:**
```json
{
  "error": "Validation Failed",
  "details": [
    { "path": "riskProfile", "message": "Invalid enum value. Expected 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'" }
  ]
}
```

---

# POST /v1/portfolios/{id}/balance
## Add Funds to Portfolio

Deposits a cash amount into the specified portfolio's balance.

---

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | The unique identifier of the portfolio to fund. |

---

### Request Body

Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | The amount to deposit into the portfolio. Must be a positive value. |

**Example:**
```json
{
  "amount": 50000.50
}
```

---

### Response

#### `200 OK`

Returns a confirmation with the updated cash balance.

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | Confirmation message indicating funds were added. |
| `newBalance` | `string` | The portfolio's total cash balance after the deposit. |

**Example:**
```json
{
  "message": "Funds added successfully",
  "newBalance": "100001"
}
```

#### `400 Bad Request`

Returned when the amount is missing or not a positive number.

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | A message describing the validation failure. |
| `details` | `array` | List of field-level errors with `path` and `message`. |

**Example:**
```json
{
  "error": "Validation Failed",
  "details": [
    { "path": "amount", "message": "Amount must be positive" }
  ]
}
```

#### `404 Not Found`

Returned when no portfolio matches the provided ID.

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | A message indicating the portfolio was not found. |

**Example:**
```json
{
  "error": "Portfolio ID does not exist"
}
```

---

# GET /v1/portfolios/{id}
## Get Portfolio Details

Retrieves the full details of a specific portfolio, including its holdings.

---

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | The unique identifier of the portfolio to retrieve. |

---

### Response

#### `200 OK`

Returns the portfolio object with all current holdings.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Indicates the request was successful. |
| `data.portfolioId` | `string` (UUID) | Unique identifier of the portfolio. |
| `data.clientName` | `string` | Name of the portfolio owner. |
| `data.riskProfile` | `string` | Risk tolerance level (`MODERATE`, `AGGRESSIVE`, `CONSERVATIVE`). |
| `data.cashBalance` | `string` | Available uninvested cash balance. |
| `data.holdings` | `array` | List of all current stock/asset positions. |
| `data.holdings[].symbol` | `string` | Stock ticker symbol. |
| `data.holdings[].quantity` | `string` | Number of shares held. |
| `data.holdings[].averageCost` | `string` | Weighted average cost per share across all buy orders. |
| `data.holdings[].totalInvested` | `string` | Total cost basis for this position (`quantity × averageCost`). |

**Example:**
```json
{
  "success": true,
  "data": {
    "portfolioId": "74646615-3698-46a7-9625-c1293fdb91e7",
    "clientName": "Hari Dev",
    "riskProfile": "MODERATE",
    "cashBalance": "67530",
    "holdings": [
      {
        "symbol": "RELIANCE",
        "quantity": "11",
        "averageCost": "2951.9091",
        "totalInvested": "32471.00"
      }
    ]
  }
}
```

#### `404 Not Found`

Returned when no portfolio matches the provided ID.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message indicating the portfolio was not found. |

**Example:**
```json
{
  "success": false,
  "error": "Portfolio not found"
}
```

---

# POST /v1/portfolios/{id}/buy
## Buy Stock

Purchases a specified stock and adds it to the given portfolio. The submitted price must be within ±0.5% of the current market price (slippage protection).

---

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | The unique identifier of the portfolio in which the stock will be purchased. |

---

### Request Body

Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | `string` | Yes | The stock ticker symbol to buy (e.g., `RELIANCE`). |
| `quantity` | `integer` | Yes | The number of shares to purchase. Must be a positive integer. |
| `price` | `number` | Yes | The price per share. Must be within ±0.5% of the current market price. |

**Example:**
```json
{
  "symbol": "RELIANCE",
  "quantity": 6,
  "price": 2956
}
```

---

### Response

#### `201 Created`

Returns a confirmation with the transaction summary.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Indicates the purchase was successful. |
| `message` | `string` | Human-readable confirmation message. |
| `data.symbol` | `string` | The ticker symbol of the stock purchased. |
| `data.quantity` | `integer` | The number of shares bought. |
| `data.totalCost` | `string` | Total amount deducted from the cash balance (`quantity × price`). |

**Example:**
```json
{
  "success": true,
  "message": "Stock purchased successfully",
  "data": {
    "symbol": "RELIANCE",
    "quantity": 6,
    "totalCost": "17736"
  }
}
```

#### `400 Bad Request`

Returned when the trade cannot be executed due to insufficient funds or a price outside the slippage tolerance.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message describing why the order was rejected. |

**Example — Insufficient Funds:**
```json
{
  "success": false,
  "error": "Insufficient cash balance to complete this trade"
}
```

**Example — Price Slippage Exceeded:**
```json
{
  "success": false,
  "error": "Order rejected: submitted price deviates more than 0.5% from the current market price"
}
```

#### `404 Not Found`

Returned when the stock symbol does not exist in the system.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message indicating the symbol was not found. |

**Example:**
```json
{
  "success": false,
  "error": "The stock symbol provided does not exist in our market"
}
```

---

# POST /v1/portfolios/{id}/sell
## Sell Stock

Initiates a sell order for a specific stock within a given portfolio. The submitted price must be within ±0.5% of the current market price (slippage protection). If all shares are sold, the holding is removed entirely.

---

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | The unique identifier of the portfolio in which the sell order is placed. |

---

### Request Body

Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | `string` | Yes | The stock ticker symbol representing the asset to sell (e.g., `RELIANCE`). |
| `quantity` | `integer` | Yes | The number of shares to sell. Must not exceed current holding quantity. |
| `price` | `number` | Yes | The price per share. Must be within ±0.5% of the current market price. |

**Example:**
```json
{
  "symbol": "RELIANCE",
  "quantity": 11,
  "price": 2948
}
```

---

### Response

#### `200 OK`

Returns a confirmation with the sale summary.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Indicates the sell order was executed successfully. |
| `message` | `string` | Human-readable confirmation message including the symbol. |
| `data.symbol` | `string` | The ticker symbol of the asset that was sold. |
| `data.quantitySold` | `integer` | The number of shares sold. |
| `data.proceeds` | `string` | Total amount credited to the cash balance (`quantity × price`). |

**Example:**
```json
{
  "success": true,
  "message": "Successfully sold RELIANCE",
  "data": {
    "symbol": "RELIANCE",
    "quantitySold": 11,
    "proceeds": "32428"
  }
}
```

#### `400 Bad Request`

Returned when the sell cannot be executed due to insufficient holdings or price outside slippage tolerance.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message describing why the order was rejected. |

**Example — Insufficient Holdings:**
```json
{
  "success": false,
  "error": "You do not have enough quantity of this stock to sell."
}
```

**Example — Price Slippage Exceeded:**
```json
{
  "success": false,
  "error": "Order rejected: submitted price deviates more than 0.5% from the current market price"
}
```

#### `404 Not Found`

Returned when the stock symbol does not exist in the system.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message indicating the symbol was not found. |

**Example:**
```json
{
  "success": false,
  "error": "The stock symbol provided does not exist in our market"
}
```

---

# POST /v1/portfolios/{id}/alerts
## Create Price Alert

Creates a price alert for a stock symbol within a given portfolio. A background job polls every 30 seconds and sends a POST request to the configured webhook URL when the condition is met. Each alert fires at most once, then becomes `INACTIVE`.

---

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | The unique identifier of the portfolio to attach the alert to. |

---

### Request Body

Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | `string` | Yes | The stock ticker symbol to watch (e.g., `TCS`). |
| `kind` | `string` | Yes | The direction of the alert. Accepted values: `ABOVE`, `BELOW`. |
| `price` | `number` | Yes | The price threshold that triggers the alert. Must be a positive value. |
| `webhookUrl` | `string` (URL) | Yes | A valid URL that receives a POST payload when the alert fires. |

**Example:**
```json
{
  "symbol": "TCS",
  "kind": "ABOVE",
  "price": 3000.00,
  "webhookUrl": "https://webhook.site/your-unique-id"
}
```

---

### Response

#### `201 Created`

Returns the created alert object.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Indicates the alert was created successfully. |
| `message` | `string` | Human-readable confirmation message. |
| `data.id` | `string` (UUID) | Unique identifier for the alert. |
| `data.symbol` | `string` | The stock ticker being watched. |
| `data.kind` | `string` | The alert direction (`ABOVE` or `BELOW`). |
| `data.price` | `string` | The price threshold that triggers the alert. |
| `data.webhookUrl` | `string` | The URL that receives the webhook payload on firing. |
| `data.status` | `string` | Current status of the alert. Starts as `ACTIVE`, becomes `INACTIVE` after firing. |
| `data.portfolioId` | `string` (UUID) | The portfolio this alert belongs to. |

**Example:**
```json
{
  "success": true,
  "message": "Alert created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "symbol": "TCS",
    "kind": "ABOVE",
    "price": "3000",
    "webhookUrl": "https://webhook.site/your-unique-id",
    "status": "ACTIVE",
    "portfolioId": "74646615-3698-46a7-9625-c1293fdb91e7"
  }
}
```

#### `400 Bad Request`

Returned when the request body fails validation (e.g., invalid `kind`, bad URL, missing fields).

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | A message describing the validation failure. |
| `details` | `array` | List of field-level errors with `path` and `message`. |

**Example:**
```json
{
  "error": "Validation Failed",
  "details": [
    { "path": "kind", "message": "Invalid enum value. Expected 'ABOVE' | 'BELOW'" },
    { "path": "webhookUrl", "message": "webhookUrl must be a valid URL" }
  ]
}
```

#### `404 Not Found`

Returned when the portfolio or stock symbol does not exist.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Always `false` on error. |
| `error` | `string` | A message indicating what was not found. |

**Example — Portfolio not found:**
```json
{
  "success": false,
  "error": "Portfolio not found"
}
```

**Example — Symbol not found:**
```json
{
  "success": false,
  "error": "The stock symbol provided does not exist in our market"
}
```

---

### Webhook Payload

When an alert fires, the following JSON payload is POSTed to the configured `webhookUrl`:

| Field | Type | Description |
|-------|------|-------------|
| `alertId` | `string` (UUID) | The ID of the alert that fired. |
| `portfolioId` | `string` (UUID) | The portfolio the alert belongs to. |
| `symbol` | `string` | The stock ticker that triggered the alert. |
| `kind` | `string` | The alert direction (`ABOVE` or `BELOW`). |
| `alertPrice` | `string` | The threshold price set when the alert was created. |
| `currentMarketPrice` | `string` | The market price at the moment the alert fired. |
| `firedAt` | `string` (ISO 8601) | Timestamp of when the alert was triggered. |

**Example Webhook Payload:**
```json
{
  "alertId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "portfolioId": "74646615-3698-46a7-9625-c1293fdb91e7",
  "symbol": "TCS",
  "kind": "ABOVE",
  "alertPrice": "3000",
  "currentMarketPrice": "3820.15",
  "firedAt": "2026-04-26T12:45:00.000Z"
}
```
