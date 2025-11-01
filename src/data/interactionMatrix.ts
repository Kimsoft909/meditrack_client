// Evidence-based drug interaction rules
// Mirrors clinical databases like DrugBank, Lexicomp, Micromedex

import { DrugInteraction, InteractionSeverity, EvidenceLevel } from "@/types/drug";
import { drugDatabase } from "./drugDatabase";

// Helper to find drug by ID
const getDrug = (id: string) => drugDatabase.find(d => d.id === id)!;

// Comprehensive interaction matrix
export const interactionRules: DrugInteraction[] = [
  // CONTRAINDICATED INTERACTIONS
  {
    id: "int-001",
    drug1: getDrug("warfarin"),
    drug2: getDrug("aspirin"),
    severity: InteractionSeverity.CONTRAINDICATED,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Dual antiplatelet and anticoagulant effects increase bleeding risk synergistically",
    clinicalEffects: [
      "Severe bleeding (gastrointestinal, intracranial hemorrhage)",
      "Prolonged bleeding time",
      "Difficult to reverse bleeding events",
    ],
    management: "AVOID combination. If unavoidable: Use lowest aspirin dose (81mg), monitor INR every 3-5 days initially, patient education on bleeding signs (black stools, easy bruising, persistent nosebleeds).",
    monitoringParameters: ["INR q3-5 days initially, then weekly", "CBC monthly", "Stool guaiac", "Signs of bleeding"],
    references: [
      {
        id: "ref-001",
        title: "Risk of Bleeding with Combined Antiplatelet and Anticoagulant Therapy",
        authors: "Hallas J, et al.",
        journal: "Arch Intern Med",
        year: 2006,
        pmid: "16606810",
      },
    ],
    lastUpdated: new Date("2024-10-15"),
  },
  {
    id: "int-002",
    drug1: getDrug("phenelzine"),
    drug2: getDrug("sertraline"),
    severity: InteractionSeverity.CONTRAINDICATED,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "MAOI blocks serotonin metabolism while SSRI increases synaptic serotonin, leading to serotonin syndrome",
    clinicalEffects: [
      "Serotonin syndrome (hyperthermia, agitation, hyperreflexia)",
      "Autonomic instability",
      "Seizures, potentially fatal",
    ],
    management: "ABSOLUTE CONTRAINDICATION. Requires 2-week washout after MAOI discontinuation, 5 weeks for fluoxetine. If serotonin syndrome develops: discontinue all serotonergic agents, supportive care, consider cyproheptadine.",
    monitoringParameters: ["Mental status", "Vital signs", "Reflexes", "Temperature"],
    references: [
      {
        id: "ref-002",
        title: "Serotonin Syndrome: A Clinical Update",
        authors: "Boyer EW, Shannon M",
        journal: "N Engl J Med",
        year: 2005,
        pmid: "15858180",
      },
    ],
    lastUpdated: new Date("2024-09-20"),
  },
  {
    id: "int-003",
    drug1: getDrug("phenelzine"),
    drug2: getDrug("fluoxetine"),
    severity: InteractionSeverity.CONTRAINDICATED,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "MAOI + SSRI = severe serotonin syndrome risk, fluoxetine has long half-life (4-6 days) making interaction prolonged",
    clinicalEffects: [
      "Life-threatening serotonin syndrome",
      "Hyperpyrexia (>41°C)",
      "Muscular rigidity",
      "Rhabdomyolysis",
    ],
    management: "NEVER combine. Requires 5-week washout after fluoxetine discontinuation before starting MAOI (due to active metabolite norfluoxetine).",
    monitoringParameters: ["Temperature", "CK levels", "Renal function", "Mental status"],
    references: [
      {
        id: "ref-003",
        title: "Fatal Serotonin Syndrome Following a Combined Overdose of Moclobemide, Citalopram, and Fluoxetine",
        authors: "Hernández JL, et al.",
        journal: "Forensic Sci Int",
        year: 2002,
        pmid: "12062946",
      },
    ],
    lastUpdated: new Date("2024-09-20"),
  },
  {
    id: "int-004",
    drug1: getDrug("sildenafil"),
    drug2: getDrug("lisinopril"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Both drugs lower blood pressure; PDE5 inhibitor potentiates ACE inhibitor hypotensive effects",
    clinicalEffects: [
      "Severe hypotension",
      "Syncope",
      "Dizziness",
      "Falls (especially in elderly)",
    ],
    management: "Use with caution. Start sildenafil at lowest dose (25mg). Instruct patient to rise slowly, avoid rapid position changes. Monitor blood pressure closely.",
    monitoringParameters: ["Blood pressure (supine and standing)", "Symptoms of orthostatic hypotension"],
    references: [
      {
        id: "ref-004",
        title: "Hemodynamic Interaction Between Sildenafil and ACE Inhibitors",
        authors: "Webb DJ, et al.",
        journal: "Br J Clin Pharmacol",
        year: 1999,
        pmid: "10583021",
      },
    ],
    lastUpdated: new Date("2024-08-10"),
  },

  // MAJOR INTERACTIONS
  {
    id: "int-005",
    drug1: getDrug("warfarin"),
    drug2: getDrug("fluconazole"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Fluconazole inhibits CYP2C9, reducing warfarin metabolism and dramatically increasing INR",
    clinicalEffects: [
      "Supratherapeutic INR (>5)",
      "Major bleeding events",
      "INR may double within 3-5 days",
    ],
    management: "Reduce warfarin dose by 25-50% empirically. Check INR every 2-3 days during fluconazole therapy and for 1 week after discontinuation. Consider alternative antifungal (e.g., terbinafine for dermatophyte infections).",
    monitoringParameters: ["INR q2-3 days", "Signs of bleeding", "Platelet count"],
    references: [
      {
        id: "ref-005",
        title: "Drug Interactions with Warfarin: A Systematic Review",
        authors: "Holbrook AM, et al.",
        journal: "Arch Intern Med",
        year: 2005,
        pmid: "16061561",
      },
    ],
    lastUpdated: new Date("2024-10-01"),
  },
  {
    id: "int-006",
    drug1: getDrug("warfarin"),
    drug2: getDrug("ibuprofen"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "NSAID inhibits platelet function and causes gastric irritation, compounding anticoagulant bleeding risk",
    clinicalEffects: [
      "GI bleeding (risk increases 13-fold)",
      "Intracranial hemorrhage",
      "Renal dysfunction (reducing warfarin clearance)",
    ],
    management: "Avoid if possible; use acetaminophen instead. If NSAID necessary: use lowest effective dose, add PPI for GI protection, monitor INR closely (q3-5 days initially).",
    monitoringParameters: ["INR", "Hemoglobin/hematocrit", "Stool guaiac", "Renal function", "GI symptoms"],
    references: [
      {
        id: "ref-006",
        title: "NSAIDs and the Risk of Gastrointestinal Bleeding in Patients on Anticoagulants",
        authors: "Schelleman H, et al.",
        journal: "Am J Med",
        year: 2011,
        pmid: "21396511",
      },
    ],
    lastUpdated: new Date("2024-09-28"),
  },
  {
    id: "int-007",
    drug1: getDrug("clopidogrel"),
    drug2: getDrug("omeprazole"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Omeprazole inhibits CYP2C19, preventing clopidogrel conversion to active metabolite, reducing antiplatelet efficacy",
    clinicalEffects: [
      "Increased risk of cardiovascular events (MI, stroke)",
      "Stent thrombosis in PCI patients",
      "Reduced platelet inhibition (up to 50%)",
    ],
    management: "AVOID omeprazole; use pantoprazole instead (minimal CYP2C19 inhibition). If PPI necessary for GI protection, separate administration by 12+ hours. Consider H2-blocker alternative.",
    monitoringParameters: ["Cardiovascular symptoms", "Platelet function testing (if available)", "Signs of stent thrombosis"],
    references: [
      {
        id: "ref-007",
        title: "Omeprazole and Clopidogrel: FDA Update on Interaction",
        authors: "FDA Drug Safety Communication",
        journal: "FDA",
        year: 2010,
        url: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-reminds-healthcare-professionals-about-drug-interaction-between-plavix-clopidogrel-and-omeprazole",
      },
    ],
    lastUpdated: new Date("2024-09-15"),
  },
  {
    id: "int-008",
    drug1: getDrug("atorvastatin"),
    drug2: getDrug("ketoconazole"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Ketoconazole potently inhibits CYP3A4, increasing statin levels 20-40 fold, raising myopathy/rhabdomyolysis risk",
    clinicalEffects: [
      "Rhabdomyolysis (muscle breakdown)",
      "Severe myalgia",
      "Acute renal failure from myoglobin",
      "Elevated CK (>10x ULN)",
    ],
    management: "AVOID combination. If antifungal essential: discontinue statin during ketoconazole therapy, consider fluconazole (weaker CYP3A4 inhibitor) or switch to pravastatin/rosuvastatin (non-CYP3A4 metabolism).",
    monitoringParameters: ["CK levels", "Muscle pain/weakness", "Serum creatinine", "Urine myoglobin"],
    references: [
      {
        id: "ref-008",
        title: "Statin-Associated Myopathy with CYP3A4 Inhibitors",
        authors: "Neuvonen PJ, et al.",
        journal: "Clin Pharmacol Ther",
        year: 2008,
        pmid: "18388868",
      },
    ],
    lastUpdated: new Date("2024-08-22"),
  },
  {
    id: "int-009",
    drug1: getDrug("digoxin"),
    drug2: getDrug("azithromycin"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.MODERATE,
    mechanism: "Macrolides may increase digoxin absorption and reduce renal clearance (P-glycoprotein inhibition)",
    clinicalEffects: [
      "Digoxin toxicity (nausea, vision changes)",
      "Cardiac arrhythmias (AV block, ventricular ectopy)",
      "Potentially fatal dysrhythmias",
    ],
    management: "Monitor digoxin levels closely (baseline, day 3-5 of azithromycin). Consider 25% empiric digoxin dose reduction. Alternative antibiotic preferred if possible.",
    monitoringParameters: ["Digoxin level", "ECG", "Potassium", "Renal function", "Symptoms of toxicity"],
    references: [
      {
        id: "ref-009",
        title: "Macrolide Antibiotics and Digoxin: Drug Interaction Risk",
        authors: "Woodland C, et al.",
        journal: "CMAJ",
        year: 2015,
        pmid: "26504099",
      },
    ],
    lastUpdated: new Date("2024-07-18"),
  },
  {
    id: "int-010",
    drug1: getDrug("phenytoin"),
    drug2: getDrug("warfarin"),
    severity: InteractionSeverity.MAJOR,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Bidirectional interaction: phenytoin induces warfarin metabolism (decreasing INR initially), but also displaces warfarin from protein binding (increasing free fraction transiently)",
    clinicalEffects: [
      "Unpredictable INR fluctuations",
      "Initial INR elevation (days 1-3), then decline (weeks 2-4)",
      "Breakthrough clotting or bleeding",
    ],
    management: "Intensive INR monitoring (q2-3 days for 2 weeks, then weekly for 1 month). Warfarin dose adjustments likely necessary. Consider alternative anticonvulsant (e.g., levetiracetam - no interactions).",
    monitoringParameters: ["INR q2-3 days × 2 weeks", "Phenytoin level", "Signs of bleeding/clotting"],
    references: [
      {
        id: "ref-010",
        title: "Enzyme Induction and Warfarin Metabolism",
        authors: "Rettie AE, et al.",
        journal: "Clin Pharmacokinet",
        year: 1992,
        pmid: "1505638",
      },
    ],
    lastUpdated: new Date("2024-06-30"),
  },

  // MODERATE INTERACTIONS
  {
    id: "int-011",
    drug1: getDrug("metformin"),
    drug2: getDrug("lisinopril"),
    severity: InteractionSeverity.MODERATE,
    evidenceLevel: EvidenceLevel.MODERATE,
    mechanism: "ACE inhibitors reduce aldosterone, causing potassium retention; metformin rarely causes lactic acidosis in renal impairment",
    clinicalEffects: [
      "Hyperkalemia (especially with renal dysfunction)",
      "Increased lactic acidosis risk if renal function declines",
    ],
    management: "Monitor potassium and renal function at baseline, 1-2 weeks after starting, then every 3-6 months. Hold metformin if creatinine clearance <30 mL/min.",
    monitoringParameters: ["Serum potassium", "Serum creatinine/eGFR", "Glucose control"],
    references: [
      {
        id: "ref-011",
        title: "ACE Inhibitors and Hyperkalemia Risk",
        authors: "Bandak G, et al.",
        journal: "BMJ",
        year: 2015,
        pmid: "25735825",
      },
    ],
    lastUpdated: new Date("2024-10-05"),
  },
  {
    id: "int-012",
    drug1: getDrug("levothyroxine"),
    drug2: getDrug("omeprazole"),
    severity: InteractionSeverity.MODERATE,
    evidenceLevel: EvidenceLevel.MODERATE,
    mechanism: "PPIs reduce gastric acidity, decreasing levothyroxine absorption (requires acidic environment)",
    clinicalEffects: [
      "Reduced levothyroxine efficacy",
      "Elevated TSH",
      "Hypothyroid symptoms (fatigue, weight gain)",
    ],
    management: "Separate administration by 4+ hours (levothyroxine on empty stomach in AM, PPI with food). Monitor TSH 6-8 weeks after PPI initiation/discontinuation.",
    monitoringParameters: ["TSH", "Free T4", "Thyroid symptoms"],
    references: [
      {
        id: "ref-012",
        title: "Proton Pump Inhibitors and Levothyroxine Absorption",
        authors: "Liwanpo L, Hershman JM",
        journal: "Thyroid",
        year: 2009,
        pmid: "19281429",
      },
    ],
    lastUpdated: new Date("2024-09-10"),
  },
  {
    id: "int-013",
    drug1: getDrug("sertraline"),
    drug2: getDrug("tramadol"),
    severity: InteractionSeverity.MODERATE,
    evidenceLevel: EvidenceLevel.MODERATE,
    mechanism: "Both drugs increase serotonin (SSRI + tramadol's SNRI activity), raising serotonin syndrome risk",
    clinicalEffects: [
      "Mild-moderate serotonin syndrome",
      "Agitation, tremor, diaphoresis",
      "Seizure risk (tramadol lowers seizure threshold)",
    ],
    management: "Use with caution. Start tramadol at lowest dose. Educate patient on serotonin syndrome symptoms (fever, agitation, muscle rigidity). Consider alternative analgesic (e.g., acetaminophen, topical NSAIDs).",
    monitoringParameters: ["Mental status", "Reflexes", "Temperature", "Seizure activity"],
    references: [
      {
        id: "ref-013",
        title: "Serotonin Syndrome Risk with Tramadol and Antidepressants",
        authors: "Beakley BD, et al.",
        journal: "Am J Med",
        year: 2015,
        pmid: "25660245",
      },
    ],
    lastUpdated: new Date("2024-08-28"),
  },
  {
    id: "int-014",
    drug1: getDrug("amlodipine"),
    drug2: getDrug("simvastatin"),
    severity: InteractionSeverity.MODERATE,
    evidenceLevel: EvidenceLevel.HIGH,
    mechanism: "Amlodipine inhibits CYP3A4, increasing simvastatin levels and myopathy risk",
    clinicalEffects: [
      "Increased myalgia",
      "Elevated CK (usually <10x ULN)",
      "Rarely rhabdomyolysis",
    ],
    management: "Limit simvastatin dose to ≤20mg daily per FDA guidance. Monitor for muscle symptoms. Consider switching to atorvastatin (less affected) or pravastatin (non-CYP3A4).",
    monitoringParameters: ["Muscle pain/weakness", "CK (if symptomatic)", "Lipid panel"],
    references: [
      {
        id: "ref-014",
        title: "FDA Safety Alert: Simvastatin Dose Limitations with CYP3A4 Inhibitors",
        authors: "FDA",
        journal: "FDA Drug Safety Communication",
        year: 2011,
        url: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-new-restrictions-concerns-about-simvastatin-dose",
      },
    ],
    lastUpdated: new Date("2024-07-22"),
  },
  {
    id: "int-015",
    drug1: getDrug("ciprofloxacin"),
    drug2: getDrug("metformin"),
    severity: InteractionSeverity.MODERATE,
    evidenceLevel: EvidenceLevel.LOW,
    mechanism: "Fluoroquinolones can alter glucose metabolism and may affect metformin's glucose-lowering effects",
    clinicalEffects: [
      "Dysglycemia (hypo- or hyperglycemia)",
      "Unpredictable glucose fluctuations",
    ],
    management: "Monitor glucose closely during ciprofloxacin course. Counsel patient on hypo/hyperglycemia symptoms. Consider glucose checks 2-3x daily.",
    monitoringParameters: ["Blood glucose", "HbA1c (if prolonged therapy)", "Symptoms of dysglycemia"],
    references: [
      {
        id: "ref-015",
        title: "Fluoroquinolone-Associated Dysglycemia",
        authors: "Parekh TM, et al.",
        journal: "Clin Infect Dis",
        year: 2014,
        pmid: "25270851",
      },
    ],
    lastUpdated: new Date("2024-06-15"),
  },

  // MINOR INTERACTIONS
  {
    id: "int-016",
    drug1: getDrug("metoprolol"),
    drug2: getDrug("fluoxetine"),
    severity: InteractionSeverity.MINOR,
    evidenceLevel: EvidenceLevel.MODERATE,
    mechanism: "Fluoxetine inhibits CYP2D6, reducing metoprolol metabolism slightly",
    clinicalEffects: [
      "Modest increase in metoprolol levels",
      "Increased beta-blockade (bradycardia, hypotension)",
    ],
    management: "Usually clinically insignificant. Monitor heart rate and blood pressure periodically. Consider metoprolol dose adjustment if symptomatic bradycardia.",
    monitoringParameters: ["Heart rate", "Blood pressure", "Symptoms of beta-blockade excess"],
    references: [
      {
        id: "ref-016",
        title: "CYP2D6 Polymorphisms and Beta-Blocker Response",
        authors: "Shin J, Johnson JA",
        journal: "Clin Pharmacol Ther",
        year: 2007,
        pmid: "17215850",
      },
    ],
    lastUpdated: new Date("2024-05-20"),
  },
  {
    id: "int-017",
    drug1: getDrug("amoxicillin"),
    drug2: getDrug("metformin"),
    severity: InteractionSeverity.MINOR,
    evidenceLevel: EvidenceLevel.LOW,
    mechanism: "No significant pharmacokinetic or pharmacodynamic interaction expected",
    clinicalEffects: ["None expected"],
    management: "No specific monitoring required. Generally safe combination.",
    monitoringParameters: ["Standard monitoring for each drug individually"],
    references: [
      {
        id: "ref-017",
        title: "Drug Interaction Database Review",
        authors: "Lexicomp",
        journal: "Clinical Database",
        year: 2024,
      },
    ],
    lastUpdated: new Date("2024-10-12"),
  },
];

// Function to check interactions for a list of drugs
export function checkDrugInteractions(drugIds: string[]): DrugInteraction[] {
  if (drugIds.length < 2) return [];

  const interactions: DrugInteraction[] = [];
  
  // Check all pairs of drugs
  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const drug1Id = drugIds[i];
      const drug2Id = drugIds[j];
      
      // Look for interaction in both directions
      const interaction = interactionRules.find(
        rule =>
          (rule.drug1.id === drug1Id && rule.drug2.id === drug2Id) ||
          (rule.drug1.id === drug2Id && rule.drug2.id === drug1Id)
      );
      
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  
  // Sort by severity: contraindicated > major > moderate > minor
  const severityOrder = {
    [InteractionSeverity.CONTRAINDICATED]: 0,
    [InteractionSeverity.MAJOR]: 1,
    [InteractionSeverity.MODERATE]: 2,
    [InteractionSeverity.MINOR]: 3,
  };
  
  return interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
