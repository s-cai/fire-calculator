# Shareable URL Encoding/Decoding

## What Gets Encoded

The URL encodes a **complete `FinancialPlan`** object, which contains:

```typescript
{
  baseYear: number,           // Starting year (e.g., 2025)
  components: [                // Array of financial components
    {
      name: string,            // Component name (e.g., "Salary")
      category: 'income' | 'spending' | 'investment',
      series: TimeSeries       // Time-varying value definition
    },
    // ... more components
  ]
}
```

### TimeSeries Types

Each component's `series` can be one of:

1. **Constant**: `{ type: 'constant', value: number }`
2. **Linear Growth**: `{ type: 'linear', startValue: number, yearlyIncrement: number }`
3. **Ratio Growth**: `{ type: 'ratio', startValue: number, yearlyGrowthRate: number }`
4. **Composite**: `{ type: 'composite', segments: [...] }` (multiple phases)

## Encoding Process

### Step 1: Serialize to JSON
```typescript
const json = JSON.stringify(plan);
```

**Example JSON:**
```json
{
  "baseYear": 2025,
  "components": [
    {
      "name": "Salary",
      "category": "income",
      "series": {
        "type": "ratio",
        "startValue": 100000,
        "yearlyGrowthRate": 0.03
      }
    },
    {
      "name": "Rent",
      "category": "spending",
      "series": {
        "type": "constant",
        "value": 24000
      }
    }
  ]
}
```

### Step 2: Compress with lz-string
```typescript
const encoded = compressToEncodedURIComponent(json);
```

**What lz-string does:**
- Uses LZ77 compression algorithm
- Encodes result as URL-safe base64 string
- Reduces size by ~60-80% (typical JSON: 500 chars → compressed: 150-200 chars)
- Only uses URL-safe characters: `A-Za-z0-9+/=-`

**Example compressed string:**
```
N4IgdghgtgpiBcIDGAnApgXyA
```

### Step 3: Add to URL
```typescript
const url = new URL(window.location.href);
url.searchParams.set('plan', encoded);
// Result: https://example.com/?plan=N4IgdghgtgpiBcIDGAnApgXyA
```

## Decoding Process

### Step 1: Extract from URL
```typescript
const urlParams = new URLSearchParams(window.location.search);
const encoded = urlParams.get('plan');
```

### Step 2: Decompress
```typescript
const json = decompressFromEncodedURIComponent(encoded);
```

**What happens:**
- Takes the compressed base64 string
- Decompresses using lz-string's LZ77 algorithm
- Returns the original JSON string

### Step 3: Parse and Validate
```typescript
const data = JSON.parse(json);
const plan = validatePlan(data);
```

**Validation checks:**
- ✅ Valid JSON structure
- ✅ `baseYear` is a number
- ✅ `components` is an array
- ✅ Each component has valid `name`, `category`, `series`
- ✅ Each series has correct type and required fields
- ✅ Categories are valid ('income', 'spending', 'investment')
- ✅ Series types are valid ('constant', 'linear', 'ratio', 'composite')

**If validation fails:** Throws `ValidationError` and returns `null` (gracefully handles invalid URLs)

### Step 4: Convert to UI State
```typescript
const components = urlPlan.components.map(c => convertToUIComponent(c));
stateManager.loadComponents(urlPlan.baseYear, components);
```

**What `convertToUIComponent` does:**
- Converts `FinancialComponent` → `UIComponent`
- Expands composite series into segments/phases
- Sets up default values for UI-specific fields

## Complete Flow Example

### Encoding (When User Clicks "Share")
```
FinancialPlan (in memory)
  ↓ serialize()
JSON string: '{"baseYear":2025,"components":[...]}'
  ↓ compressToEncodedURIComponent()
Compressed: 'N4IgdghgtgpiBcIDGAnApgXyA'
  ↓ URLSearchParams.set('plan', ...)
URL: https://example.com/?plan=N4IgdghgtgpiBcIDGAnApgXyA
  ↓ navigator.clipboard.writeText()
Copied to clipboard ✓
```

### Decoding (When Page Loads with URL)
```
URL: https://example.com/?plan=N4IgdghgtgpiBcIDGAnApgXyA
  ↓ URLSearchParams.get('plan')
Compressed: 'N4IgdghgtgpiBcIDGAnApgXyA'
  ↓ decompressFromEncodedURIComponent()
JSON string: '{"baseYear":2025,"components":[...]}'
  ↓ JSON.parse()
JavaScript object: { baseYear: 2025, components: [...] }
  ↓ validatePlan()
Validated FinancialPlan: { baseYear: 2025, components: [...] }
  ↓ convertToUIComponent() + loadComponents()
UI State restored with all inputs filled in ✓
```

## What's NOT Encoded

The URL only encodes the **financial plan structure**, not:
- ❌ UI state (customized/simple mode, projection visibility)
- ❌ Projection results (computed, not stored)
- ❌ User preferences
- ❌ Staleness flags

These are recreated from the plan when loaded.

## Security & Validation

**Why validation is important:**
- Prevents malicious data injection
- Ensures type safety
- Catches corrupted/invalid URLs gracefully
- Provides clear error messages

**Error handling:**
- Invalid JSON → `ValidationError('invalid JSON')`
- Missing fields → `ValidationError('baseYear must be a number')`
- Invalid types → `ValidationError('unknown series type: xyz')`
- Decompression failure → `ValidationError('failed to decompress URL data')`

All errors are caught and logged, returning `null` instead of crashing.

## Size Considerations

**Typical plan sizes:**
- Simple plan (3-5 components): ~200-300 chars compressed
- Complex plan (10+ components, multiple phases): ~400-600 chars compressed
- Maximum practical size: ~2000 chars (browser URL limits ~2000-8000 chars)

**Compression ratio:** Usually 60-80% reduction from raw JSON.

