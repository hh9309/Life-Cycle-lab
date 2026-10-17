import { LccaProject, AnnualCashFlow, LccaSummary, TornadoVariable, SensitivityCurvePoint } from '../types/lcca';

/**
 * Calculates Capital Recovery Factor:
 * CRF(r, T) = [ r * (1 + r)^T ] / [ (1 + r)^T - 1 ]
 * Special case: when r = 0, CRF = 1 / T
 */
export function calculateCrf(rate: number, lifetime: number): number {
  if (lifetime <= 0) return 1;
  if (Math.abs(rate) <= 0.000001) return 1 / lifetime;
  const factor = Math.pow(1 + rate, lifetime);
  if (!isFinite(factor) || Math.abs(factor - 1) < 0.000001) {
    return 1 / lifetime;
  }
  return (rate * factor) / (factor - 1);
}

/**
 * Calculates annual cash flows across all 6 lifecycle stages.
 */
export function calculateAnnualCashFlows(project: LccaProject): AnnualCashFlow[] {
  const { lifetime, discountRate, stages, salvageValue } = project;
  const rows: AnnualCashFlow[] = [];
  let cumulativePv = 0;

  // Compute duration in years for initial lump-sum stages to ensure exact total nominal allocation
  const pYears = Math.max(1, stages.planning.endYear - stages.planning.startYear);
  const dYears = Math.max(1, stages.design.endYear - stages.design.startYear);
  const cYears = Math.max(1, stages.capex.endYear - stages.capex.startYear);

  for (let year = 0; year <= lifetime; year++) {
    let planning = 0;
    let design = 0;
    let capex = 0;
    let opex = 0;
    let maint = 0;
    let decom = 0;
    let salvage = 0;

    // Stage 1: Planning
    if (year >= stages.planning.startYear && year < stages.planning.startYear + pYears && year <= lifetime) {
      planning = (stages.planning.directCost + stages.planning.indirectCost) / pYears;
    }

    // Stage 2: Design
    if (year >= stages.design.startYear && year < stages.design.startYear + dYears && year <= lifetime) {
      design = (stages.design.directCost + stages.design.indirectCost) / dYears;
    }

    // Stage 3: Construction / CAPEX
    if (year >= stages.capex.startYear && year < stages.capex.startYear + cYears && year <= lifetime) {
      capex = (stages.capex.directCost + stages.capex.indirectCost) / cYears;
    }

    // Stage 4: Operation / OPEX (annual routine operational costs with escalation)
    if (year >= stages.opex.startYear && year <= Math.min(lifetime, stages.opex.endYear)) {
      const yearsFromStart = year - stages.opex.startYear;
      const escalation = Math.pow(1 + (stages.opex.annualGrowthRate || 0), yearsFromStart);
      opex = (stages.opex.directCost + stages.opex.indirectCost) * escalation;
    }

    // Stage 5: Maintenance & Overhauls (MAINT)
    if (year >= stages.maint.startYear && year <= Math.min(lifetime, stages.maint.endYear)) {
      const yearsFromStart = year - stages.maint.startYear;
      const escalation = Math.pow(1 + (stages.maint.annualGrowthRate || 0), yearsFromStart);
      maint = (stages.maint.directCost + stages.maint.indirectCost) * escalation;
    }

    // Stage 6: Decommissioning (occurs at project retirement)
    if (year === stages.decom.startYear || (year === lifetime && stages.decom.startYear >= lifetime)) {
      decom = stages.decom.directCost + stages.decom.indirectCost;
    }

    // Salvage value at end of life (treated as negative cost / cash inflow)
    if (year === lifetime && salvageValue > 0) {
      salvage = salvageValue;
    }

    // Net Nominal Cost for this year (Costs minus Salvage)
    const totalNominal = planning + design + capex + opex + maint + decom - salvage;
    const discountFactor = Math.pow(1 + discountRate, -year);
    const discountedCashFlow = totalNominal * discountFactor;
    cumulativePv += discountedCashFlow;

    rows.push({
      year,
      planning,
      design,
      capex,
      opex,
      maint,
      decom,
      salvage,
      totalNominal,
      discountFactor,
      discountedCashFlow,
      cumulativeLccPv: cumulativePv,
    });
  }

  return rows;
}

/**
 * Calculates high-level LCCA summary metrics.
 */
export function calculateLccaSummary(project: LccaProject, cashFlows: AnnualCashFlow[]): LccaSummary {
  const { lifetime, discountRate, inflationRate } = project;
  const lccPv = cashFlows[cashFlows.length - 1].cumulativeLccPv;
  const crf = calculateCrf(discountRate, lifetime);
  const eac = lccPv * crf;

  let nominalTotalLcc = 0;
  let pvCapexTotal = 0;
  let pvOpexTotal = 0;
  let pvMaintTotal = 0;
  let pvDecomTotal = 0;
  let pvSalvageTotal = 0;

  for (const row of cashFlows) {
    nominalTotalLcc += row.totalNominal;
    pvCapexTotal += (row.planning + row.design + row.capex) * row.discountFactor;
    pvOpexTotal += row.opex * row.discountFactor;
    pvMaintTotal += row.maint * row.discountFactor;
    pvDecomTotal += row.decom * row.discountFactor;
    pvSalvageTotal += row.salvage * row.discountFactor;
  }

  // Fisher Equation for Real Discount Rate:
  // (1 + r_nom) = (1 + r_real) * (1 + i) => r_real = (1 + r_nom) / (1 + i) - 1
  const realDiscountRate = (1 + discountRate) / (1 + inflationRate) - 1;

  // Iceberg analysis:
  // Water surface: Initial investment (Planning + Design + CAPEX)
  // Underwater: Operation (OPEX) + Maintenance (MAINT) + Decommissioning (DEC) - Salvage
  const waterSurfaceTotal = pvCapexTotal;
  const underwaterTotal = Math.max(0, pvOpexTotal + pvMaintTotal + pvDecomTotal - pvSalvageTotal);
  const combinedTotal = waterSurfaceTotal + underwaterTotal;

  const waterSurfaceCapexShare = combinedTotal > 0 ? (waterSurfaceTotal / combinedTotal) * 100 : 50;
  const underwaterOpexShare = combinedTotal > 0 ? (underwaterTotal / combinedTotal) * 100 : 50;

  return {
    nominalTotalLcc,
    lccPv,
    eac,
    crf,
    pvCapexTotal,
    pvOpexTotal,
    pvMaintTotal,
    pvDecomTotal,
    pvSalvageTotal,
    realDiscountRate,
    waterSurfaceCapexShare,
    underwaterOpexShare,
  };
}

/**
 * Computes a clone project with modified parameters for sensitivity testing
 */
function computeModifiedLcc(baseProject: LccaProject, modifier: (p: LccaProject) => void): number {
  const cloned: LccaProject = JSON.parse(JSON.stringify(baseProject));
  modifier(cloned);
  const flows = calculateAnnualCashFlows(cloned);
  return flows[flows.length - 1].cumulativeLccPv;
}

/**
 * Computes Tornado Chart variables sorted by swing (impact on LCC PV) descending.
 */
export function calculateTornadoVariables(project: LccaProject): TornadoVariable[] {
  const vars: TornadoVariable[] = [];

  // 1. Discount Rate r (±30%)
  {
    const baseVal = project.discountRate;
    const lowVal = Math.max(0.01, baseVal * 0.7);
    const highVal = baseVal * 1.3;
    // Higher discount rate lowers PV of future costs
    const lccAtLow = computeModifiedLcc(project, p => { p.discountRate = lowVal; });
    const lccAtHigh = computeModifiedLcc(project, p => { p.discountRate = highVal; });
    vars.push({
      id: 'discountRate',
      name: '基准折现率 (r)',
      unit: '%',
      baseVal: baseVal * 100,
      lowVal: lowVal * 100,
      highVal: highVal * 100,
      lowLcc: lccAtHigh, // higher rate leads to lower PV
      highLcc: lccAtLow,
      swing: Math.abs(lccAtHigh - lccAtLow),
    });
  }

  // 2. Annual OPEX (Energy/Power/Electricity ±30%)
  {
    const baseVal = project.stages.opex.directCost;
    const lowVal = baseVal * 0.7;
    const highVal = baseVal * 1.3;
    const lccAtLow = computeModifiedLcc(project, p => { p.stages.opex.directCost = lowVal; });
    const lccAtHigh = computeModifiedLcc(project, p => { p.stages.opex.directCost = highVal; });
    vars.push({
      id: 'opex',
      name: '年度日常运营能耗费 (OPEX)',
      unit: '万元/年',
      baseVal,
      lowVal,
      highVal,
      lowLcc: lccAtLow,
      highLcc: lccAtHigh,
      swing: Math.abs(lccAtHigh - lccAtLow),
    });
  }

  // 3. Annual MAINT (Maintenance & Overhaul ±30%)
  {
    const baseVal = project.stages.maint.directCost;
    const lowVal = baseVal * 0.7;
    const highVal = baseVal * 1.3;
    const lccAtLow = computeModifiedLcc(project, p => { p.stages.maint.directCost = lowVal; });
    const lccAtHigh = computeModifiedLcc(project, p => { p.stages.maint.directCost = highVal; });
    vars.push({
      id: 'maint',
      name: '定期维护与大修费用 (MAINT)',
      unit: '万元/年',
      baseVal,
      lowVal,
      highVal,
      lowLcc: lccAtLow,
      highLcc: lccAtHigh,
      swing: Math.abs(lccAtHigh - lccAtLow),
    });
  }

  // 4. Initial CAPEX (Construction cost ±25%)
  {
    const baseVal = project.stages.capex.directCost;
    const lowVal = baseVal * 0.75;
    const highVal = baseVal * 1.25;
    const lccAtLow = computeModifiedLcc(project, p => { p.stages.capex.directCost = lowVal; });
    const lccAtHigh = computeModifiedLcc(project, p => { p.stages.capex.directCost = highVal; });
    vars.push({
      id: 'capex',
      name: '施工建设初始投资 (CAPEX)',
      unit: '万元',
      baseVal,
      lowVal,
      highVal,
      lowLcc: lccAtLow,
      highLcc: lccAtHigh,
      swing: Math.abs(lccAtHigh - lccAtLow),
    });
  }

  // 5. Operating Lifetime T (±25%)
  {
    const baseVal = project.lifetime;
    const lowVal = Math.max(3, Math.round(baseVal * 0.75));
    const highVal = Math.round(baseVal * 1.25);
    const lccAtLow = computeModifiedLcc(project, p => {
      p.lifetime = lowVal;
      p.stages.opex.endYear = lowVal;
      p.stages.maint.endYear = lowVal;
      p.stages.decom.startYear = lowVal;
      p.stages.decom.endYear = lowVal;
    });
    const lccAtHigh = computeModifiedLcc(project, p => {
      p.lifetime = highVal;
      p.stages.opex.endYear = highVal;
      p.stages.maint.endYear = highVal;
      p.stages.decom.startYear = highVal;
      p.stages.decom.endYear = highVal;
    });
    vars.push({
      id: 'lifetime',
      name: '系统服役使用寿命 (T)',
      unit: '年',
      baseVal,
      lowVal,
      highVal,
      lowLcc: lccAtLow,
      highLcc: lccAtHigh,
      swing: Math.abs(lccAtHigh - lccAtLow),
    });
  }

  // Sort descending by swing to create the signature Tornado shape
  return vars.sort((a, b) => b.swing - a.swing);
}

/**
 * Generates continuous discount rate sensitivity curve (0% to 15%).
 */
export function generateDiscountSensitivityCurve(project: LccaProject): SensitivityCurvePoint[] {
  const points: SensitivityCurvePoint[] = [];
  const rates = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.12, 0.14];
  
  for (const rate of rates) {
    const lccPv = computeModifiedLcc(project, p => { p.discountRate = rate; });
    const crf = calculateCrf(rate, project.lifetime);
    const eac = lccPv * crf;
    points.push({ rate, lccPv, eac });
  }

  return points;
}

/**
 * Formats financial values into concise readable Chinese units (万元 or 亿元).
 */
export function formatCurrency(wanYuan: number, decimals = 2): string {
  const abs = Math.abs(wanYuan);
  if (abs >= 10000) {
    const yi = wanYuan / 10000;
    return `¥${yi.toFixed(decimals)} 亿元`;
  }
  return `¥${wanYuan.toFixed(decimals)} 万元`;
}

/**
 * Formats percentage
 */
export function formatPercent(rate: number, decimals = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}
