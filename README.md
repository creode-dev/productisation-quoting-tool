# Quoting Tool

A web-based quoting tool for agency services (Web Development, Brand, Campaigns) that generates itemized quotes from a productisation questionnaire.

## Features

- Multi-stage form with phase selection
- Dynamic question rendering based on CSV data
- Itemized pricing calculation
- Quote generation in multiple formats (Web view, PDF, Email)
- Progress tracking and form persistence
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── QuoteForm.tsx   # Main form component
│   ├── QuestionRenderer.tsx
│   ├── PhaseSelector.tsx
│   ├── PhaseNavigation.tsx
│   ├── QuoteView.tsx
│   └── PricingBreakdown.tsx
├── utils/              # Utility functions
│   ├── csvParser.ts    # CSV parsing logic
│   ├── questionTypes.ts
│   ├── pricingCalculator.ts
│   ├── quoteBuilder.ts
│   ├── pdfGenerator.ts
│   └── emailService.ts
├── store/              # State management
│   └── quoteStore.ts   # Zustand store
├── types/              # TypeScript types
│   └── quote.ts
└── App.tsx             # Main app component
```

## Usage

1. **Select Project Type**: Choose between Web Development, Brand, or Campaign
2. **Select Phases**: Choose which phases to include (Discovery is always required)
3. **Answer Questions**: Fill out questions for each selected phase
4. **View Quote**: Click "View Quote" to see the generated quote
5. **Export**: Export as PDF or send via email

## Data Format

The tool reads from `public/Productisation questionnare.csv`. The CSV should have the following structure:

- First row: Headers (OUTPUT, ESSENTIAL, REFRESH, TRANSFORMATION)
- Phase headers: `PHASE X: NAME`
- Question rows: Deliverable name and values for each tier
- Values can be: ✅/❌, numbers, ranges, or text descriptions

## Customization

### Pricing

Edit `src/utils/pricingCalculator.ts` to adjust:
- Base tier prices
- Pricing multipliers for different question types
- Ongoing costs

### Question Types

The tool automatically detects question types from CSV values:
- **Binary**: ✅/❌
- **Number**: Single numeric values
- **Range**: Ranges like "1-2" or "Up to 12"
- **Select**: Different text options per tier
- **Text**: Free text input

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- jsPDF (PDF generation)
- PapaParse (CSV parsing)

## License

MIT

