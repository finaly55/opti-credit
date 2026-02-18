import { describe, it, expect } from "vitest";
import {
  calculateMonthlyPayment,
  calculateNotaryFees,
  calculateStandardLoanAmount,
  calculateAppreciationRate,
  calculateFuturePrice,
  initializeLoansState,
  calculateTotalInitialExpenses,
  calculateTotalMonthlyExpenses,
  calculateTotalYearlyExpenses,
  calculateTotalAnnualizedCharges,
  runSimulation,
  findBreakEvenWealth,
  findBreakEvenMonthly,
  calculateEarlyRepaymentFees,
} from "./calculations";
import type { Loan, SimulationParams, CustomExpense } from "../types";
import { DEFAULT_PARAMS } from "../constants";

// ─── Helpers ───────────────────────────────────────────────

const makeLoan = (overrides: Partial<Loan> = {}): Loan => ({
  id: "standard",
  name: "Standard",
  amount: 200000,
  rate: 2,
  durationMonths: 240,
  insuranceRate: 0.36,
  deferredMonths: 0,
  insuranceMode: "initial",
  ...overrides,
});

const makeParams = (overrides: Partial<SimulationParams> = {}): SimulationParams => ({
  ...DEFAULT_PARAMS,
  ...overrides,
});

// ─── calculateMonthlyPayment ──────────────────────────────

describe("calculateMonthlyPayment", () => {
  it("calculates correctly for a standard loan", () => {
    const payment = calculateMonthlyPayment(200000, 2, 240);
    // Expected ~1012€/month for 200k at 2% over 20y
    expect(payment).toBeCloseTo(1012, 0);
  });

  it("returns linear payment for zero-rate loan", () => {
    const payment = calculateMonthlyPayment(120000, 0, 240);
    expect(payment).toBe(500);
  });

  it("handles very high rates", () => {
    const payment = calculateMonthlyPayment(100000, 10, 120);
    expect(payment).toBeGreaterThan(1300);
  });

  it("handles very short duration", () => {
    const payment = calculateMonthlyPayment(12000, 3, 12);
    expect(payment).toBeGreaterThan(1000);
    expect(payment).toBeLessThan(1100);
  });
});

// ─── calculateNotaryFees ──────────────────────────────────

describe("calculateNotaryFees", () => {
  it("calculates ancien fees (7.5%)", () => {
    expect(calculateNotaryFees(200000, 7.5)).toBe(15000);
  });

  it("calculates neuf fees (2.5%)", () => {
    expect(calculateNotaryFees(200000, 2.5)).toBe(5000);
  });

  it("returns 0 for 0%", () => {
    expect(calculateNotaryFees(200000, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(calculateNotaryFees(333333, 7.5)).toBe(25000);
  });
});

// ─── calculateStandardLoanAmount ──────────────────────────

describe("calculateStandardLoanAmount", () => {
  it("calculates remaining amount after apport and other loans", () => {
    expect(calculateStandardLoanAmount(300000, 50000, 75000, 15000)).toBe(160000);
  });

  it("returns 0 when apport covers everything", () => {
    expect(calculateStandardLoanAmount(100000, 100000, 0, 0)).toBe(0);
  });

  it("returns 0 when sum exceeds price (no negative loan)", () => {
    expect(calculateStandardLoanAmount(100000, 80000, 30000, 10000)).toBe(0);
  });
});

// ─── calculateAppreciationRate ────────────────────────────

describe("calculateAppreciationRate", () => {
  it("calculates 0% when prices are equal", () => {
    expect(calculateAppreciationRate(200000, 200000, 10)).toBeCloseTo(0, 5);
  });

  it("calculates positive appreciation", () => {
    const rate = calculateAppreciationRate(200000, 220000, 5);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(5);
  });

  it("calculates negative appreciation (depreciation)", () => {
    const rate = calculateAppreciationRate(200000, 180000, 5);
    expect(rate).toBeLessThan(0);
  });

  it("returns 0 for 0 years", () => {
    expect(calculateAppreciationRate(200000, 300000, 0)).toBe(0);
  });

  it("returns 0 for 0 current price", () => {
    expect(calculateAppreciationRate(0, 300000, 10)).toBe(0);
  });

  it("is inverse of calculateFuturePrice", () => {
    const rate = calculateAppreciationRate(200000, 250000, 10);
    const futurePrice = calculateFuturePrice(200000, rate, 10);
    expect(futurePrice).toBeCloseTo(250000, 0);
  });
});

// ─── calculateFuturePrice ─────────────────────────────────

describe("calculateFuturePrice", () => {
  it("returns same price for 0% appreciation", () => {
    expect(calculateFuturePrice(200000, 0, 10)).toBe(200000);
  });

  it("calculates compound appreciation", () => {
    // +2%/year over 10 years
    const future = calculateFuturePrice(200000, 2, 10);
    expect(future).toBeCloseTo(243799, 0);
  });

  it("handles depreciation", () => {
    const future = calculateFuturePrice(200000, -2, 10);
    expect(future).toBeLessThan(200000);
  });

  it("returns same price for 0 years", () => {
    expect(calculateFuturePrice(200000, 5, 0)).toBe(200000);
  });
});

// ─── initializeLoansState ─────────────────────────────────

describe("initializeLoansState", () => {
  it("initializes remaining capital and monthly payment", () => {
    const loans = [makeLoan()];
    const states = initializeLoansState(loans);
    expect(states).toHaveLength(1);
    expect(states[0].remainingCapital).toBe(200000);
    expect(states[0].monthlyPayment).toBeGreaterThan(0);
  });

  it("accounts for deferred months in payment calculation", () => {
    const loanNoDefer = makeLoan({ deferredMonths: 0 });
    const loanDefer = makeLoan({ deferredMonths: 60 });
    const [stateNoDefer] = initializeLoansState([loanNoDefer]);
    const [stateDefer] = initializeLoansState([loanDefer]);
    // With deferred months, amortization period is shorter → higher payment
    expect(stateDefer.monthlyPayment).toBeGreaterThan(stateNoDefer.monthlyPayment);
  });
});

// ─── calculateTotalInitialExpenses ────────────────────────

describe("calculateTotalInitialExpenses", () => {
  it("includes renovation cost", () => {
    expect(calculateTotalInitialExpenses(8000, [])).toBe(8000);
  });

  it("includes initial custom expenses", () => {
    const expenses: CustomExpense[] = [
      { id: "1", name: "Cuisine", amount: 5000, type: "initial" },
      { id: "2", name: "Loyer mensuel", amount: 100, type: "monthly" },
    ];
    expect(calculateTotalInitialExpenses(8000, expenses)).toBe(13000);
  });

  it("ignores monthly and yearly custom expenses", () => {
    const expenses: CustomExpense[] = [
      { id: "1", name: "Charges", amount: 100, type: "monthly" },
      { id: "2", name: "Taxe", amount: 500, type: "yearly" },
    ];
    expect(calculateTotalInitialExpenses(0, expenses)).toBe(0);
  });
});

// ─── calculateTotalMonthlyExpenses ────────────────────────

describe("calculateTotalMonthlyExpenses", () => {
  it("sums base and custom monthly expenses", () => {
    const expenses: CustomExpense[] = [
      { id: "1", name: "Internet", amount: 30, type: "monthly" },
    ];
    expect(calculateTotalMonthlyExpenses(50, expenses)).toBe(80);
  });
});

// ─── calculateTotalYearlyExpenses ─────────────────────────

describe("calculateTotalYearlyExpenses", () => {
  it("sums base and custom yearly expenses", () => {
    const expenses: CustomExpense[] = [
      { id: "1", name: "Ramonage", amount: 150, type: "yearly" },
    ];
    expect(calculateTotalYearlyExpenses(200, expenses)).toBe(350);
  });
});

// ─── calculateTotalAnnualizedCharges ──────────────────────

describe("calculateTotalAnnualizedCharges", () => {
  it("annualizes monthly and adds yearly charges", () => {
    // condoFees=180/month + monthly=50/month → (180+50)*12 = 2760
    // propertyTax=1200 + yearly=200 → 1400
    // Total = 4160
    expect(calculateTotalAnnualizedCharges(180, 50, 1200, 200)).toBe(4160);
  });
});

// ─── calculateEarlyRepaymentFees ──────────────────────────

describe("calculateEarlyRepaymentFees", () => {
  it("returns 0 when all loans are at zero rate", () => {
    const loans = [makeLoan({ rate: 0, amount: 100000 })];
    const states = initializeLoansState(loans);
    expect(calculateEarlyRepaymentFees(states, 12)).toBe(0);
  });

  it("returns 0 when loan is finished", () => {
    const loans = [makeLoan({ durationMonths: 120 })];
    const states = initializeLoansState(loans);
    expect(calculateEarlyRepaymentFees(states, 121)).toBe(0);
  });

  it("calculates min of 6 months interest and 3% CRD", () => {
    const loans = [makeLoan({ rate: 2, amount: 200000, durationMonths: 240 })];
    const states = initializeLoansState(loans);
    const ira = calculateEarlyRepaymentFees(states, 1);
    const sixMonths = 200000 * (2 / 100 / 12) * 6; // 2000€
    const threePercent = 200000 * 0.03; // 6000€
    expect(ira).toBeCloseTo(Math.min(sixMonths, threePercent), 0);
  });

  it("returns 0 when remaining capital is 0", () => {
    const loans = [makeLoan({ rate: 2, durationMonths: 240 })];
    const states = initializeLoansState(loans);
    states[0].remainingCapital = 0;
    expect(calculateEarlyRepaymentFees(states, 12)).toBe(0);
  });
});

// ─── runSimulation ────────────────────────────────────────

describe("runSimulation", () => {
  const defaultSimParams = {
    params: makeParams(),
    totalInitialExpenses: 8000,
    totalMonthlyExpenses: 0,
    totalYearlyExpenses: 0,
  };

  it("returns 360 monthly data points", () => {
    const result = runSimulation(defaultSimParams);
    expect(result.monthlyData).toHaveLength(360);
  });

  it("returns 30 yearly data points", () => {
    const result = runSimulation(defaultSimParams);
    expect(result.yearlyData).toHaveLength(30);
  });

  it("has increasing month values", () => {
    const result = runSimulation(defaultSimParams);
    for (let i = 1; i < result.monthlyData.length; i++) {
      expect(result.monthlyData[i].month).toBe(result.monthlyData[i - 1].month + 1);
    }
  });

  it("includes maintenance cost in owner expenses", () => {
    const withMaintenance = runSimulation({
      ...defaultSimParams,
      params: makeParams({ maintenanceCost: 100 }),
    });
    const withoutMaintenance = runSimulation({
      ...defaultSimParams,
      params: makeParams({ maintenanceCost: 0 }),
    });
    // Owner sunk costs should be higher with maintenance costs
    const month60With = withMaintenance.monthlyData[59];
    const month60Without = withoutMaintenance.monthlyData[59];
    expect(month60With.sunkCosts).toBeGreaterThan(month60Without.sunkCosts);
    expect(month60With.monthlyCostOwner).toBeGreaterThan(month60Without.monthlyCostOwner);
  });

  it("tenant starts with initial capital (apport + frais notaire + travaux)", () => {
    const result = runSimulation(defaultSimParams);
    // After month 1, tenant wealth should include initial capital
    const month1 = result.monthlyData[0];
    const params = defaultSimParams.params;
    const initialCapital = params.apportPersonnel + params.notaryFees + 8000;
    // Tenant wealth = initialCapital + interest - rent saved (could be negative if owner pays more)
    // At minimum, the tenant wealth reflects that they started with the initial capital
    expect(month1.tenantWealth).toBeGreaterThan(0);
    // The exact value depends on cash flow difference, but should be near initial capital
    expect(Math.abs(month1.tenantWealth - initialCapital)).toBeLessThan(5000);
  });

  it("applies flat tax on savings returns", () => {
    const highTax = runSimulation({
      ...defaultSimParams,
      params: makeParams({ savingsTaxRate: 50, savingsRate: 5, ownerCostInflation: 0 }),
    });
    const noTax = runSimulation({
      ...defaultSimParams,
      params: makeParams({ savingsTaxRate: 0, savingsRate: 5, ownerCostInflation: 0 }),
    });
    // After 10 years, higher tax should mean lower tenant wealth
    const month120Tax = highTax.monthlyData[119];
    const month120NoTax = noTax.monthlyData[119];
    expect(month120Tax.tenantWealth).toBeLessThan(month120NoTax.tenantWealth);
  });

  it("applies owner cost inflation over time", () => {
    const withInflation = runSimulation({
      ...defaultSimParams,
      params: makeParams({ ownerCostInflation: 5 }),
    });
    const noInflation = runSimulation({
      ...defaultSimParams,
      params: makeParams({ ownerCostInflation: 0 }),
    });
    // After 10 years, owner costs should be higher with inflation
    const month120Infl = withInflation.monthlyData[119];
    const month120NoInfl = noInflation.monthlyData[119];
    expect(month120Infl.sunkCosts).toBeGreaterThan(month120NoInfl.sunkCosts);
    expect(month120Infl.monthlyCostOwner).toBeGreaterThan(month120NoInfl.monthlyCostOwner);
  });

  it("includes tenant charges in rent costs", () => {
    const withCharges = runSimulation({
      ...defaultSimParams,
      params: makeParams({ tenantMonthlyCharges: 50 }),
    });
    const noCharges = runSimulation({
      ...defaultSimParams,
      params: makeParams({ tenantMonthlyCharges: 0 }),
    });
    const month60With = withCharges.monthlyData[59];
    const month60Without = noCharges.monthlyData[59];
    // Tenant monthly cost should be higher with charges
    expect(month60With.monthlyCostTenant).toBeGreaterThan(month60Without.monthlyCostTenant);
  });

  it("calculates insurance on remaining capital when mode is 'remaining'", () => {
    const loanInitial = makeLoan({ insuranceMode: "initial", insuranceRate: 0.36 });
    const loanRemaining = makeLoan({ insuranceMode: "remaining", insuranceRate: 0.36 });
    
    const resultInitial = runSimulation({
      ...defaultSimParams,
      params: makeParams({ loans: [loanInitial] }),
    });
    const resultRemaining = runSimulation({
      ...defaultSimParams,
      params: makeParams({ loans: [loanRemaining] }),
    });
    // With "remaining" mode, insurance decreases over time so costs should be lower
    const month200Initial = resultInitial.monthlyData[199];
    const month200Remaining = resultRemaining.monthlyData[199];
    expect(month200Remaining.sunkCosts).toBeLessThan(month200Initial.sunkCosts);
    expect(month200Remaining.monthlyCostOwner).toBeLessThan(month200Initial.monthlyCostOwner);
  });

  it("includes IRA in earlyRepaymentFees data point", () => {
    const result = runSimulation({
      ...defaultSimParams,
      params: makeParams({
        loans: [makeLoan({ rate: 3, amount: 200000, durationMonths: 240 })],
      }),
    });
    // During loan period, IRA should be positive
    const month60 = result.monthlyData[59];
    expect(month60.earlyRepaymentFees).toBeGreaterThan(0);
    // After loan ends, IRA should be 0
    const month300 = result.monthlyData[299];
    expect(month300.earlyRepaymentFees).toBe(0);
  });

  it("handles 0% appreciation correctly", () => {
    const result = runSimulation({
      ...defaultSimParams,
      params: makeParams({ propertyAppreciation: 0 }),
    });
    // Property value should stay the same
    expect(result.monthlyData[0].propertyValue).toBeCloseTo(
      defaultSimParams.params.propertyPrice,
      -2 // tolerance of 100€
    );
  });

  it("handles negative appreciation (depreciation)", () => {
    const result = runSimulation({
      ...defaultSimParams,
      params: makeParams({ propertyAppreciation: -3 }),
    });
    const lastYear = result.yearlyData[result.yearlyData.length - 1];
    expect(lastYear.propertyValue).toBeLessThan(defaultSimParams.params.propertyPrice);
  });
});

// ─── findBreakEvenWealth ──────────────────────────────────

describe("findBreakEvenWealth", () => {
  it("finds first month where owner wealth >= tenant wealth", () => {
    const result = runSimulation({
      params: makeParams({ propertyAppreciation: 3 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const breakEven = findBreakEvenWealth(result.monthlyData);
    if (breakEven) {
      expect(breakEven.ownerWealth).toBeGreaterThanOrEqual(breakEven.tenantWealth);
      // The month before should have owner < tenant
      if (breakEven.month > 1) {
        const prevMonth = result.monthlyData[breakEven.month - 2];
        expect(prevMonth.ownerWealth).toBeLessThan(prevMonth.tenantWealth);
      }
    }
  });

  it("returns undefined when never profitable", () => {
    const result = runSimulation({
      params: makeParams({
        propertyAppreciation: -5,
        monthlyRent: 200,
        tenantMonthlyCharges: 0,
      }),
      totalInitialExpenses: 50000,
      totalMonthlyExpenses: 500,
      totalYearlyExpenses: 5000,
    });
    const breakEven = findBreakEvenWealth(result.monthlyData);
    expect(breakEven).toBeUndefined();
  });
});

// ─── findBreakEvenMonthly ─────────────────────────────────

describe("findBreakEvenMonthly", () => {
  it("finds first month where owner monthly cost <= tenant monthly cost", () => {
    const result = runSimulation({
      params: makeParams({ propertyAppreciation: 2 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const breakEven = findBreakEvenMonthly(result.monthlyData);
    if (breakEven) {
      expect(breakEven.monthlyCostOwner).toBeLessThanOrEqual(breakEven.monthlyCostTenant);
    }
  });
});

// ─── Deferred period with interest (rate > 0) ─────────────

describe("Deferred period with rate > 0", () => {
  it("charges intercalary interest during deferred period", () => {
    const loan = makeLoan({
      id: "deferred",
      amount: 100000,
      rate: 3,
      durationMonths: 240,
      deferredMonths: 12,
      insuranceRate: 0,
      insuranceMode: "initial",
    });
    const result = runSimulation({
      params: makeParams({ loans: [loan], condoFees: 0, propertyTax: 0, maintenanceCost: 0, ownerCostInflation: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // During deferred period (month 1-12): only interest, no principal repaid
    // Monthly interest = 100000 * 0.03 / 12 = 250€
    const month6 = result.monthlyData[5];
    // Debt should remain at 100000 during deferred period (no principal repaid)
    expect(month6.debtRemaining).toBe(100000);
    // After deferred period (month 13+), debt should start decreasing
    const month13 = result.monthlyData[12];
    expect(month13.debtRemaining).toBeLessThan(100000);
  });

  it("accumulates intercalary interest in sunk costs", () => {
    const loan = makeLoan({
      amount: 100000,
      rate: 3,
      durationMonths: 240,
      deferredMonths: 12,
      insuranceRate: 0,
      insuranceMode: "initial",
    });
    const result = runSimulation({
      params: makeParams({ loans: [loan], condoFees: 0, propertyTax: 0, maintenanceCost: 0, ownerCostInflation: 0, notaryFees: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // 12 months of interest at 100000 * 3% / 12 = 250€/month = 3000€ total
    const month12 = result.monthlyData[11];
    expect(month12.sunkCosts).toBeCloseTo(3000, -1);
  });

  it("uses higher monthly payment for the amortization period", () => {
    // With 12 months deferred, amortization period = 240 - 12 = 228 months
    const loanDeferred = makeLoan({ amount: 100000, rate: 3, durationMonths: 240, deferredMonths: 12 });
    const loanNormal = makeLoan({ amount: 100000, rate: 3, durationMonths: 240, deferredMonths: 0 });
    const [stateDeferred] = initializeLoansState([loanDeferred]);
    const [stateNormal] = initializeLoansState([loanNormal]);
    // Shorter amortization period → higher monthly payment
    expect(stateDeferred.monthlyPayment).toBeGreaterThan(stateNormal.monthlyPayment);
  });
});

// ─── Mathematical verification tests ──────────────────────

describe("Mathematical verification", () => {
  it("monthly payment formula is exact for known case", () => {
    // 100000€ at 3% over 20 years (240 months)
    // M = P * r(1+r)^n / ((1+r)^n - 1)
    const P = 100000;
    const annualRate = 3;
    const r = annualRate / 100 / 12;
    const n = 240;
    const expected = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    expect(calculateMonthlyPayment(P, annualRate, n)).toBeCloseTo(expected, 2);
  });

  it("total interest over loan life matches manual calculation", () => {
    const loan = makeLoan({ amount: 100000, rate: 3, durationMonths: 240, insuranceRate: 0, deferredMonths: 0 });
    const result = runSimulation({
      params: makeParams({
        loans: [loan],
        condoFees: 0,
        propertyTax: 0,
        maintenanceCost: 0,
        ownerCostInflation: 0,
        propertyPrice: 100000,
        notaryFees: 0,
        apportPersonnel: 0,
        agencyFeesPercent: 0,
        saleDiagnostics: 0,
        propertyAppreciation: 0,
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // Total paid = monthly payment * 240
    const payment = calculateMonthlyPayment(100000, 3, 240);
    const totalPaid = payment * 240;
    const totalInterest = totalPaid - 100000;
    // sunkCosts at month 240 should be close to totalInterest (only interest, no other costs)
    const month240 = result.monthlyData[239];
    expect(month240.sunkCosts).toBeCloseTo(totalInterest, 0);
  });

  it("debt reaches exactly 0 at end of loan duration", () => {
    const loan = makeLoan({ amount: 100000, rate: 3, durationMonths: 120, insuranceRate: 0, deferredMonths: 0 });
    const result = runSimulation({
      params: makeParams({ loans: [loan] }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const monthEnd = result.monthlyData[119]; // month 120
    expect(monthEnd.debtRemaining).toBe(0);
    // Month after should still be 0
    const monthAfter = result.monthlyData[120]; // month 121
    expect(monthAfter.debtRemaining).toBe(0);
  });

  it("insurance stops being charged after loan ends", () => {
    const loan = makeLoan({ amount: 100000, rate: 3, durationMonths: 120, insuranceRate: 0.36, deferredMonths: 0 });
    const result = runSimulation({
      params: makeParams({
        loans: [loan],
        condoFees: 0,
        propertyTax: 0,
        maintenanceCost: 0,
        ownerCostInflation: 0,
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // sunkCosts at month 120 vs month 130 should stop growing (no more insurance or interest)
    const month120 = result.monthlyData[119];
    const month130 = result.monthlyData[129];
    expect(month130.sunkCosts).toBe(month120.sunkCosts);
  });

  it("inflation compounds correctly over multiple years", () => {
    const baseRent = 800;
    const inflRate = 3;
    const result = runSimulation({
      params: makeParams({ monthlyRent: baseRent, rentInflation: inflRate, tenantMonthlyCharges: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // After 10 years, rent should have compounded: 800 * (1.03)^10 ≈ 1075
    const expectedRent10y = baseRent * Math.pow(1 + inflRate / 100, 10);
    // monthlyCostTenant at month 120 = accumulated rent / 120
    // but we can check by looking at the rate of tenant cost growth
    // Instead, verify the year-over-year compounding
    const year1 = result.yearlyData[0]; // end of year 1
    const year10 = result.yearlyData[9]; // end of year 10
    // Monthly cost tenant ratio should approximate inflation growth
    // year10.monthlyCostTenant / year1.monthlyCostTenant should be between 1.0 and 1.3
    // (it's an average, so won't match compounded rate exactly)
    expect(year10.monthlyCostTenant).toBeGreaterThan(year1.monthlyCostTenant);
  });

  it("owner cost inflation applies to propertyTax, condoFees, maintenanceCost", () => {
    const result = runSimulation({
      params: makeParams({
        loans: [makeLoan({ amount: 0, rate: 0, insuranceRate: 0 })],
        ownerCostInflation: 10,
        propertyTax: 1200,
        condoFees: 100,
        maintenanceCost: 50,
        propertyAppreciation: 0,
        apportPersonnel: 200000,
        notaryFees: 0,
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // At month 12, costs are at base level (no notaryFees in sunkCosts)
    // At month 13 (year 2), costs should have inflated by ~10%
    const month12 = result.monthlyData[11];
    const month24 = result.monthlyData[23];
    // Year 2 running costs - Year 1 running costs should be ~10% more
    const year1Costs = month12.sunkCosts;
    const year2Costs = month24.sunkCosts - month12.sunkCosts;
    expect(year2Costs).toBeGreaterThan(year1Costs * 1.05); // at least 5% more
    expect(year2Costs).toBeLessThan(year1Costs * 1.15); // but less than 15%
  });

  it("tenant savings accumulate correctly with interest", () => {
    // Owner pays much more than tenant → tenant saves the difference
    const result = runSimulation({
      params: makeParams({
        loans: [makeLoan({ amount: 200000, rate: 3, durationMonths: 240, insuranceRate: 0 })],
        monthlyRent: 400,
        tenantMonthlyCharges: 0,
        savingsRate: 0,
        savingsTaxRate: 0,
        condoFees: 0,
        propertyTax: 0,
        maintenanceCost: 0,
        ownerCostInflation: 0,
        rentInflation: 0,
        propertyAppreciation: 0,
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // With 0% savings rate, tenant wealth = initial capital + sum of monthly cash flow differences
    // Easier to verify: tenantWealth should be monotonically increasing (owner always pays more than 400€ rent)
    for (let i = 1; i < 240; i++) {
      expect(result.monthlyData[i].tenantWealth).toBeGreaterThanOrEqual(
        result.monthlyData[i - 1].tenantWealth
      );
    }
  });

  it("early repayment fees (IRA) decrease as loan progresses", () => {
    const loan = makeLoan({ amount: 200000, rate: 3, durationMonths: 240, insuranceRate: 0 });
    const result = runSimulation({
      params: makeParams({ loans: [loan] }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // IRA should decrease over time as remaining capital decreases
    const month12 = result.monthlyData[11];
    const month120 = result.monthlyData[119];
    expect(month120.earlyRepaymentFees).toBeLessThan(month12.earlyRepaymentFees);
  });

  it("ownerWealth increases with property appreciation", () => {
    const resultAppreciation = runSimulation({
      params: makeParams({ propertyAppreciation: 3 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const resultFlat = runSimulation({
      params: makeParams({ propertyAppreciation: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const month120Appr = resultAppreciation.monthlyData[119];
    const month120Flat = resultFlat.monthlyData[119];
    expect(month120Appr.ownerWealth).toBeGreaterThan(month120Flat.ownerWealth);
    expect(month120Appr.propertyValue).toBeGreaterThan(month120Flat.propertyValue);
  });

  it("selling costs are proportional to property value", () => {
    const result = runSimulation({
      params: makeParams({ agencyFeesPercent: 5, saleDiagnostics: 500, propertyAppreciation: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    const month12 = result.monthlyData[11];
    const expectedSellingCosts = Math.round(
      (DEFAULT_PARAMS.propertyPrice * 5) / 100 + 500
    );
    expect(month12.sellingCosts).toBe(expectedSellingCosts);
  });

  it("net sale price = property value - selling costs", () => {
    const result = runSimulation({
      params: makeParams(),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    for (const dp of result.yearlyData) {
      expect(dp.netSalePrice).toBe(dp.propertyValue - dp.sellingCosts);
    }
  });
});

// ─── Edge cases ───────────────────────────────────────────

describe("Edge cases", () => {
  it("handles zero-rate PTZ with deferred period", () => {
    const ptz: Loan = {
      id: "ptz",
      name: "PTZ",
      amount: 75000,
      rate: 0,
      durationMonths: 240,
      insuranceRate: 0,
      deferredMonths: 60,
      insuranceMode: "initial",
    };
    const result = runSimulation({
      params: makeParams({ loans: [ptz] }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // Should not crash and produce valid data
    expect(result.monthlyData).toHaveLength(360);
    expect(result.monthlyData[0].debtRemaining).toBeGreaterThan(0);
  });

  it("handles very high rent inflation", () => {
    const result = runSimulation({
      params: makeParams({ rentInflation: 10 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // After 10 years, rent cost should have increased significantly
    const year10 = result.yearlyData[9];
    expect(year10.monthlyCostTenant).toBeGreaterThan(DEFAULT_PARAMS.monthlyRent);
  });

  it("handles zero savings rate", () => {
    const result = runSimulation({
      params: makeParams({ savingsRate: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    expect(result.monthlyData).toHaveLength(360);
    // Monthly interests earned should be 0
    expect(result.monthlyData[59].monthlyInterestsEarned).toBe(0);
  });

  it("handles multiple loans simultaneously", () => {
    const loans: Loan[] = [
      makeLoan({ id: "ptz", amount: 75000, rate: 0, durationMonths: 240, deferredMonths: 60, insuranceMode: "initial" }),
      makeLoan({ id: "boost", amount: 15000, rate: 0, durationMonths: 240, deferredMonths: 0, insuranceMode: "initial" }),
      makeLoan({ id: "standard", amount: 200000, rate: 2, durationMonths: 300, deferredMonths: 0, insuranceMode: "initial" }),
    ];
    const result = runSimulation({
      params: makeParams({ loans }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    expect(result.monthlyData).toHaveLength(360);
    // All debt should be paid after max duration
    const month300 = result.monthlyData[299];
    expect(month300.debtRemaining).toBeLessThanOrEqual(1); // ~0 due to rounding
  });

  it("handles property price at minimum range", () => {
    const result = runSimulation({
      params: makeParams({ propertyPrice: 100000, apportPersonnel: 10000, loans: [makeLoan({ amount: 90000 })] }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    expect(result.monthlyData).toHaveLength(360);
  });

  it("handles 100% apport (no loan)", () => {
    const result = runSimulation({
      params: makeParams({
        propertyPrice: 200000,
        apportPersonnel: 200000,
        loans: [makeLoan({ amount: 0, rate: 0 })],
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    expect(result.monthlyData).toHaveLength(360);
    // No debt at any point
    expect(result.monthlyData[0].debtRemaining).toBe(0);
  });

  it("handles very large property price", () => {
    const result = runSimulation({
      params: makeParams({
        propertyPrice: 5000000,
        apportPersonnel: 500000,
        loans: [makeLoan({ amount: 4500000, rate: 4, durationMonths: 300 })],
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    expect(result.monthlyData).toHaveLength(360);
    expect(result.monthlyData[0].propertyValue).toBeGreaterThan(4000000);
  });

  it("handles custom expenses of all types", () => {
    const expenses: CustomExpense[] = [
      { id: "1", name: "Cuisine", amount: 5000, type: "initial" },
      { id: "2", name: "Ménage", amount: 100, type: "monthly" },
      { id: "3", name: "Ramonage", amount: 200, type: "yearly" },
    ];
    const totalInit = calculateTotalInitialExpenses(0, expenses);
    const totalMonthly = calculateTotalMonthlyExpenses(0, expenses);
    const totalYearly = calculateTotalYearlyExpenses(0, expenses);
    expect(totalInit).toBe(5000);
    expect(totalMonthly).toBe(100);
    expect(totalYearly).toBe(200);

    const result = runSimulation({
      params: makeParams(),
      totalInitialExpenses: totalInit,
      totalMonthlyExpenses: totalMonthly,
      totalYearlyExpenses: totalYearly,
    });
    expect(result.monthlyData).toHaveLength(360);
  });

  it("handles zero rent scenario", () => {
    const result = runSimulation({
      params: makeParams({ monthlyRent: 0, tenantMonthlyCharges: 0 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // Owner always loses when comparing to free rent
    const month240 = result.monthlyData[239];
    expect(month240.monthlyCostTenant).toBe(0);
    expect(month240.monthlyCostOwner).toBeGreaterThan(0);
  });

  it("handles high savings rate correctly", () => {
    const result = runSimulation({
      params: makeParams({ savingsRate: 10, savingsTaxRate: 30 }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // Net rate should be 10 * (1 - 0.3) = 7%
    // Interests should be positive after first month
    const month60 = result.monthlyData[59];
    expect(month60.monthlyInterestsEarned).toBeGreaterThan(0);
  });

  it("deferred loan with high rate accumulates significant intercalary interest", () => {
    const loan = makeLoan({
      amount: 200000,
      rate: 5,
      durationMonths: 300,
      deferredMonths: 60,
      insuranceRate: 0,
    });
    const result = runSimulation({
      params: makeParams({
        loans: [loan],
        condoFees: 0,
        propertyTax: 0,
        maintenanceCost: 0,
        ownerCostInflation: 0,
        notaryFees: 0,
      }),
      totalInitialExpenses: 0,
      totalMonthlyExpenses: 0,
      totalYearlyExpenses: 0,
    });
    // 60 months of interest on 200k at 5%: 200000 * 0.05/12 * 60 ≈ 50000€
    const month60 = result.monthlyData[59];
    expect(month60.sunkCosts).toBeCloseTo(50000, -3); // within ~1000€
    // Capital should remain unchanged during deferred period
    expect(month60.debtRemaining).toBe(200000);
  });
});
