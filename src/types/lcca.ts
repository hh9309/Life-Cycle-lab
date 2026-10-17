export interface StageCost {
  id: 'planning' | 'design' | 'capex' | 'opex' | 'maint' | 'decom';
  name: string;
  nameEn: string;
  directCost: number; // in 万元 (10k CNY)
  indirectCost: number;
  description: string;
  startYear: number;
  endYear: number;
  annualGrowthRate?: number; // annual inflation or cost escalation e.g. 0.02
}

export interface LccaProject {
  id: string;
  name: string;
  category: string;
  industry: string;
  description: string;
  iconName: string;
  // Core financial parameters
  lifetime: number; // in years (e.g. 20, 30, 60, 100)
  discountRate: number; // nominal discount rate, e.g. 0.06 (6%)
  inflationRate: number; // inflation rate, e.g. 0.02 (2%)
  salvageValue: number; // in 万元
  
  // 6 Stages
  stages: {
    planning: StageCost;
    design: StageCost;
    capex: StageCost;
    opex: StageCost;
    maint: StageCost;
    decom: StageCost;
  };

  // Specific domain highlights for the case study
  domainParams?: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  caseInsights?: {
    capexOpexTradeoff: string;
    discountSensitivityComment: string;
    hiddenTrapWarning: string;
    decisionRecommendation: string;
  };
}

export interface AnnualCashFlow {
  year: number;
  planning: number;
  design: number;
  capex: number;
  opex: number;
  maint: number;
  decom: number;
  salvage: number;
  totalNominal: number;
  discountFactor: number;
  discountedCashFlow: number;
  cumulativeLccPv: number;
}

export interface LccaSummary {
  nominalTotalLcc: number;
  lccPv: number; // Discounted Net Present Value of LCC
  eac: number; // Equivalent Annual Cost
  crf: number; // Capital Recovery Factor
  pvCapexTotal: number;
  pvOpexTotal: number;
  pvMaintTotal: number;
  pvDecomTotal: number;
  pvSalvageTotal: number;
  realDiscountRate: number; // Fisher equation
  waterSurfaceCapexShare: number; // Percentage on iceberg
  underwaterOpexShare: number; // Percentage under iceberg
}

export interface TornadoVariable {
  id: string;
  name: string;
  unit: string;
  baseVal: number;
  lowVal: number;
  highVal: number;
  lowLcc: number;
  highLcc: number;
  swing: number; // Math.abs(highLcc - lowLcc)
}

export interface SensitivityCurvePoint {
  rate: number;
  lccPv: number;
  eac: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  project: LccaProject;
  color: string;
  createdAt: number;
}

export interface ScenarioComparisonSlot {
  scenario: SavedScenario;
  cashFlows: AnnualCashFlow[];
  summary: LccaSummary;
}
