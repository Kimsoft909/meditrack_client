"""
Database seed data for initial drug library and interactions.
Run with: python -m app.db.seed_data
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction


# 100+ commonly prescribed medications
SEED_DRUGS = [
    Drug(id="DRUG-001", name="Lisinopril", generic_name="lisinopril", brand_names=["Prinivil", "Zestril"], drug_class="ACE Inhibitor", mechanism_of_action="Inhibits angiotensin-converting enzyme", rxcui="104376", indication="Hypertension, heart failure"),
    Drug(id="DRUG-002", name="Metformin", generic_name="metformin", brand_names=["Glucophage"], drug_class="Biguanide", mechanism_of_action="Decreases hepatic glucose production", rxcui="6809", indication="Type 2 diabetes"),
    Drug(id="DRUG-003", name="Atorvastatin", generic_name="atorvastatin", brand_names=["Lipitor"], drug_class="Statin", mechanism_of_action="HMG-CoA reductase inhibitor", rxcui="83367", indication="Hyperlipidemia, cardiovascular disease"),
    Drug(id="DRUG-004", name="Amlodipine", generic_name="amlodipine", brand_names=["Norvasc"], drug_class="Calcium Channel Blocker", mechanism_of_action="Inhibits calcium influx into vascular smooth muscle", rxcui="17767", indication="Hypertension, angina"),
    Drug(id="DRUG-005", name="Levothyroxine", generic_name="levothyroxine", brand_names=["Synthroid", "Levoxyl"], drug_class="Thyroid Hormone", mechanism_of_action="Replaces or supplements endogenous thyroid hormone", rxcui="10582", indication="Hypothyroidism"),
    Drug(id="DRUG-006", name="Omeprazole", generic_name="omeprazole", brand_names=["Prilosec"], drug_class="Proton Pump Inhibitor", mechanism_of_action="Inhibits gastric acid secretion", rxcui="7646", indication="GERD, peptic ulcer disease"),
    Drug(id="DRUG-007", name="Albuterol", generic_name="albuterol", brand_names=["Proventil", "Ventolin"], drug_class="Beta-2 Agonist", mechanism_of_action="Bronchodilation via beta-2 receptor stimulation", rxcui="435", indication="Asthma, COPD"),
    Drug(id="DRUG-008", name="Gabapentin", generic_name="gabapentin", brand_names=["Neurontin"], drug_class="Anticonvulsant", mechanism_of_action="Modulates calcium channels in neurons", rxcui="25480", indication="Neuropathic pain, seizures"),
    Drug(id="DRUG-009", name="Losartan", generic_name="losartan", brand_names=["Cozaar"], drug_class="ARB", mechanism_of_action="Angiotensin II receptor antagonist", rxcui="52175", indication="Hypertension, diabetic nephropathy"),
    Drug(id="DRUG-010", name="Hydrochlorothiazide", generic_name="hydrochlorothiazide", brand_names=["Microzide"], drug_class="Thiazide Diuretic", mechanism_of_action="Inhibits sodium reabsorption in distal tubule", rxcui="5487", indication="Hypertension, edema"),
    Drug(id="DRUG-011", name="Sertraline", generic_name="sertraline", brand_names=["Zoloft"], drug_class="SSRI", mechanism_of_action="Selective serotonin reuptake inhibitor", rxcui="36437", indication="Depression, anxiety disorders"),
    Drug(id="DRUG-012", name="Escitalopram", generic_name="escitalopram", brand_names=["Lexapro"], drug_class="SSRI", mechanism_of_action="Selective serotonin reuptake inhibitor", rxcui="321988", indication="Depression, generalized anxiety disorder"),
    Drug(id="DRUG-013", name="Montelukast", generic_name="montelukast", brand_names=["Singulair"], drug_class="Leukotriene Inhibitor", mechanism_of_action="Blocks leukotriene receptors", rxcui="30009", indication="Asthma, allergic rhinitis"),
    Drug(id="DRUG-014", name="Rosuvastatin", generic_name="rosuvastatin", brand_names=["Crestor"], drug_class="Statin", mechanism_of_action="HMG-CoA reductase inhibitor", rxcui="301542", indication="Hyperlipidemia"),
    Drug(id="DRUG-015", name="Esomeprazole", generic_name="esomeprazole", brand_names=["Nexium"], drug_class="Proton Pump Inhibitor", mechanism_of_action="Inhibits gastric acid secretion", rxcui="283742", indication="GERD, peptic ulcer disease"),
    Drug(id="DRUG-016", name="Furosemide", generic_name="furosemide", brand_names=["Lasix"], drug_class="Loop Diuretic", mechanism_of_action="Inhibits sodium-potassium-chloride cotransporter", rxcui="4603", indication="Edema, heart failure"),
    Drug(id="DRUG-017", name="Pantoprazole", generic_name="pantoprazole", brand_names=["Protonix"], drug_class="Proton Pump Inhibitor", mechanism_of_action="Inhibits gastric acid secretion", rxcui="40790", indication="GERD, erosive esophagitis"),
    Drug(id="DRUG-018", name="Carvedilol", generic_name="carvedilol", brand_names=["Coreg"], drug_class="Beta Blocker", mechanism_of_action="Non-selective beta and alpha-1 blocker", rxcui="20352", indication="Heart failure, hypertension"),
    Drug(id="DRUG-019", name="Tramadol", generic_name="tramadol", brand_names=["Ultram"], drug_class="Opioid Analgesic", mechanism_of_action="Opioid receptor agonist and SNRI", rxcui="10689", indication="Moderate to severe pain"),
    Drug(id="DRUG-020", name="Pravastatin", generic_name="pravastatin", brand_names=["Pravachol"], drug_class="Statin", mechanism_of_action="HMG-CoA reductase inhibitor", rxcui="42463", indication="Hyperlipidemia"),
    Drug(id="DRUG-021", name="Meloxicam", generic_name="meloxicam", brand_names=["Mobic"], drug_class="NSAID", mechanism_of_action="COX-2 selective inhibitor", rxcui="6960", indication="Osteoarthritis, rheumatoid arthritis"),
    Drug(id="DRUG-022", name="Clopidogrel", generic_name="clopidogrel", brand_names=["Plavix"], drug_class="Antiplatelet", mechanism_of_action="ADP receptor antagonist", rxcui="32968", indication="Prevention of cardiovascular events"),
    Drug(id="DRUG-023", name="Bupropion", generic_name="bupropion", brand_names=["Wellbutrin"], drug_class="Antidepressant", mechanism_of_action="Norepinephrine-dopamine reuptake inhibitor", rxcui="42347", indication="Depression, smoking cessation"),
    Drug(id="DRUG-024", name="Fluoxetine", generic_name="fluoxetine", brand_names=["Prozac"], drug_class="SSRI", mechanism_of_action="Selective serotonin reuptake inhibitor", rxcui="4493", indication="Depression, OCD, bulimia"),
    Drug(id="DRUG-025", name="Duloxetine", generic_name="duloxetine", brand_names=["Cymbalta"], drug_class="SNRI", mechanism_of_action="Serotonin-norepinephrine reuptake inhibitor", rxcui="72625", indication="Depression, anxiety, neuropathic pain"),
    Drug(id="DRUG-026", name="Warfarin", generic_name="warfarin", brand_names=["Coumadin"], drug_class="Anticoagulant", mechanism_of_action="Vitamin K antagonist", rxcui="11289", indication="Thromboembolism prevention"),
    Drug(id="DRUG-027", name="Aspirin", generic_name="aspirin", brand_names=["Bayer", "Ecotrin"], drug_class="Antiplatelet, NSAID", mechanism_of_action="Irreversibly inhibits COX-1", rxcui="1191", indication="Cardiovascular prevention, pain"),
    Drug(id="DRUG-028", name="Amoxicillin", generic_name="amoxicillin", brand_names=["Amoxil"], drug_class="Penicillin Antibiotic", mechanism_of_action="Inhibits bacterial cell wall synthesis", rxcui="723", indication="Bacterial infections"),
    Drug(id="DRUG-029", name="Azithromycin", generic_name="azithromycin", brand_names=["Zithromax"], drug_class="Macrolide Antibiotic", mechanism_of_action="Inhibits bacterial protein synthesis", rxcui="18631", indication="Bacterial infections"),
    Drug(id="DRUG-030", name="Ciprofloxacin", generic_name="ciprofloxacin", brand_names=["Cipro"], drug_class="Fluoroquinolone", mechanism_of_action="Inhibits bacterial DNA gyrase", rxcui="2551", indication="Bacterial infections"),
    Drug(id="DRUG-031", name="Prednisone", generic_name="prednisone", brand_names=["Deltasone"], drug_class="Corticosteroid", mechanism_of_action="Anti-inflammatory, immunosuppressant", rxcui="8640", indication="Inflammation, autoimmune conditions"),
    Drug(id="DRUG-032", name="Methylprednisolone", generic_name="methylprednisolone", brand_names=["Medrol"], drug_class="Corticosteroid", mechanism_of_action="Anti-inflammatory, immunosuppressant", rxcui="6902", indication="Inflammation, allergic reactions"),
    Drug(id="DRUG-033", name="Glipizide", generic_name="glipizide", brand_names=["Glucotrol"], drug_class="Sulfonylurea", mechanism_of_action="Stimulates insulin secretion", rxcui="4821", indication="Type 2 diabetes"),
    Drug(id="DRUG-034", name="Insulin Glargine", generic_name="insulin glargine", brand_names=["Lantus"], drug_class="Long-acting Insulin", mechanism_of_action="Replaces endogenous insulin", rxcui="274783", indication="Diabetes mellitus"),
    Drug(id="DRUG-035", name="Metoprolol", generic_name="metoprolol", brand_names=["Lopressor", "Toprol-XL"], drug_class="Beta Blocker", mechanism_of_action="Beta-1 selective blocker", rxcui="6918", indication="Hypertension, angina, heart failure"),
    Drug(id="DRUG-036", name="Atenolol", generic_name="atenolol", brand_names=["Tenormin"], drug_class="Beta Blocker", mechanism_of_action="Beta-1 selective blocker", rxcui="1202", indication="Hypertension, angina"),
    Drug(id="DRUG-037", name="Diltiazem", generic_name="diltiazem", brand_names=["Cardizem"], drug_class="Calcium Channel Blocker", mechanism_of_action="Inhibits calcium influx", rxcui="3443", indication="Hypertension, atrial fibrillation"),
    Drug(id="DRUG-038", name="Verapamil", generic_name="verapamil", brand_names=["Calan"], drug_class="Calcium Channel Blocker", mechanism_of_action="Inhibits calcium influx", rxcui="11170", indication="Hypertension, arrhythmias"),
    Drug(id="DRUG-039", name="Spironolactone", generic_name="spironolactone", brand_names=["Aldactone"], drug_class="Potassium-Sparing Diuretic", mechanism_of_action="Aldosterone antagonist", rxcui="9997", indication="Heart failure, hypertension, edema"),
    Drug(id="DRUG-040", name="Clonazepam", generic_name="clonazepam", brand_names=["Klonopin"], drug_class="Benzodiazepine", mechanism_of_action="Enhances GABA activity", rxcui="2598", indication="Seizures, panic disorder"),
    Drug(id="DRUG-041", name="Lorazepam", generic_name="lorazepam", brand_names=["Ativan"], drug_class="Benzodiazepine", mechanism_of_action="Enhances GABA activity", rxcui="6470", indication="Anxiety, insomnia, seizures"),
    Drug(id="DRUG-042", name="Alprazolam", generic_name="alprazolam", brand_names=["Xanax"], drug_class="Benzodiazepine", mechanism_of_action="Enhances GABA activity", rxcui="596", indication="Anxiety, panic disorder"),
    Drug(id="DRUG-043", name="Zolpidem", generic_name="zolpidem", brand_names=["Ambien"], drug_class="Sedative-Hypnotic", mechanism_of_action="GABA-A receptor agonist", rxcui="39993", indication="Insomnia"),
    Drug(id="DRUG-044", name="Trazodone", generic_name="trazodone", brand_names=["Desyrel"], drug_class="Antidepressant", mechanism_of_action="Serotonin antagonist and reuptake inhibitor", rxcui="10737", indication="Depression, insomnia"),
    Drug(id="DRUG-045", name="Ranitidine", generic_name="ranitidine", brand_names=["Zantac"], drug_class="H2 Blocker", mechanism_of_action="Histamine H2 receptor antagonist", rxcui="9143", indication="GERD, peptic ulcer disease"),
    Drug(id="DRUG-046", name="Famotidine", generic_name="famotidine", brand_names=["Pepcid"], drug_class="H2 Blocker", mechanism_of_action="Histamine H2 receptor antagonist", rxcui="4278", indication="GERD, peptic ulcer disease"),
    Drug(id="DRUG-047", name="Cetirizine", generic_name="cetirizine", brand_names=["Zyrtec"], drug_class="Antihistamine", mechanism_of_action="H1 receptor antagonist", rxcui="20610", indication="Allergic rhinitis, urticaria"),
    Drug(id="DRUG-048", name="Loratadine", generic_name="loratadine", brand_names=["Claritin"], drug_class="Antihistamine", mechanism_of_action="H1 receptor antagonist", rxcui="6472", indication="Allergic rhinitis, urticaria"),
    Drug(id="DRUG-049", name="Fexofenadine", generic_name="fexofenadine", brand_names=["Allegra"], drug_class="Antihistamine", mechanism_of_action="H1 receptor antagonist", rxcui="25078", indication="Allergic rhinitis, urticaria"),
    Drug(id="DRUG-050", name="Ibuprofen", generic_name="ibuprofen", brand_names=["Advil", "Motrin"], drug_class="NSAID", mechanism_of_action="COX inhibitor", rxcui="5640", indication="Pain, inflammation, fever"),
    Drug(id="DRUG-051", name="Naproxen", generic_name="naproxen", brand_names=["Aleve", "Naprosyn"], drug_class="NSAID", mechanism_of_action="COX inhibitor", rxcui="7258", indication="Pain, inflammation"),
    Drug(id="DRUG-052", name="Celecoxib", generic_name="celecoxib", brand_names=["Celebrex"], drug_class="NSAID", mechanism_of_action="COX-2 selective inhibitor", rxcui="140587", indication="Osteoarthritis, rheumatoid arthritis"),
    Drug(id="DRUG-053", name="Acetaminophen", generic_name="acetaminophen", brand_names=["Tylenol"], drug_class="Analgesic", mechanism_of_action="Inhibits prostaglandin synthesis centrally", rxcui="161", indication="Pain, fever"),
    Drug(id="DRUG-054", name="Cyclobenzaprine", generic_name="cyclobenzaprine", brand_names=["Flexeril"], drug_class="Muscle Relaxant", mechanism_of_action="Centrally acting muscle relaxant", rxcui="3112", indication="Muscle spasm"),
    Drug(id="DRUG-055", name="Methocarbamol", generic_name="methocarbamol", brand_names=["Robaxin"], drug_class="Muscle Relaxant", mechanism_of_action="Centrally acting muscle relaxant", rxcui="6916", indication="Muscle spasm"),
    Drug(id="DRUG-056", name="Baclofen", generic_name="baclofen", brand_names=["Lioresal"], drug_class="Muscle Relaxant", mechanism_of_action="GABA-B receptor agonist", rxcui="1292", indication="Spasticity"),
    Drug(id="DRUG-057", name="Tamsulosin", generic_name="tamsulosin", brand_names=["Flomax"], drug_class="Alpha Blocker", mechanism_of_action="Alpha-1A receptor antagonist", rxcui="77492", indication="Benign prostatic hyperplasia"),
    Drug(id="DRUG-058", name="Finasteride", generic_name="finasteride", brand_names=["Proscar", "Propecia"], drug_class="5-Alpha Reductase Inhibitor", mechanism_of_action="Inhibits conversion of testosterone to DHT", rxcui="49276", indication="BPH, male pattern baldness"),
    Drug(id="DRUG-059", name="Sildenafil", generic_name="sildenafil", brand_names=["Viagra"], drug_class="PDE5 Inhibitor", mechanism_of_action="Phosphodiesterase-5 inhibitor", rxcui="136411", indication="Erectile dysfunction, pulmonary hypertension"),
    Drug(id="DRUG-060", name="Tadalafil", generic_name="tadalafil", brand_names=["Cialis"], drug_class="PDE5 Inhibitor", mechanism_of_action="Phosphodiesterase-5 inhibitor", rxcui="349332", indication="Erectile dysfunction, BPH"),
    Drug(id="DRUG-061", name="Allopurinol", generic_name="allopurinol", brand_names=["Zyloprim"], drug_class="Xanthine Oxidase Inhibitor", mechanism_of_action="Inhibits uric acid production", rxcui="519", indication="Gout, hyperuricemia"),
    Drug(id="DRUG-062", name="Colchicine", generic_name="colchicine", brand_names=["Colcrys"], drug_class="Anti-gout Agent", mechanism_of_action="Inhibits microtubule polymerization", rxcui="2683", indication="Gout, familial Mediterranean fever"),
    Drug(id="DRUG-063", name="Doxycycline", generic_name="doxycycline", brand_names=["Vibramycin"], drug_class="Tetracycline Antibiotic", mechanism_of_action="Inhibits bacterial protein synthesis", rxcui="3616", indication="Bacterial infections, acne"),
    Drug(id="DRUG-064", name="Cephalexin", generic_name="cephalexin", brand_names=["Keflex"], drug_class="Cephalosporin", mechanism_of_action="Inhibits bacterial cell wall synthesis", rxcui="2231", indication="Bacterial infections"),
    Drug(id="DRUG-065", name="Trimethoprim-Sulfamethoxazole", generic_name="trimethoprim-sulfamethoxazole", brand_names=["Bactrim", "Septra"], drug_class="Sulfonamide", mechanism_of_action="Inhibits bacterial folate synthesis", rxcui="10831", indication="Bacterial infections, PCP prophylaxis"),
    Drug(id="DRUG-066", name="Nitrofurantoin", generic_name="nitrofurantoin", brand_names=["Macrobid"], drug_class="Antibiotic", mechanism_of_action="Damages bacterial DNA", rxcui="7454", indication="Urinary tract infections"),
    Drug(id="DRUG-067", name="Valacyclovir", generic_name="valacyclovir", brand_names=["Valtrex"], drug_class="Antiviral", mechanism_of_action="Inhibits viral DNA polymerase", rxcui="282452", indication="Herpes simplex, herpes zoster"),
    Drug(id="DRUG-068", name="Acyclovir", generic_name="acyclovir", brand_names=["Zovirax"], drug_class="Antiviral", mechanism_of_action="Inhibits viral DNA polymerase", rxcui="281", indication="Herpes simplex, herpes zoster, varicella"),
    Drug(id="DRUG-069", name="Oseltamivir", generic_name="oseltamivir", brand_names=["Tamiflu"], drug_class="Antiviral", mechanism_of_action="Neuraminidase inhibitor", rxcui="73274", indication="Influenza"),
    Drug(id="DRUG-070", name="Fluconazole", generic_name="fluconazole", brand_names=["Diflucan"], drug_class="Antifungal", mechanism_of_action="Inhibits fungal ergosterol synthesis", rxcui="4450", indication="Fungal infections"),
    Drug(id="DRUG-071", name="Clotrimazole", generic_name="clotrimazole", brand_names=["Lotrimin"], drug_class="Antifungal", mechanism_of_action="Inhibits fungal ergosterol synthesis", rxcui="2623", indication="Fungal skin infections"),
    Drug(id="DRUG-072", name="Ondansetron", generic_name="ondansetron", brand_names=["Zofran"], drug_class="Antiemetic", mechanism_of_action="5-HT3 receptor antagonist", rxcui="56946", indication="Nausea, vomiting"),
    Drug(id="DRUG-073", name="Promethazine", generic_name="promethazine", brand_names=["Phenergan"], drug_class="Antihistamine, Antiemetic", mechanism_of_action="H1 receptor antagonist", rxcui="8745", indication="Nausea, vomiting, allergies"),
    Drug(id="DRUG-074", name="Meclizine", generic_name="meclizine", brand_names=["Antivert"], drug_class="Antihistamine", mechanism_of_action="H1 receptor antagonist", rxcui="6691", indication="Motion sickness, vertigo"),
    Drug(id="DRUG-075", name="Diphenhydramine", generic_name="diphenhydramine", brand_names=["Benadryl"], drug_class="Antihistamine", mechanism_of_action="H1 receptor antagonist", rxcui="3498", indication="Allergies, insomnia, motion sickness"),
    Drug(id="DRUG-076", name="Pseudoephedrine", generic_name="pseudoephedrine", brand_names=["Sudafed"], drug_class="Decongestant", mechanism_of_action="Alpha-adrenergic agonist", rxcui="8787", indication="Nasal congestion"),
    Drug(id="DRUG-077", name="Guaifenesin", generic_name="guaifenesin", brand_names=["Mucinex"], drug_class="Expectorant", mechanism_of_action="Increases respiratory tract secretions", rxcui="5352", indication="Cough with mucus"),
    Drug(id="DRUG-078", name="Dextromethorphan", generic_name="dextromethorphan", brand_names=["Robitussin"], drug_class="Antitussive", mechanism_of_action="NMDA receptor antagonist", rxcui="3216", indication="Cough suppression"),
    Drug(id="DRUG-079", name="Benzonatate", generic_name="benzonatate", brand_names=["Tessalon"], drug_class="Antitussive", mechanism_of_action="Anesthetizes stretch receptors", rxcui="1649", indication="Cough suppression"),
    Drug(id="DRUG-080", name="Digoxin", generic_name="digoxin", brand_names=["Lanoxin"], drug_class="Cardiac Glycoside", mechanism_of_action="Inhibits Na-K ATPase", rxcui="3407", indication="Heart failure, atrial fibrillation"),
    Drug(id="DRUG-081", name="Amiodarone", generic_name="amiodarone", brand_names=["Cordarone"], drug_class="Antiarrhythmic", mechanism_of_action="Multiple ion channel effects", rxcui="703", indication="Ventricular and atrial arrhythmias"),
    Drug(id="DRUG-082", name="Potassium Chloride", generic_name="potassium chloride", brand_names=["K-Dur", "Klor-Con"], drug_class="Electrolyte", mechanism_of_action="Potassium replacement", rxcui="8591", indication="Hypokalemia"),
    Drug(id="DRUG-083", name="Calcium Carbonate", generic_name="calcium carbonate", brand_names=["Tums", "Os-Cal"], drug_class="Antacid, Calcium Supplement", mechanism_of_action="Neutralizes gastric acid", rxcui="1998", indication="Heartburn, calcium deficiency"),
    Drug(id="DRUG-084", name="Vitamin D3", generic_name="cholecalciferol", brand_names=["D-Vi-Sol"], drug_class="Vitamin", mechanism_of_action="Calcium and phosphorus metabolism", rxcui="259255", indication="Vitamin D deficiency, osteoporosis"),
    Drug(id="DRUG-085", name="Multivitamin", generic_name="multivitamin", brand_names=["Centrum"], drug_class="Vitamin Supplement", mechanism_of_action="Nutritional supplementation", rxcui="7238", indication="Nutritional deficiency prevention"),
    Drug(id="DRUG-086", name="Ferrous Sulfate", generic_name="ferrous sulfate", brand_names=["Feosol"], drug_class="Iron Supplement", mechanism_of_action="Iron replacement", rxcui="4521", indication="Iron deficiency anemia"),
    Drug(id="DRUG-087", name="Docusate", generic_name="docusate", brand_names=["Colace"], drug_class="Stool Softener", mechanism_of_action="Surfactant laxative", rxcui="3541", indication="Constipation"),
    Drug(id="DRUG-088", name="Senna", generic_name="sennosides", brand_names=["Senokot"], drug_class="Laxative", mechanism_of_action="Stimulant laxative", rxcui="9440", indication="Constipation"),
    Drug(id="DRUG-089", name="Polyethylene Glycol", generic_name="polyethylene glycol 3350", brand_names=["MiraLAX"], drug_class="Osmotic Laxative", mechanism_of_action="Osmotic laxative", rxcui="202684", indication="Constipation"),
    Drug(id="DRUG-090", name="Loperamide", generic_name="loperamide", brand_names=["Imodium"], drug_class="Antidiarrheal", mechanism_of_action="Opioid receptor agonist in GI tract", rxcui="6448", indication="Diarrhea"),
    Drug(id="DRUG-091", name="Simethicone", generic_name="simethicone", brand_names=["Gas-X"], drug_class="Antiflatulent", mechanism_of_action="Reduces surface tension of gas bubbles", rxcui="9796", indication="Gas, bloating"),
    Drug(id="DRUG-092", name="Bisacodyl", generic_name="bisacodyl", brand_names=["Dulcolax"], drug_class="Laxative", mechanism_of_action="Stimulant laxative", rxcui="1767", indication="Constipation"),
    Drug(id="DRUG-093", name="Magnesium Hydroxide", generic_name="magnesium hydroxide", brand_names=["Milk of Magnesia"], drug_class="Antacid, Laxative", mechanism_of_action="Neutralizes acid, osmotic laxative", rxcui="6689", indication="Heartburn, constipation"),
    Drug(id="DRUG-094", name="Hydrocortisone", generic_name="hydrocortisone", brand_names=["Cortaid"], drug_class="Topical Corticosteroid", mechanism_of_action="Anti-inflammatory", rxcui="5492", indication="Skin inflammation, itching"),
    Drug(id="DRUG-095", name="Triamcinolone", generic_name="triamcinolone", brand_names=["Kenalog"], drug_class="Corticosteroid", mechanism_of_action="Anti-inflammatory", rxcui="10759", indication="Inflammation, allergies, skin conditions"),
    Drug(id="DRUG-096", name="Mupirocin", generic_name="mupirocin", brand_names=["Bactroban"], drug_class="Topical Antibiotic", mechanism_of_action="Inhibits bacterial protein synthesis", rxcui="7220", indication="Bacterial skin infections"),
    Drug(id="DRUG-097", name="Ketoconazole", generic_name="ketoconazole", brand_names=["Nizoral"], drug_class="Antifungal", mechanism_of_action="Inhibits fungal ergosterol synthesis", rxcui="6135", indication="Fungal infections"),
    Drug(id="DRUG-098", name="Tretinoin", generic_name="tretinoin", brand_names=["Retin-A"], drug_class="Retinoid", mechanism_of_action="Normalizes epithelial cell differentiation", rxcui="10756", indication="Acne, photoaging"),
    Drug(id="DRUG-099", name="Benzoyl Peroxide", generic_name="benzoyl peroxide", brand_names=["Clearasil"], drug_class="Antibacterial", mechanism_of_action="Oxidizing antibacterial agent", rxcui="1662", indication="Acne"),
    Drug(id="DRUG-100", name="Latanoprost", generic_name="latanoprost", brand_names=["Xalatan"], drug_class="Prostaglandin Analog", mechanism_of_action="Increases aqueous humor outflow", rxcui="52582", indication="Glaucoma, ocular hypertension"),
]

# 50+ drug interactions
SEED_INTERACTIONS = [
    DrugInteraction(id="INT-001", drug1_id="DRUG-001", drug2_id="DRUG-010", severity="moderate", evidence_level="high", mechanism="ACE inhibitors with potassium-sparing diuretics may cause hyperkalemia", clinical_effects=["Hyperkalemia"], management="Monitor potassium levels", monitoring_parameters=["Serum potassium"]),
    DrugInteraction(id="INT-002", drug1_id="DRUG-003", drug2_id="DRUG-027", severity="moderate", evidence_level="moderate", mechanism="Statins may increase bleeding risk with aspirin", clinical_effects=["Increased bleeding"], management="Monitor for bleeding", monitoring_parameters=["PT/INR if warranted"]),
    DrugInteraction(id="INT-003", drug1_id="DRUG-026", drug2_id="DRUG-027", severity="high", evidence_level="high", mechanism="Warfarin with aspirin increases bleeding risk significantly", clinical_effects=["Major bleeding risk"], management="Avoid combination or use with extreme caution", monitoring_parameters=["INR", "Signs of bleeding"]),
    DrugInteraction(id="INT-004", drug1_id="DRUG-011", drug2_id="DRUG-040", severity="moderate", evidence_level="moderate", mechanism="SSRIs with benzodiazepines may increase sedation", clinical_effects=["Increased sedation"], management="Monitor for excessive sedation", monitoring_parameters=["Mental status"]),
    DrugInteraction(id="INT-005", drug1_id="DRUG-006", drug2_id="DRUG-022", severity="moderate", evidence_level="high", mechanism="PPIs may reduce effectiveness of clopidogrel", clinical_effects=["Reduced antiplatelet effect"], management="Consider alternative PPI or H2 blocker", monitoring_parameters=["Cardiovascular events"]),
    DrugInteraction(id="INT-006", drug1_id="DRUG-002", drug2_id="DRUG-031", severity="moderate", evidence_level="high", mechanism="Corticosteroids may reduce effectiveness of metformin and increase blood glucose", clinical_effects=["Hyperglycemia"], management="Monitor blood glucose closely", monitoring_parameters=["Blood glucose", "HbA1c"]),
    DrugInteraction(id="INT-007", drug1_id="DRUG-026", drug2_id="DRUG-050", severity="high", evidence_level="high", mechanism="NSAIDs increase bleeding risk with warfarin", clinical_effects=["Major bleeding risk"], management="Avoid NSAIDs; use acetaminophen instead", monitoring_parameters=["INR", "Signs of bleeding"]),
    DrugInteraction(id="INT-008", drug1_id="DRUG-001", drug2_id="DRUG-039", severity="high", evidence_level="high", mechanism="ACE inhibitors with spironolactone may cause severe hyperkalemia", clinical_effects=["Severe hyperkalemia"], management="Avoid combination or monitor potassium very closely", monitoring_parameters=["Serum potassium", "Renal function"]),
    DrugInteraction(id="INT-009", drug1_id="DRUG-011", drug2_id="DRUG-019", severity="high", evidence_level="high", mechanism="SSRIs with tramadol increase serotonin syndrome risk", clinical_effects=["Serotonin syndrome"], management="Avoid combination; use alternative analgesic", monitoring_parameters=["Mental status", "Neuromuscular symptoms"]),
    DrugInteraction(id="INT-010", drug1_id="DRUG-035", drug2_id="DRUG-037", severity="moderate", evidence_level="high", mechanism="Beta blockers with diltiazem may cause bradycardia and heart block", clinical_effects=["Bradycardia", "AV block"], management="Monitor heart rate and ECG", monitoring_parameters=["Heart rate", "ECG"]),
    DrugInteraction(id="INT-011", drug1_id="DRUG-005", drug2_id="DRUG-082", severity="moderate", evidence_level="moderate", mechanism="Levothyroxine absorption may be reduced by supplements", clinical_effects=["Reduced thyroid hormone levels"], management="Separate administration by 4 hours", monitoring_parameters=["TSH", "Free T4"]),
    DrugInteraction(id="INT-012", drug1_id="DRUG-026", drug2_id="DRUG-028", severity="moderate", evidence_level="moderate", mechanism="Certain antibiotics may potentiate warfarin", clinical_effects=["Increased INR", "Bleeding risk"], management="Monitor INR closely", monitoring_parameters=["INR"]),
    DrugInteraction(id="INT-013", drug1_id="DRUG-026", drug2_id="DRUG-070", severity="high", evidence_level="high", mechanism="Fluconazole significantly increases warfarin levels", clinical_effects=["Major bleeding risk"], management="Reduce warfarin dose, monitor INR", monitoring_parameters=["INR", "Signs of bleeding"]),
    DrugInteraction(id="INT-014", drug1_id="DRUG-001", drug2_id="DRUG-061", severity="moderate", evidence_level="moderate", mechanism="ACE inhibitors may enhance hypersensitivity reactions to allopurinol", clinical_effects=["Hypersensitivity reactions"], management="Monitor for rash and symptoms", monitoring_parameters=["Skin reactions"]),
    DrugInteraction(id="INT-015", drug1_id="DRUG-016", drug2_id="DRUG-080", severity="high", evidence_level="high", mechanism="Loop diuretics may increase digoxin toxicity via hypokalemia", clinical_effects=["Digoxin toxicity"], management="Monitor potassium and digoxin levels", monitoring_parameters=["Serum potassium", "Digoxin level"]),
    DrugInteraction(id="INT-016", drug1_id="DRUG-081", drug2_id="DRUG-026", severity="moderate", evidence_level="moderate", mechanism="Amiodarone increases warfarin levels", clinical_effects=["Increased INR"], management="Reduce warfarin dose, monitor INR", monitoring_parameters=["INR"]),
    DrugInteraction(id="INT-017", drug1_id="DRUG-011", drug2_id="DRUG-044", severity="moderate", evidence_level="moderate", mechanism="Multiple serotonergic agents increase serotonin syndrome risk", clinical_effects=["Serotonin syndrome"], management="Monitor for serotonin syndrome symptoms", monitoring_parameters=["Mental status", "Autonomic symptoms"]),
    DrugInteraction(id="INT-018", drug1_id="DRUG-033", drug2_id="DRUG-002", severity="moderate", evidence_level="moderate", mechanism="Sulfonylureas with metformin may increase hypoglycemia risk", clinical_effects=["Hypoglycemia"], management="Monitor blood glucose", monitoring_parameters=["Blood glucose"]),
    DrugInteraction(id="INT-019", drug1_id="DRUG-059", drug2_id="DRUG-007", severity="low", evidence_level="low", mechanism="PDE5 inhibitors with nitrates can cause severe hypotension", clinical_effects=["Severe hypotension"], management="Avoid combination completely", monitoring_parameters=["Blood pressure"]),
    DrugInteraction(id="INT-020", drug1_id="DRUG-035", drug2_id="DRUG-007", severity="moderate", evidence_level="moderate", mechanism="Beta blockers may reduce effectiveness of beta agonists", clinical_effects=["Reduced bronchodilation"], management="Use cardioselective beta blocker", monitoring_parameters=["Respiratory symptoms"]),
    DrugInteraction(id="INT-021", drug1_id="DRUG-031", drug2_id="DRUG-050", severity="high", evidence_level="high", mechanism="Corticosteroids with NSAIDs increase GI bleeding risk", clinical_effects=["GI bleeding"], management="Use PPI for gastroprotection", monitoring_parameters=["GI symptoms", "Hemoglobin"]),
    DrugInteraction(id="INT-022", drug1_id="DRUG-001", drug2_id="DRUG-050", severity="moderate", evidence_level="high", mechanism="NSAIDs may reduce antihypertensive effect of ACE inhibitors", clinical_effects=["Reduced blood pressure control"], management="Monitor blood pressure", monitoring_parameters=["Blood pressure"]),
    DrugInteraction(id="INT-023", drug1_id="DRUG-010", drug2_id="DRUG-080", severity="moderate", evidence_level="high", mechanism="Thiazide diuretics may increase digoxin toxicity via hypokalemia", clinical_effects=["Digoxin toxicity"], management="Monitor potassium and digoxin levels", monitoring_parameters=["Serum potassium", "Digoxin level"]),
    DrugInteraction(id="INT-024", drug1_id="DRUG-005", drug2_id="DRUG-006", severity="moderate", evidence_level="moderate", mechanism="PPIs may reduce levothyroxine absorption", clinical_effects=["Reduced thyroid hormone levels"], management="Separate administration", monitoring_parameters=["TSH"]),
    DrugInteraction(id="INT-025", drug1_id="DRUG-040", drug2_id="DRUG-043", severity="high", evidence_level="moderate", mechanism="Multiple CNS depressants increase sedation and respiratory depression", clinical_effects=["Excessive sedation", "Respiratory depression"], management="Avoid combination or reduce doses", monitoring_parameters=["Respiratory rate", "Mental status"]),
    DrugInteraction(id="INT-026", drug1_id="DRUG-002", drug2="DRUG-030", severity="moderate", evidence_level="low", mechanism="Ciprofloxacin may increase metformin levels", clinical_effects=["Lactic acidosis risk"], management="Monitor for lactic acidosis symptoms", monitoring_parameters=["Lactate", "Renal function"]),
    DrugInteraction(id="INT-027", drug1_id="DRUG-011", drug2_id="DRUG-026", severity="moderate", evidence_level="moderate", mechanism="SSRIs may increase bleeding risk with warfarin", clinical_effects=["Increased bleeding"], management="Monitor INR", monitoring_parameters=["INR", "Signs of bleeding"]),
    DrugInteraction(id="INT-028", drug1_id="DRUG-004", drug2_id="DRUG-011", severity="low", evidence_level="low", mechanism="Amlodipine levels may be increased by SSRIs", clinical_effects=["Increased amlodipine effects"], management="Monitor blood pressure and edema", monitoring_parameters=["Blood pressure"]),
    DrugInteraction(id="INT-029", drug1_id="DRUG-081", drug2_id="DRUG-080", severity="high", evidence_level="high", mechanism="Amiodarone increases digoxin levels", clinical_effects=["Digoxin toxicity"], management="Reduce digoxin dose by 50%", monitoring_parameters=["Digoxin level", "Heart rate"]),
    DrugInteraction(id="INT-030", drug1_id="DRUG-016", drug2_id="DRUG-086", severity="moderate", evidence_level="moderate", mechanism="Loop diuretics may reduce iron absorption", clinical_effects=["Reduced iron efficacy"], management="Separate administration by 2 hours", monitoring_parameters=["Iron levels"]),
    DrugInteraction(id="INT-031", drug1_id="DRUG-035", drug2_id="DRUG-034", severity="moderate", evidence_level="moderate", mechanism="Beta blockers may mask hypoglycemia symptoms", clinical_effects=["Masked hypoglycemia"], management="Educate patient on hypoglycemia awareness", monitoring_parameters=["Blood glucose"]),
    DrugInteraction(id="INT-032", drug1_id="DRUG-006", drug2_id="DRUG-083", severity="moderate", evidence_level="moderate", mechanism="Antacids may reduce omeprazole absorption", clinical_effects=["Reduced PPI efficacy"], management="Separate administration by 2 hours", monitoring_parameters=["GERD symptoms"]),
    DrugInteraction(id="INT-033", drug1_id="DRUG-070", drug2_id="DRUG-011", severity="moderate", evidence_level="low", mechanism="Fluconazole may increase SSRI levels", clinical_effects=["Increased serotonergic effects"], management="Monitor for serotonin syndrome", monitoring_parameters=["Mental status"]),
    DrugInteraction(id="INT-034", drug1_id="DRUG-031", drug2_id="DRUG-070", severity="moderate", evidence_level="moderate", mechanism="Corticosteroids may antagonize antifungal effects", clinical_effects=["Reduced antifungal efficacy"], management="Monitor for treatment failure", monitoring_parameters=["Fungal infection symptoms"]),
    DrugInteraction(id="INT-035", drug1_id="DRUG-022", drug2_id="DRUG-006", severity="moderate", evidence_level="high", mechanism="PPIs may reduce clopidogrel effectiveness", clinical_effects=["Reduced antiplatelet effect"], management="Use pantoprazole or H2 blocker instead", monitoring_parameters=["Cardiovascular events"]),
    DrugInteraction(id="INT-036", drug1_id="DRUG-026", drug2_id="DRUG-005", severity="moderate", evidence_level="moderate", mechanism="Levothyroxine may increase warfarin effect", clinical_effects=["Increased INR"], management="Monitor INR when adjusting thyroid dose", monitoring_parameters=["INR"]),
    DrugInteraction(id="INT-037", drug1_id="DRUG-002", drug2_id="DRUG-016", severity="moderate", evidence_level="moderate", mechanism="Loop diuretics may worsen metformin-induced lactic acidosis", clinical_effects=["Lactic acidosis risk"], management="Monitor renal function", monitoring_parameters=["Serum creatinine", "Lactate"]),
    DrugInteraction(id="INT-038", drug1_id="DRUG-040", drug2_id="DRUG-075", severity="moderate", evidence_level="moderate", mechanism="Benzodiazepines with antihistamines increase sedation", clinical_effects=["Excessive sedation"], management="Avoid combination or reduce doses", monitoring_parameters=["Mental status"]),
    DrugInteraction(id="INT-039", drug1_id="DRUG-011", drug2_id="DRUG-072", severity="low", evidence_level="low", mechanism="SSRIs may increase serotonin levels with 5-HT3 antagonists", clinical_effects=["Serotonin syndrome (rare)"], management="Monitor for symptoms", monitoring_parameters=["Mental status"]),
    DrugInteraction(id="INT-040", drug1_id="DRUG-050", drug2_id="DRUG-001", severity="moderate", evidence_level="high", mechanism="NSAIDs may reduce ACE inhibitor effectiveness and increase renal risk", clinical_effects=["Reduced BP control", "Acute kidney injury"], management="Avoid NSAIDs; use acetaminophen", monitoring_parameters=["Blood pressure", "Serum creatinine"]),
    DrugInteraction(id="INT-041", drug1_id="DRUG-031", drug2_id="DRUG-028", severity="low", evidence_level="low", mechanism="Corticosteroids may reduce antibiotic effectiveness", clinical_effects=["Treatment failure (rare)"], management="Complete full antibiotic course", monitoring_parameters=["Infection symptoms"]),
    DrugInteraction(id="INT-042", drug1_id="DRUG-057", drug2_id="DRUG-004", severity="moderate", evidence_level="moderate", mechanism="Alpha blockers with calcium channel blockers increase hypotension risk", clinical_effects=["Orthostatic hypotension"], management="Monitor blood pressure, especially on standing", monitoring_parameters=["Blood pressure"]),
    DrugInteraction(id="INT-043", drug1_id="DRUG-063", drug2_id="DRUG-083", severity="moderate", evidence_level="high", mechanism="Tetracyclines chelate with calcium", clinical_effects=["Reduced antibiotic absorption"], management="Separate administration by 2-3 hours", monitoring_parameters=["Treatment efficacy"]),
    DrugInteraction(id="INT-044", drug1_id="DRUG-026", drug2_id="DRUG-063", severity="moderate", evidence_level="moderate", mechanism="Doxycycline may increase warfarin effect", clinical_effects=["Increased INR"], management="Monitor INR closely", monitoring_parameters=["INR"]),
    DrugInteraction(id="INT-045", drug1_id="DRUG-002", drug2_id="DRUG-083", severity="moderate", evidence_level="low", mechanism="Calcium may reduce metformin absorption", clinical_effects=["Reduced glucose control"], management="Separate administration", monitoring_parameters=["Blood glucose"]),
    DrugInteraction(id="INT-046", drug1_id="DRUG-035", drug2_id="DRUG-050", severity="moderate", evidence_level="moderate", mechanism="NSAIDs may reduce antihypertensive effect of beta blockers", clinical_effects=["Reduced BP control"], management="Monitor blood pressure", monitoring_parameters=["Blood pressure"]),
    DrugInteraction(id="INT-047", drug1_id="DRUG-001", drug2_id="DRUG-009", severity="low", evidence_level="low", mechanism="Combining two RAAS inhibitors increases hyperkalemia and renal risk", clinical_effects=["Hyperkalemia", "Acute kidney injury"], management="Generally avoid combination", monitoring_parameters=["Serum potassium", "Renal function"]),
    DrugInteraction(id="INT-048", drug1_id="DRUG-080", drug2_id="DRUG-004", severity="moderate", evidence_level="moderate", mechanism="Calcium channel blockers may increase digoxin levels", clinical_effects=["Digoxin toxicity"], management="Monitor digoxin levels", monitoring_parameters=["Digoxin level"]),
    DrugInteraction(id="INT-049", drug1_id="DRUG-011", drug2_id="DRUG-075", severity="moderate", evidence_level="low", mechanism="SSRIs with diphenhydramine increase serotonin and anticholinergic effects", clinical_effects=["Increased sedation", "Anticholinergic effects"], management="Monitor for adverse effects", monitoring_parameters=["Mental status"]),
    DrugInteraction(id="INT-050", drug1_id="DRUG-026", drug2_id="DRUG-029", severity="moderate", evidence_level="moderate", mechanism="Azithromycin may increase warfarin effect", clinical_effects=["Increased INR"], management="Monitor INR", monitoring_parameters=["INR"]),
]


async def seed_drugs(db: AsyncSession):
    """Insert drug data."""
    # Check if drugs already exist
    result = await db.execute(select(Drug).limit(1))
    existing = result.scalar_one_or_none()
    
    if existing:
        print("⚠ Drugs already exist. Skipping drug seeding.")
        return
    
    for drug in SEED_DRUGS:
        db.add(drug)
    await db.commit()
    print(f"✓ Seeded {len(SEED_DRUGS)} drugs")


async def seed_interactions(db: AsyncSession):
    """Insert interaction data."""
    # Check if interactions already exist
    result = await db.execute(select(DrugInteraction).limit(1))
    existing = result.scalar_one_or_none()
    
    if existing:
        print("⚠ Drug interactions already exist. Skipping interaction seeding.")
        return
    
    for interaction in SEED_INTERACTIONS:
        db.add(interaction)
    await db.commit()
    print(f"✓ Seeded {len(SEED_INTERACTIONS)} interactions")


async def run_seed():
    """Main seed function."""
    async with AsyncSessionLocal() as db:
        await seed_drugs(db)
        await seed_interactions(db)
    print("✓ Database seeding complete")


if __name__ == "__main__":
    asyncio.run(run_seed())
