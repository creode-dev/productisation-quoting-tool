# Quoting Tool User Guide

This guide will help you use the Quoting Tool to create professional quotes for your clients.

## Overview

The Quoting Tool allows you to create itemized quotes for different project types (Web Development, Brand, Campaigns) by answering a series of questions. The tool automatically calculates pricing based on your selections and generates a professional quote that can be viewed, exported as PDF, or sent via email.

## Getting Started

### Accessing the Tool

1. Log in to the application using your `@creode.co.uk` email address
2. You'll be automatically redirected to the quoting tool
3. If you need to access it later, click "Quotes" in the sidebar and then "Create New Quote"

## Creating a Quote

### Step 1: Select Project Type

When you first open the quoting tool, you'll see three project type options:

- **Web Development** - For website design and development services
- **Brand** - For brand identity and guidelines
- **Campaign** - For marketing campaigns and strategies

Click on the project type that matches your client's needs. This will load the appropriate pricing configuration and questions.

### Step 2: Enter Company and Project Information

After selecting a project type, you'll be asked to provide:

- **Company** (required) - Start typing the company name. If the company exists in Xero, you'll see autocomplete suggestions. You can select from the list or type a new company name.
- **Project Name** (required) - Enter a descriptive name for the project
- **Business Unit** (optional) - Specify which business unit this quote is for
- **Target Completion Date** (optional) - Select when you expect to complete the project

Click "Continue" when you've filled in the required information.

### Step 3: Select Phases

You'll see a list of available phases for the selected project type. Common phases include:

- **Discovery** - Always required, includes initial research and planning
- **UX** - User experience design
- **Design** - Visual design work
- **Development** - Technical implementation
- And more depending on the project type

- Check or uncheck phases to include or exclude them from the quote
- Discovery phase is always included and cannot be deselected
- You can change your phase selections at any time before viewing the quote

### Step 4: Select Pricing Tier (Optional)

You can choose a pricing tier to automatically populate common values:

- **Essential** - Basic tier with standard quantities
- **Refresh** - Mid-tier with enhanced quantities
- **Transformation** - Premium tier with maximum quantities

Selecting a tier will automatically fill in default values for many questions. You can still adjust individual answers after selecting a tier.

### Step 5: Answer Questions

Navigate through each selected phase and answer the questions:

- Use the phase navigation at the top to jump between phases
- Or use the "Previous" and "Next" buttons to move sequentially
- Questions may include:
  - **Checkboxes** - Simple yes/no questions
  - **Radio buttons** - Select one option from a list
  - **Number inputs** - Enter quantities or amounts
  - **Text fields** - Free-form text input
  - **Range sliders** - Select a value within a range

#### Tips for Answering Questions

- Hover over the info icon (ℹ️) next to select options to see detailed descriptions
- Required questions are marked with a red asterisk (*)
- Some number inputs have minimum and maximum values
- Your answers are automatically saved as you progress

### Step 6: Review and View Quote

Once you've answered all questions:

1. Click "View Quote" to see the generated quote
2. Review the itemized breakdown showing:
   - Each phase with its items
   - Quantities and unit costs
   - Subtotal for each phase
   - **Grand total** at the bottom

### Step 7: Save, Export, or Send Quote

From the quote view, you can:

- **Save Quote** - Save the quote to your quotes list for later access
- **Export PDF** - Download the quote as a PDF file
- **Send Email** - Email the quote directly to a client
- **Edit** - Go back to modify your answers
- **Start Over** - Clear everything and create a new quote

## Managing Saved Quotes

### Viewing All Quotes

1. Click "Quotes" in the sidebar
2. You'll see a list of all your saved quotes
3. Use the search bar to find quotes by company or project name
4. Filter by status: Draft, Sent, Accepted, or Rejected

### Viewing a Saved Quote

1. Click on any quote in the list to view it
2. You can see all quote details, pricing breakdown, and status
3. From here you can:
   - Export as PDF
   - Send via email
   - Accept the quote (if it's in "Sent" status)
   - Delete the quote

### Quote Statuses

- **Draft** - Quote has been created but not sent
- **Sent** - Quote has been sent to the client
- **Accepted** - Client has accepted the quote
- **Rejected** - Client has rejected the quote

## Features

### Pricing Configuration

- Pricing is automatically loaded from a Google Sheet
- The tool refreshes pricing data every 30 seconds
- You can manually refresh by clicking "Refresh Now"
- Toggle "Auto: ON/OFF" to enable/disable automatic refreshing

### Shared Variables

Some questions may use shared variables that affect multiple items. For example, "Number of pages" might be used to calculate costs for multiple deliverables.

### Range-Based Pricing

Some items use quantity-based pricing where the unit cost decreases as quantity increases. The tool automatically selects the correct price tier based on your quantity input.

### Form Persistence

Your progress is automatically saved as you work. If you navigate away and come back, your answers will be preserved.

## Tips and Best Practices

1. **Start with Project Type** - Always select the project type first, as this determines which questions and pricing you'll see

2. **Use Company Autocomplete** - If the company exists in Xero, selecting it from autocomplete will link the quote to the correct company record

3. **Review Phase Selections** - Make sure you've selected all relevant phases before answering questions

4. **Use Pricing Tiers** - If you're creating a standard quote, selecting a pricing tier can save time by pre-filling common values

5. **Check Totals** - Always review the quote total before sending to ensure it matches your expectations

6. **Save Drafts** - Save quotes as drafts if you need to review them before sending

7. **Export PDFs** - Export quotes as PDFs for offline access or to attach to emails manually

## Troubleshooting

### Questions Not Loading

- Make sure you've selected a project type first
- Check that the pricing configuration has loaded (look for the pricing config banner at the top)
- Try refreshing the page

### Prices Not Updating

- The tool auto-refreshes every 30 seconds
- Click "Refresh Now" to manually reload pricing
- Check that the pricing configuration Google Sheet is accessible

### Company Autocomplete Not Working

- Verify that Xero API is configured correctly
- Try typing the full company name if autocomplete doesn't appear
- You can always type a company name manually

### Can't View Quote

- Make sure you've answered all required questions
- Check that at least one phase is selected
- Ensure company name and project name are filled in

## Need Help?

If you encounter issues or have questions:

1. Check the [Quoting System Configuration](../Settings/Quoting%20System%20Configuration.md) guide for technical details
2. Contact your system administrator
3. Review the pricing configuration Google Sheet to understand available options




