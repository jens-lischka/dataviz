/**
 * Sample Datasets
 *
 * Built-in example datasets for testing and demonstration.
 * Each dataset covers a different chart type pattern.
 */

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  suggestedChart: string; // chart ID
  csv: string;
}

export const sampleDatasets: SampleDataset[] = [
  {
    id: "revenue-by-region",
    name: "Revenue by Region",
    description: "Quarterly revenue across business regions — ideal for column or bar charts",
    suggestedChart: "column-chart",
    csv: `Region,Q1,Q2,Q3,Q4
Americas,4200,4800,5100,5500
Europe,3100,3400,3200,3800
Asia Pacific,2800,3200,3600,4100
Middle East & Africa,1200,1400,1300,1600
Latin America,900,1100,1000,1200`,
  },
  {
    id: "market-share",
    name: "Market Share 2024",
    description: "Competitor market share — ideal for pie or donut charts",
    suggestedChart: "pie-chart",
    csv: `Company,Market Share
Company A,32.5
Company B,24.1
Company C,18.7
Company D,12.3
Company E,7.8
Others,4.6`,
  },
  {
    id: "monthly-performance",
    name: "Monthly Performance",
    description: "12-month KPI trend — ideal for line or area charts",
    suggestedChart: "line-chart",
    csv: `Month,Revenue,Costs,Profit
Jan,820,650,170
Feb,890,680,210
Mar,950,700,250
Apr,1020,720,300
May,980,710,270
Jun,1100,740,360
Jul,1050,730,320
Aug,1150,760,390
Sep,1200,780,420
Oct,1280,800,480
Nov,1350,830,520
Dec,1400,850,550`,
  },
  {
    id: "ebit-bridge",
    name: "EBIT Bridge",
    description: "Year-over-year EBIT waterfall — ideal for waterfall charts",
    suggestedChart: "waterfall",
    csv: `Category,Value,Type
EBIT 2023,450,total
Revenue Growth,120,increase
Price Increases,85,increase
Cost Inflation,-95,decrease
Supply Chain,-40,decrease
FX Impact,-25,decrease
Restructuring,-30,decrease
Acquisitions,60,increase
EBIT 2024,525,total`,
  },
  {
    id: "product-segment-matrix",
    name: "Product Segment Matrix",
    description: "Satisfaction scores across products and segments — ideal for heatmaps",
    suggestedChart: "heatmap",
    csv: `Product,Enterprise,Mid-Market,SMB,Consumer
Platform A,4.2,3.8,3.5,3.1
Platform B,3.9,4.1,3.7,3.3
Platform C,3.5,3.6,4.0,4.2
Platform D,4.5,4.3,3.9,3.0
Platform E,3.8,3.7,3.8,3.9`,
  },
];
