export function calculateLinearTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const percentChange = yMean !== 0 ? (slope / yMean) * 100 * n : 0;
  
  return percentChange;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function detectAnomalies(
  values: number[],
  statusChecker: (value: number) => 'normal' | 'warning' | 'danger'
): number {
  return values.filter(v => statusChecker(v) !== 'normal').length;
}

export function calculateRiskScore(factors: {
  avgSystolic: number;
  avgGlucose: number;
  chronicConditionsCount: number;
  age: number;
  bmi: number;
}): number {
  let score = 0;
  
  // Blood pressure risk
  if (factors.avgSystolic > 140) score += 30;
  else if (factors.avgSystolic > 130) score += 15;
  
  // Glucose risk
  if (factors.avgGlucose > 180) score += 25;
  else if (factors.avgGlucose > 140) score += 15;
  
  // Chronic conditions
  if (factors.chronicConditionsCount > 2) score += 20;
  else if (factors.chronicConditionsCount > 0) score += 10;
  
  // Age factor
  if (factors.age > 65) score += 15;
  else if (factors.age > 55) score += 8;
  
  // BMI risk
  if (factors.bmi > 30) score += 10;
  else if (factors.bmi < 18.5) score += 10;
  
  return Math.min(score, 100);
}

export function getRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (score >= 86) return 'critical';
  if (score >= 61) return 'high';
  if (score >= 31) return 'moderate';
  return 'low';
}
