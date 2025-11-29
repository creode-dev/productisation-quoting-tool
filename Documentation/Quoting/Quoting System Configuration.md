# Quoting System Configuration

This guide explains how to configure the quoting system using Google Sheets.

## Google Sheet

The quoting tool loads pricing configuration from a Google Sheet. 

**Current Sheet**: [View Google Sheet](https://docs.google.com/spreadsheets/d/1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k/edit)

**Sheet ID**: `1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k`

## Multiple Project Types (Tabs)

The tool supports multiple project types (Web Development, Brand, Campaigns) by using different tabs in your Google Sheet.

### Setting Up Tabs

1. **Create tabs in your Google Sheet**:
   - Tab 1: "Web Development" (or your preferred name)
   - Tab 2: "Brand" (or your preferred name)
   - Tab 3: "Campaign" (or your preferred name)

2. **Find the GID for each tab**:
   - Click on the tab in Google Sheets
   - Look at the URL - it will contain `#gid=XXXXXXX`
   - The number after `gid=` is the GID for that tab
   - Example: `https://docs.google.com/spreadsheets/d/1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k/edit#gid=1234567890`
   - In this case, `1234567890` is the GID

3. **Update the GID mapping**:
   - Open `src/utils/sheetTabs.ts`
   - Update the `PROJECT_TYPE_SHEET_TABS` object with your actual GIDs:
   ```typescript
   export const PROJECT_TYPE_SHEET_TABS: Record<ProjectType, string> = {
     'web-dev': '0',      // First tab (GID 0)
     'brand': '1234567890',    // Your Brand tab GID
     'campaign': '9876543210'  // Your Campaign tab GID
   };
   ```

4. **Each tab should have the same structure**:
   - Same column headers
   - Same format
   - Different data for each project type

### How It Works

- When a user selects "Web Development", the tool loads the first tab (GID 0)
- When a user selects "Brand", the tool loads the Brand tab (using its GID)
- When a user selects "Campaign", the tool loads the Campaign tab (using its GID)
- The pricing config automatically reloads when the project type changes
- **Important**: The pricing configuration will only load after a project type is selected

## Setting Up Your Google Sheet

### 1. Create Your Pricing Sheet

Create a Google Sheet with the following columns:

| Phase | Item | Unit Cost (£) | Essential | Refresh | Transformation | Ranges | Tooltip | Question Type | Options | Min | Max | Required | Validation |
|-------|------|---------------|-----------|---------|----------------|--------|---------|---------------|---------|-----|-----|----------|------------|
| Discovery | Discovery questionnaire | 150 | 1 | 1 | 1 | | Info text | binary | | | | | |
| Discovery | Stakeholder interviews | 500 | 0 | 1 | 1 | 1-2:500, 3-5:450, 6+:400 | Info text | number | | 0 | 10 | | integer |
| UX | Wireframe detail level | 300 | 1 | 1 | 1 | | Info text | select | Basic, Detailed, Full | | | | |
| UX | Project description | 0 | 1 | 1 | 1 | | | text | | | | | |

### Column Descriptions

**Core Columns:**
- **Phase**: The phase name (Discovery, UX, Design, etc.)
- **Item**: The deliverable/item name (must match question labels in questionnaire)
- **Unit Cost (£)**: Base unit cost (used if no ranges specified)
- **Essential**: Quantity included in Essential tier (0 or 1, or number)
- **Refresh**: Quantity included in Refresh tier
- **Transformation**: Quantity included in Transformation tier
- **Ranges** (optional): Range-based pricing format
- **Tooltip** (optional): Information text that appears when hovering over the info icon (ℹ️) next to select question options

**Question Configuration Columns:**
- **Question Type** (optional): Override how the question is displayed
  - `binary` - Checkbox (yes/no)
  - `select` - Radio buttons with options (requires Options column)
  - `number` - Number input field
  - `range` - Number input with min/max range
  - `text` - Free text input
- **Options** (optional): Comma-separated list of option labels for select questions
  - Example: `Basic, Detailed, Full` or `Option 1, Option 2, Option 3`
  - Only used when Question Type is `select`
- **Min** (optional): Minimum value for number/range questions
- **Max** (optional): Maximum value for number/range questions
- **Required** (optional): Whether the question is required (true/false, yes/no, 1/0)
- **Validation** (optional): Additional validation rules
  - `integer` - Only whole numbers allowed
  - `positive` - Only positive numbers
  - `email` - Email format validation
  - Custom validation text can be added here

### 2. Range-Based Pricing Format

For items with quantity-based pricing, use the Ranges column:

**Format**: `min-max:price, min-max:price, min+:price`

**Examples**:
- `1-3:500, 4-6:450, 7+:400` - 1-3 units cost £500 each, 4-6 cost £450 each, 7+ cost £400 each
- `1-5:300, 6+:250` - 1-5 units cost £300 each, 6+ cost £250 each
- `1:500, 2-4:450, 5+:400` - Single unit £500, 2-4 units £450 each, 5+ units £400 each

**Rules**:
- Ranges must be in ascending order
- Use `+` for unlimited upper bound (e.g., `7+`)
- Prices are per unit
- If quantity falls within a range, that range's price is used
- If quantity exceeds all ranges, the highest range price is used

### 3. Make Sheet Public (IMPORTANT)

The sheet must be publicly accessible for the tool to read it. Follow these steps:

**Option A: Share with Link (Recommended)**
1. Open your Google Sheet
2. Click **Share** button (top right)
3. Click **Change to anyone with the link**
4. Set permission to **Viewer** (not Editor)
5. Click **Done**
6. Verify: The link should show "Anyone with the link can view"

**Option B: Publish to Web (Alternative)**
1. Open your Google Sheet
2. Go to **File** > **Share** > **Publish to web**
3. Select the sheet tab you want to publish
4. Choose **Comma-separated values (.csv)** format
5. Click **Publish**
6. Copy the published URL (but you still need the Sheet ID for the tool)

**Troubleshooting:**
- If you get a 400 error, the sheet is likely not public
- Make sure you selected "Anyone with the link" not just "Anyone in your organization"
- Try opening the sheet in an incognito/private browser window to verify it's truly public
- The Sheet ID is the long string in the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 4. Get the Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=0
```

Copy the `{SHEET_ID}` part (the long string between `/d/` and `/edit`)

### 5. Configure the Application

#### Option A: Environment Variable (Recommended)

1. Create a `.env` file in the project root:
```bash
VITE_GOOGLE_SHEET_ID=your-sheet-id-here
```

2. Restart the development server

#### Option B: Update Code Directly

Edit `src/App.tsx` and set the `GOOGLE_SHEET_ID` constant:

```typescript
const GOOGLE_SHEET_ID = 'your-sheet-id-here';
```

## How It Works

1. **On Load**: The app fetches pricing data from your Google Sheet
2. **Pricing Calculation**: 
   - For items with ranges, the tool matches the user's quantity to the correct range
   - For items without ranges, it uses unit cost × quantity
3. **Auto-Refresh**: 
   - The tool automatically refreshes pricing data every 30 seconds
   - You can toggle auto-refresh ON/OFF using the button in the pricing config banner
   - Click "Refresh Now" to manually reload immediately
   - **Adding or removing items** from your spreadsheet will automatically appear in the tool (within 30 seconds, or immediately if you click "Refresh Now")

## Example Sheet Structure

```
Phase,Item,Unit Cost (£),Essential,Refresh,Transformation,Ranges,Tooltip,Question Type,Options,Min,Max,Required,Validation
Discovery,Discovery questionnaire,150,1,1,1,,"Initial questionnaire to understand project requirements",binary,,,,
Discovery,Stakeholder interviews,500,0,1,1,"1-2:500, 3-5:450, 6+:400","One-on-one interviews with key stakeholders",number,,0,10,,integer
Discovery,Customer interviews,600,0,0,1,"1-3:600, 4-6:550, 7+:500","Direct interviews with end users",number,,0,20,,integer
UX,Wireframe detail level,300,1,1,1,,"Level of detail in wireframes",select,"Basic (PDF), Detailed (Figma), Full (Figma + annotations)",,,
UX,User testing sessions,400,0,0,1,"1-3:400, 4-6:350, 7+:300","Usability testing sessions with real users",number,,1,10,,integer
Design,Template designs,400,1,1,1,,"High-fidelity design templates",number,,1,20,,integer
Development,Template implementation,500,1,1,1,,"Coding and development of templates",number,,1,30,,integer
Development,Number of custom blocks,300,0,1,1,"1-5:300, 6-10:280, 11+:250","Custom reusable content blocks",number,,0,50,,integer
UX,Project description,0,1,1,1,,"Brief description of the project",text,,,,
```

### Question Type Examples

**Binary (Checkbox):**
- Question Type: `binary`
- Options: Leave empty
- Min/Max: Not used
- Example: "Discovery questionnaire" - Simple yes/no checkbox

**Select (Radio Buttons):**
- Question Type: `select`
- Options: `Option 1, Option 2, Option 3` (comma-separated)
- Min/Max: Not used
- Example: "Wireframe detail level" with options "Basic, Detailed, Full"

**Number:**
- Question Type: `number`
- Options: Leave empty
- Min: Minimum allowed value (e.g., 0)
- Max: Maximum allowed value (e.g., 10)
- Validation: `integer` for whole numbers only
- Example: "Stakeholder interviews" - Number input with validation

**Range:**
- Question Type: `range`
- Options: Leave empty
- Min: Minimum value (e.g., 0)
- Max: Maximum value (e.g., 100)
- Example: "Number of pages" - Number input with range slider

**Text:**
- Question Type: `text`
- Options: Leave empty
- Min/Max: Not used
- Example: "Project description" - Free text input field

### Tooltip Column

The **Tooltip** column allows you to add descriptive information that appears when users hover over the info icon (ℹ️) next to select question options. This is useful for:

- Explaining what the deliverable includes
- Providing context about the service
- Clarifying scope or details
- Adding any additional information users might need

**Note**: The tooltip text will only appear for **select-type questions** (radio button options). For other question types, you can use the `helpText` field in the questionnaire CSV.

## Troubleshooting

### Sheet not loading?
- Check that the sheet is public (anyone with link can view)
- Verify the Sheet ID is correct
- Check browser console for errors
- Ensure the sheet has the correct column headers

### Prices not updating?
- The tool auto-refreshes every 30 seconds - wait a moment for changes to appear
- Click "Refresh Now" to manually reload immediately
- Toggle "Auto: ON/OFF" to enable/disable automatic refreshing
- Check that your sheet has the correct format
- Verify item names match exactly (case-sensitive)

### Range pricing not working?
- Check range format is correct
- Ensure ranges are in ascending order
- Verify no spaces in range definitions (except after commas)

