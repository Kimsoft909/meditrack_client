"""
Database seed data for patient records with vitals, medications, and visits.
Run with: python -m app.db.seed_patients
"""

import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.patient import Patient, PatientStatus, RiskLevel
from app.models.vital import Vital
from app.models.medication import Medication
from app.models.visit import Visit


# 60 diverse patient records
SEED_PATIENTS = [
    # Critical Risk Patients
    {
        "first_name": "Margaret", "last_name": "Thompson", "date_of_birth": date(1942, 3, 15),
        "age": 82, "sex": "F", "blood_type": "O+", "contact_number": "+1-555-0101",
        "email": "margaret.thompson@email.com", "address": "123 Oak Street, Springfield",
        "weight": 68.5, "height": 1.62, "bmi": 26.1, "status": "active", "risk_level": "critical",
        "allergies": "Penicillin, Sulfa drugs", "chronic_conditions": "Hypertension, Type 2 Diabetes, Atrial Fibrillation, Chronic Kidney Disease",
        "notes": "Requires close monitoring. Multiple comorbidities."
    },
    {
        "first_name": "Robert", "last_name": "Jenkins", "date_of_birth": date(1948, 7, 22),
        "age": 76, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0102",
        "email": "robert.jenkins@email.com", "address": "456 Pine Avenue, Riverside",
        "weight": 92.3, "height": 1.78, "bmi": 29.1, "status": "active", "risk_level": "critical",
        "allergies": "Aspirin, Latex", "chronic_conditions": "Coronary Artery Disease, COPD, Heart Failure",
        "notes": "Post-MI patient. Exercise limitations."
    },
    {
        "first_name": "Dorothy", "last_name": "Martinez", "date_of_birth": date(1945, 11, 8),
        "age": 79, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0103",
        "email": "dorothy.martinez@email.com", "address": "789 Maple Drive, Lakeside",
        "weight": 58.2, "height": 1.58, "bmi": 23.3, "status": "active", "risk_level": "critical",
        "allergies": "Iodine, Shellfish", "chronic_conditions": "Osteoporosis, Hypothyroidism, Chronic Kidney Disease Stage 4",
        "notes": "Fragile patient. Fall risk assessment needed."
    },
    {
        "first_name": "Charles", "last_name": "Anderson", "date_of_birth": date(1950, 2, 14),
        "age": 74, "sex": "M", "blood_type": "AB+", "contact_number": "+1-555-0104",
        "email": "charles.anderson@email.com", "address": "321 Birch Lane, Hillside",
        "weight": 85.7, "height": 1.75, "bmi": 28.0, "status": "active", "risk_level": "critical",
        "allergies": "None", "chronic_conditions": "Type 2 Diabetes, Hypertension, Peripheral Artery Disease, Neuropathy",
        "notes": "Diabetic foot care protocol in place."
    },
    {
        "first_name": "Helen", "last_name": "Wilson", "date_of_birth": date(1943, 9, 30),
        "age": 81, "sex": "F", "blood_type": "O-", "contact_number": "+1-555-0105",
        "email": "helen.wilson@email.com", "address": "654 Cedar Road, Brookville",
        "weight": 71.4, "height": 1.65, "bmi": 26.2, "status": "active", "risk_level": "critical",
        "allergies": "Penicillin, Eggs", "chronic_conditions": "Congestive Heart Failure, Atrial Fibrillation, Chronic Anemia",
        "notes": "Anticoagulation therapy. INR monitoring required."
    },
    
    # High Risk Patients
    {
        "first_name": "James", "last_name": "Brown", "date_of_birth": date(1955, 5, 12),
        "age": 69, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0106",
        "email": "james.brown@email.com", "address": "111 Elm Street, Greenfield",
        "weight": 88.9, "height": 1.80, "bmi": 27.4, "status": "active", "risk_level": "high",
        "allergies": "Sulfa drugs", "chronic_conditions": "Hypertension, Type 2 Diabetes, Hyperlipidemia",
        "notes": "Recently adjusted medication regimen."
    },
    {
        "first_name": "Patricia", "last_name": "Garcia", "date_of_birth": date(1958, 8, 25),
        "age": 66, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0107",
        "email": "patricia.garcia@email.com", "address": "222 Willow Way, Meadowbrook",
        "weight": 76.3, "height": 1.63, "bmi": 28.7, "status": "active", "risk_level": "high",
        "allergies": "Latex, Peanuts", "chronic_conditions": "Type 2 Diabetes, Hypothyroidism, Osteoarthritis",
        "notes": "Physical therapy ongoing for knee arthritis."
    },
    {
        "first_name": "Michael", "last_name": "Davis", "date_of_birth": date(1960, 1, 17),
        "age": 64, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0108",
        "email": "michael.davis@email.com", "address": "333 Spruce Street, Riverside",
        "weight": 95.2, "height": 1.82, "bmi": 28.7, "status": "active", "risk_level": "high",
        "allergies": "None", "chronic_conditions": "Hypertension, Hyperlipidemia, Sleep Apnea",
        "notes": "CPAP compliance monitored. Weight management program."
    },
    {
        "first_name": "Linda", "last_name": "Rodriguez", "date_of_birth": date(1957, 12, 3),
        "age": 67, "sex": "F", "blood_type": "A-", "contact_number": "+1-555-0109",
        "email": "linda.rodriguez@email.com", "address": "444 Ash Avenue, Lakewood",
        "weight": 82.1, "height": 1.68, "bmi": 29.1, "status": "active", "risk_level": "high",
        "allergies": "Penicillin, Aspirin", "chronic_conditions": "Hypertension, Type 2 Diabetes, Chronic Pain Syndrome",
        "notes": "Pain management consultation scheduled."
    },
    {
        "first_name": "William", "last_name": "Miller", "date_of_birth": date(1959, 6, 20),
        "age": 65, "sex": "M", "blood_type": "B-", "contact_number": "+1-555-0110",
        "email": "william.miller@email.com", "address": "555 Poplar Place, Clearview",
        "weight": 91.8, "height": 1.77, "bmi": 29.3, "status": "active", "risk_level": "high",
        "allergies": "Iodine", "chronic_conditions": "Coronary Artery Disease, Hypertension, Hyperlipidemia",
        "notes": "Cardiac rehab completed. Follow-up stress test due."
    },
    {
        "first_name": "Barbara", "last_name": "Wilson", "date_of_birth": date(1956, 4, 9),
        "age": 68, "sex": "F", "blood_type": "AB+", "contact_number": "+1-555-0111",
        "email": "barbara.wilson@email.com", "address": "666 Hickory Hill, Fairview",
        "weight": 69.5, "height": 1.60, "bmi": 27.1, "status": "active", "risk_level": "high",
        "allergies": "Shellfish", "chronic_conditions": "Rheumatoid Arthritis, Hypertension, Osteoporosis",
        "notes": "Rheumatology follow-up every 3 months."
    },
    {
        "first_name": "Richard", "last_name": "Moore", "date_of_birth": date(1961, 10, 15),
        "age": 63, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0112",
        "email": "richard.moore@email.com", "address": "777 Walnut Way, Mountainview",
        "weight": 87.6, "height": 1.79, "bmi": 27.3, "status": "active", "risk_level": "high",
        "allergies": "None", "chronic_conditions": "Type 2 Diabetes, Hypertension, Peripheral Neuropathy",
        "notes": "Diabetic foot exams quarterly."
    },
    {
        "first_name": "Susan", "last_name": "Taylor", "date_of_birth": date(1958, 7, 28),
        "age": 66, "sex": "F", "blood_type": "A+", "contact_number": "+1-555-0113",
        "email": "susan.taylor@email.com", "address": "888 Cherry Circle, Oakridge",
        "weight": 73.2, "height": 1.64, "bmi": 27.2, "status": "active", "risk_level": "high",
        "allergies": "Latex, Penicillin", "chronic_conditions": "Asthma, Hypertension, GERD",
        "notes": "Pulmonary function tests annually."
    },
    {
        "first_name": "Joseph", "last_name": "Anderson", "date_of_birth": date(1962, 3, 11),
        "age": 62, "sex": "M", "blood_type": "B+", "contact_number": "+1-555-0114",
        "email": "joseph.anderson@email.com", "address": "999 Magnolia Drive, Sunset",
        "weight": 93.7, "height": 1.83, "bmi": 28.0, "status": "active", "risk_level": "high",
        "allergies": "Sulfa drugs", "chronic_conditions": "Hypertension, Hyperlipidemia, Prediabetes",
        "notes": "Lifestyle modification program ongoing."
    },
    {
        "first_name": "Karen", "last_name": "Thomas", "date_of_birth": date(1960, 11, 5),
        "age": 64, "sex": "F", "blood_type": "O-", "contact_number": "+1-555-0115",
        "email": "karen.thomas@email.com", "address": "1010 Dogwood Lane, Pleasantville",
        "weight": 78.9, "height": 1.66, "bmi": 28.6, "status": "active", "risk_level": "high",
        "allergies": "Eggs, Peanuts", "chronic_conditions": "Type 2 Diabetes, Hypertension, Hypothyroidism",
        "notes": "Endocrinology follow-up scheduled."
    },
    
    # Moderate Risk Patients
    {
        "first_name": "Daniel", "last_name": "Jackson", "date_of_birth": date(1965, 2, 19),
        "age": 59, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0116",
        "email": "daniel.jackson@email.com", "address": "1111 Sycamore Street, Greenwood",
        "weight": 82.4, "height": 1.76, "bmi": 26.6, "status": "active", "risk_level": "moderate",
        "allergies": "None", "chronic_conditions": "Hypertension, Hyperlipidemia",
        "notes": "Good medication adherence."
    },
    {
        "first_name": "Nancy", "last_name": "White", "date_of_birth": date(1968, 9, 7),
        "age": 56, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0117",
        "email": "nancy.white@email.com", "address": "1212 Beech Boulevard, Lakeview",
        "weight": 70.8, "height": 1.62, "bmi": 27.0, "status": "active", "risk_level": "moderate",
        "allergies": "Penicillin", "chronic_conditions": "Hypothyroidism, Hypertension",
        "notes": "Thyroid levels stable."
    },
    {
        "first_name": "Matthew", "last_name": "Harris", "date_of_birth": date(1970, 5, 23),
        "age": 54, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0118",
        "email": "matthew.harris@email.com", "address": "1313 Redwood Road, Hillcrest",
        "weight": 86.3, "height": 1.81, "bmi": 26.3, "status": "active", "risk_level": "moderate",
        "allergies": "Latex", "chronic_conditions": "Hypertension, Hyperlipidemia",
        "notes": "Annual wellness exam due."
    },
    {
        "first_name": "Betty", "last_name": "Martin", "date_of_birth": date(1967, 12, 14),
        "age": 57, "sex": "F", "blood_type": "A-", "contact_number": "+1-555-0119",
        "email": "betty.martin@email.com", "address": "1414 Cypress Court, Riverside",
        "weight": 68.7, "height": 1.61, "bmi": 26.5, "status": "active", "risk_level": "moderate",
        "allergies": "Sulfa drugs", "chronic_conditions": "Type 2 Diabetes, Osteoarthritis",
        "notes": "Diabetes well-controlled with diet and exercise."
    },
    {
        "first_name": "Donald", "last_name": "Thompson", "date_of_birth": date(1972, 8, 2),
        "age": 52, "sex": "M", "blood_type": "AB-", "contact_number": "+1-555-0120",
        "email": "donald.thompson@email.com", "address": "1515 Fir Street, Brookside",
        "weight": 89.1, "height": 1.79, "bmi": 27.8, "status": "active", "risk_level": "moderate",
        "allergies": "None", "chronic_conditions": "Hypertension, Prediabetes",
        "notes": "Weight loss goal: 10kg in 6 months."
    },
    {
        "first_name": "Sandra", "last_name": "Garcia", "date_of_birth": date(1969, 4, 18),
        "age": 55, "sex": "F", "blood_type": "B-", "contact_number": "+1-555-0121",
        "email": "sandra.garcia@email.com", "address": "1616 Sequoia Avenue, Parkview",
        "weight": 75.6, "height": 1.65, "bmi": 27.8, "status": "active", "risk_level": "moderate",
        "allergies": "Aspirin", "chronic_conditions": "Hypertension, Migraine Disorder",
        "notes": "Migraine prophylaxis effective."
    },
    {
        "first_name": "Kenneth", "last_name": "Martinez", "date_of_birth": date(1971, 1, 25),
        "age": 53, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0122",
        "email": "kenneth.martinez@email.com", "address": "1717 Juniper Lane, Meadowview",
        "weight": 84.2, "height": 1.77, "bmi": 26.9, "status": "active", "risk_level": "moderate",
        "allergies": "Iodine", "chronic_conditions": "Hyperlipidemia, GERD",
        "notes": "Dietary modifications in progress."
    },
    {
        "first_name": "Donna", "last_name": "Robinson", "date_of_birth": date(1966, 10, 9),
        "age": 58, "sex": "F", "blood_type": "A+", "contact_number": "+1-555-0123",
        "email": "donna.robinson@email.com", "address": "1818 Hawthorn Circle, Fairfield",
        "weight": 72.3, "height": 1.63, "bmi": 27.2, "status": "active", "risk_level": "moderate",
        "allergies": "Shellfish", "chronic_conditions": "Hypothyroidism, Osteoporosis",
        "notes": "Bone density scan scheduled."
    },
    {
        "first_name": "Steven", "last_name": "Clark", "date_of_birth": date(1973, 6, 30),
        "age": 51, "sex": "M", "blood_type": "B+", "contact_number": "+1-555-0124",
        "email": "steven.clark@email.com", "address": "1919 Laurel Drive, Westwood",
        "weight": 87.9, "height": 1.80, "bmi": 27.1, "status": "active", "risk_level": "moderate",
        "allergies": "None", "chronic_conditions": "Hypertension, Sleep Apnea",
        "notes": "CPAP adherence improving."
    },
    {
        "first_name": "Carol", "last_name": "Lewis", "date_of_birth": date(1970, 3, 16),
        "age": 54, "sex": "F", "blood_type": "O-", "contact_number": "+1-555-0125",
        "email": "carol.lewis@email.com", "address": "2020 Cottonwood Way, Eastside",
        "weight": 69.4, "height": 1.60, "bmi": 27.1, "status": "active", "risk_level": "moderate",
        "allergies": "Latex, Eggs", "chronic_conditions": "Asthma, Allergic Rhinitis",
        "notes": "Seasonal allergy management."
    },
    {
        "first_name": "Paul", "last_name": "Walker", "date_of_birth": date(1974, 11, 21),
        "age": 50, "sex": "M", "blood_type": "A-", "contact_number": "+1-555-0126",
        "email": "paul.walker@email.com", "address": "2121 Alder Street, Northside",
        "weight": 90.7, "height": 1.82, "bmi": 27.4, "status": "active", "risk_level": "moderate",
        "allergies": "Penicillin", "chronic_conditions": "Hyperlipidemia, Hypertension",
        "notes": "Statin therapy initiated."
    },
    {
        "first_name": "Ruth", "last_name": "Hall", "date_of_birth": date(1968, 7, 12),
        "age": 56, "sex": "F", "blood_type": "AB+", "contact_number": "+1-555-0127",
        "email": "ruth.hall@email.com", "address": "2222 Buttonwood Avenue, Southside",
        "weight": 74.1, "height": 1.64, "bmi": 27.6, "status": "active", "risk_level": "moderate",
        "allergies": "Sulfa drugs", "chronic_conditions": "Hypothyroidism, Osteoarthritis",
        "notes": "Joint replacement consultation pending."
    },
    {
        "first_name": "Mark", "last_name": "Allen", "date_of_birth": date(1975, 2, 8),
        "age": 49, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0128",
        "email": "mark.allen@email.com", "address": "2323 Hickory Street, Valleyview",
        "weight": 83.8, "height": 1.78, "bmi": 26.5, "status": "active", "risk_level": "moderate",
        "allergies": "None", "chronic_conditions": "Hypertension, Hyperlipidemia",
        "notes": "Exercise program compliance good."
    },
    {
        "first_name": "Sharon", "last_name": "Young", "date_of_birth": date(1971, 9, 27),
        "age": 53, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0129",
        "email": "sharon.young@email.com", "address": "2424 Linden Lane, Highland",
        "weight": 71.9, "height": 1.62, "bmi": 27.4, "status": "active", "risk_level": "moderate",
        "allergies": "Iodine, Peanuts", "chronic_conditions": "Type 2 Diabetes, Hypertension",
        "notes": "HbA1c trending down."
    },
    {
        "first_name": "George", "last_name": "King", "date_of_birth": date(1972, 5, 14),
        "age": 52, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0130",
        "email": "george.king@email.com", "address": "2525 Buckeye Boulevard, Creekside",
        "weight": 88.5, "height": 1.81, "bmi": 27.0, "status": "active", "risk_level": "moderate",
        "allergies": "Latex", "chronic_conditions": "Hypertension, GERD",
        "notes": "PPI therapy effective."
    },
    
    # Low Risk Patients
    {
        "first_name": "Jessica", "last_name": "Wright", "date_of_birth": date(1985, 4, 3),
        "age": 39, "sex": "F", "blood_type": "O+", "contact_number": "+1-555-0131",
        "email": "jessica.wright@email.com", "address": "2626 Oakwood Drive, Rosewood",
        "weight": 62.4, "height": 1.68, "bmi": 22.1, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "Hypothyroidism",
        "notes": "Annual check-up. Overall healthy."
    },
    {
        "first_name": "Christopher", "last_name": "Lopez", "date_of_birth": date(1988, 6, 17),
        "age": 36, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0132",
        "email": "christopher.lopez@email.com", "address": "2727 Elmwood Court, Pinewood",
        "weight": 75.8, "height": 1.75, "bmi": 24.7, "status": "active", "risk_level": "low",
        "allergies": "Penicillin", "chronic_conditions": "Asthma (mild, controlled)",
        "notes": "Inhaler use as needed only."
    },
    {
        "first_name": "Amanda", "last_name": "Hill", "date_of_birth": date(1990, 1, 22),
        "age": 34, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0133",
        "email": "amanda.hill@email.com", "address": "2828 Maplewood Avenue, Cedarville",
        "weight": 58.9, "height": 1.65, "bmi": 21.7, "status": "active", "risk_level": "low",
        "allergies": "Latex", "chronic_conditions": "None",
        "notes": "Preventive care visit."
    },
    {
        "first_name": "Justin", "last_name": "Scott", "date_of_birth": date(1987, 11, 8),
        "age": 37, "sex": "M", "blood_type": "O-", "contact_number": "+1-555-0134",
        "email": "justin.scott@email.com", "address": "2929 Birchwood Lane, Ashwood",
        "weight": 79.2, "height": 1.80, "bmi": 24.4, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Sports physical clearance."
    },
    {
        "first_name": "Stephanie", "last_name": "Green", "date_of_birth": date(1992, 7, 29),
        "age": 32, "sex": "F", "blood_type": "A-", "contact_number": "+1-555-0135",
        "email": "stephanie.green@email.com", "address": "3030 Willowood Street, Lakewood",
        "weight": 61.7, "height": 1.70, "bmi": 21.3, "status": "active", "risk_level": "low",
        "allergies": "Shellfish", "chronic_conditions": "None",
        "notes": "Routine wellness visit."
    },
    {
        "first_name": "Eric", "last_name": "Adams", "date_of_birth": date(1989, 3, 5),
        "age": 35, "sex": "M", "blood_type": "B-", "contact_number": "+1-555-0136",
        "email": "eric.adams@email.com", "address": "3131 Pinewood Circle, Meadowlark",
        "weight": 82.6, "height": 1.83, "bmi": 24.7, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Excellent health status."
    },
    {
        "first_name": "Michelle", "last_name": "Baker", "date_of_birth": date(1991, 10, 18),
        "age": 33, "sex": "F", "blood_type": "AB+", "contact_number": "+1-555-0137",
        "email": "michelle.baker@email.com", "address": "3232 Cedarwood Way, Timberline",
        "weight": 59.3, "height": 1.63, "bmi": 22.3, "status": "active", "risk_level": "low",
        "allergies": "Penicillin", "chronic_conditions": "Migraine (occasional)",
        "notes": "Migraine frequency decreased."
    },
    {
        "first_name": "Ryan", "last_name": "Nelson", "date_of_birth": date(1986, 8, 24),
        "age": 38, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0138",
        "email": "ryan.nelson@email.com", "address": "3333 Ashwood Boulevard, Riverside",
        "weight": 77.4, "height": 1.78, "bmi": 24.4, "status": "active", "risk_level": "low",
        "allergies": "Sulfa drugs", "chronic_conditions": "None",
        "notes": "Active lifestyle maintained."
    },
    {
        "first_name": "Laura", "last_name": "Carter", "date_of_birth": date(1993, 2, 12),
        "age": 31, "sex": "F", "blood_type": "A+", "contact_number": "+1-555-0139",
        "email": "laura.carter@email.com", "address": "3434 Timberwood Drive, Oakmont",
        "weight": 64.8, "height": 1.69, "bmi": 22.7, "status": "active", "risk_level": "low",
        "allergies": "Eggs", "chronic_conditions": "None",
        "notes": "Prenatal care planning."
    },
    {
        "first_name": "Kevin", "last_name": "Mitchell", "date_of_birth": date(1984, 12, 6),
        "age": 40, "sex": "M", "blood_type": "B+", "contact_number": "+1-555-0140",
        "email": "kevin.mitchell@email.com", "address": "3535 Meadowwood Court, Hillview",
        "weight": 81.9, "height": 1.79, "bmi": 25.6, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Baseline wellness established."
    },
    {
        "first_name": "Nicole", "last_name": "Perez", "date_of_birth": date(1994, 5, 31),
        "age": 30, "sex": "F", "blood_type": "O-", "contact_number": "+1-555-0141",
        "email": "nicole.perez@email.com", "address": "3636 Lakewood Lane, Riverside",
        "weight": 57.2, "height": 1.64, "bmi": 21.3, "status": "active", "risk_level": "low",
        "allergies": "Latex, Peanuts", "chronic_conditions": "None",
        "notes": "Allergy management with avoidance."
    },
    {
        "first_name": "Brian", "last_name": "Roberts", "date_of_birth": date(1988, 9, 14),
        "age": 36, "sex": "M", "blood_type": "A-", "contact_number": "+1-555-0142",
        "email": "brian.roberts@email.com", "address": "3737 Forestwood Avenue, Greenfield",
        "weight": 84.3, "height": 1.82, "bmi": 25.4, "status": "active", "risk_level": "low",
        "allergies": "Iodine", "chronic_conditions": "None",
        "notes": "Regular exercise routine."
    },
    {
        "first_name": "Angela", "last_name": "Turner", "date_of_birth": date(1991, 4, 20),
        "age": 33, "sex": "F", "blood_type": "AB-", "contact_number": "+1-555-0143",
        "email": "angela.turner@email.com", "address": "3838 Ridgewood Street, Parkside",
        "weight": 60.1, "height": 1.66, "bmi": 21.8, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Nutrition counseling received."
    },
    {
        "first_name": "Jason", "last_name": "Phillips", "date_of_birth": date(1987, 1, 9),
        "age": 37, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0144",
        "email": "jason.phillips@email.com", "address": "3939 Valleyview Circle, Mountainside",
        "weight": 78.7, "height": 1.76, "bmi": 25.4, "status": "active", "risk_level": "low",
        "allergies": "Aspirin", "chronic_conditions": "None",
        "notes": "Cardiovascular fitness excellent."
    },
    {
        "first_name": "Sarah", "last_name": "Campbell", "date_of_birth": date(1995, 8, 26),
        "age": 29, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0145",
        "email": "sarah.campbell@email.com", "address": "4040 Summerview Drive, Crestwood",
        "weight": 63.5, "height": 1.71, "bmi": 21.7, "status": "active", "risk_level": "low",
        "allergies": "Shellfish", "chronic_conditions": "None",
        "notes": "Well-woman exam completed."
    },
    {
        "first_name": "Andrew", "last_name": "Parker", "date_of_birth": date(1986, 11, 13),
        "age": 38, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0146",
        "email": "andrew.parker@email.com", "address": "4141 Brookview Lane, Woodland",
        "weight": 80.4, "height": 1.80, "bmi": 24.8, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Occupational health clearance."
    },
    {
        "first_name": "Emily", "last_name": "Evans", "date_of_birth": date(1992, 6, 4),
        "age": 32, "sex": "F", "blood_type": "O-", "contact_number": "+1-555-0147",
        "email": "emily.evans@email.com", "address": "4242 Hillside Avenue, Sunset",
        "weight": 58.6, "height": 1.67, "bmi": 21.0, "status": "active", "risk_level": "low",
        "allergies": "Penicillin, Latex", "chronic_conditions": "None",
        "notes": "Allergy documentation updated."
    },
    {
        "first_name": "Joshua", "last_name": "Edwards", "date_of_birth": date(1989, 3, 19),
        "age": 35, "sex": "M", "blood_type": "B-", "contact_number": "+1-555-0148",
        "email": "joshua.edwards@email.com", "address": "4343 Creekside Court, Riverview",
        "weight": 83.1, "height": 1.84, "bmi": 24.6, "status": "active", "risk_level": "low",
        "allergies": "Sulfa drugs", "chronic_conditions": "None",
        "notes": "Marathon runner. Sports medicine follow-up."
    },
    {
        "first_name": "Ashley", "last_name": "Collins", "date_of_birth": date(1993, 10, 7),
        "age": 31, "sex": "F", "blood_type": "AB+", "contact_number": "+1-555-0149",
        "email": "ashley.collins@email.com", "address": "4444 Parkwood Street, Fairview",
        "weight": 61.9, "height": 1.68, "bmi": 21.9, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Yoga instructor. Excellent flexibility."
    },
    {
        "first_name": "Matthew", "last_name": "Stewart", "date_of_birth": date(1990, 7, 22),
        "age": 34, "sex": "M", "blood_type": "O+", "contact_number": "+1-555-0150",
        "email": "matthew.stewart@email.com", "address": "4545 Woodland Way, Greenwood",
        "weight": 76.8, "height": 1.77, "bmi": 24.5, "status": "active", "risk_level": "low",
        "allergies": "Iodine", "chronic_conditions": "None",
        "notes": "Travel medicine consultation completed."
    },
    {
        "first_name": "Jennifer", "last_name": "Sanchez", "date_of_birth": date(1994, 2, 15),
        "age": 30, "sex": "F", "blood_type": "A-", "contact_number": "+1-555-0151",
        "email": "jennifer.sanchez@email.com", "address": "4646 Riverside Drive, Clearwater",
        "weight": 59.8, "height": 1.65, "bmi": 22.0, "status": "active", "risk_level": "low",
        "allergies": "Eggs, Peanuts", "chronic_conditions": "None",
        "notes": "Dietary counseling for food allergies."
    },
    {
        "first_name": "David", "last_name": "Morris", "date_of_birth": date(1985, 12, 28),
        "age": 39, "sex": "M", "blood_type": "B+", "contact_number": "+1-555-0152",
        "email": "david.morris@email.com", "address": "4747 Lakeshore Boulevard, Bayview",
        "weight": 82.9, "height": 1.81, "bmi": 25.3, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Swimmer. Shoulder exam normal."
    },
    {
        "first_name": "Kimberly", "last_name": "Rogers", "date_of_birth": date(1991, 5, 11),
        "age": 33, "sex": "F", "blood_type": "O+", "contact_number": "+1-555-0153",
        "email": "kimberly.rogers@email.com", "address": "4848 Sunset Avenue, Oceanview",
        "weight": 62.7, "height": 1.69, "bmi": 22.0, "status": "active", "risk_level": "low",
        "allergies": "Latex", "chronic_conditions": "None",
        "notes": "Dermatology referral for routine screening."
    },
    {
        "first_name": "Thomas", "last_name": "Reed", "date_of_birth": date(1988, 9, 3),
        "age": 36, "sex": "M", "blood_type": "A+", "contact_number": "+1-555-0154",
        "email": "thomas.reed@email.com", "address": "4949 Mountain Road, Highlands",
        "weight": 79.6, "height": 1.79, "bmi": 24.8, "status": "active", "risk_level": "low",
        "allergies": "Penicillin", "chronic_conditions": "None",
        "notes": "Rock climber. No injuries reported."
    },
    {
        "first_name": "Elizabeth", "last_name": "Cook", "date_of_birth": date(1992, 4, 27),
        "age": 32, "sex": "F", "blood_type": "AB-", "contact_number": "+1-555-0155",
        "email": "elizabeth.cook@email.com", "address": "5050 Valley Road, Meadowbrook",
        "weight": 60.4, "height": 1.66, "bmi": 21.9, "status": "active", "risk_level": "low",
        "allergies": "Shellfish, Sulfa drugs", "chronic_conditions": "None",
        "notes": "Nutritionist consultation beneficial."
    },
    {
        "first_name": "Anthony", "last_name": "Morgan", "date_of_birth": date(1987, 1, 16),
        "age": 37, "sex": "M", "blood_type": "O-", "contact_number": "+1-555-0156",
        "email": "anthony.morgan@email.com", "address": "5151 Beach Boulevard, Seaside",
        "weight": 81.2, "height": 1.80, "bmi": 25.1, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Surfer. Water safety discussed."
    },
    {
        "first_name": "Melissa", "last_name": "Bell", "date_of_birth": date(1993, 8, 9),
        "age": 31, "sex": "F", "blood_type": "B+", "contact_number": "+1-555-0157",
        "email": "melissa.bell@email.com", "address": "5252 Harbor Drive, Portside",
        "weight": 57.9, "height": 1.64, "bmi": 21.5, "status": "active", "risk_level": "low",
        "allergies": "Aspirin", "chronic_conditions": "None",
        "notes": "Dancer. Musculoskeletal exam normal."
    },
    {
        "first_name": "Charles", "last_name": "Murphy", "date_of_birth": date(1986, 11, 24),
        "age": 38, "sex": "M", "blood_type": "A-", "contact_number": "+1-555-0158",
        "email": "charles.murphy@email.com", "address": "5353 Island Way, Coastline",
        "weight": 78.3, "height": 1.78, "bmi": 24.7, "status": "active", "risk_level": "low",
        "allergies": "Iodine, Latex", "chronic_conditions": "None",
        "notes": "Cyclist. Helmet safety reinforced."
    },
    {
        "first_name": "Lisa", "last_name": "Bailey", "date_of_birth": date(1994, 6, 12),
        "age": 30, "sex": "F", "blood_type": "O+", "contact_number": "+1-555-0159",
        "email": "lisa.bailey@email.com", "address": "5454 Shore Lane, Waterfront",
        "weight": 63.2, "height": 1.70, "bmi": 21.9, "status": "active", "risk_level": "low",
        "allergies": "None", "chronic_conditions": "None",
        "notes": "Teacher. Vocal health excellent."
    },
    {
        "first_name": "Daniel", "last_name": "Rivera", "date_of_birth": date(1989, 2, 5),
        "age": 35, "sex": "M", "blood_type": "AB+", "contact_number": "+1-555-0160",
        "email": "daniel.rivera@email.com", "address": "5555 Bay Street, Marina",
        "weight": 80.7, "height": 1.81, "bmi": 24.6, "status": "active", "risk_level": "low",
        "allergies": "Penicillin, Eggs", "chronic_conditions": "None",
        "notes": "Software engineer. Ergonomic assessment completed."
    },
]


async def seed_patients(db: AsyncSession):
    """Insert patient data with vitals, medications, and visits."""
    # Check if patients already exist
    result = await db.execute(select(Patient).limit(1))
    existing = result.scalar_one_or_none()
    
    if existing:
        print("⚠ Patients already exist. Skipping patient seeding.")
        return
    
    for patient_data in SEED_PATIENTS:
        # Create patient
        patient = Patient(**patient_data)
        db.add(patient)
        await db.flush()  # Get patient ID
        
        # Add 3-10 vital readings for each patient
        num_vitals = 3 if patient.risk_level == "low" else 10
        for i in range(num_vitals):
            days_ago = i * 7
            vital = Vital(
                patient_id=patient.id,
                timestamp=datetime.utcnow() - timedelta(days=days_ago),
                blood_pressure_systolic=110 + (i * 2) if patient.risk_level == "low" else 140 + (i * 3),
                blood_pressure_diastolic=70 + i if patient.risk_level == "low" else 85 + i,
                heart_rate=65 + (i * 2),
                temperature=36.5 + (i * 0.1),
                oxygen_saturation=97 + (i % 3),
                respiratory_rate=16.0 + (i * 0.5),
                blood_glucose=95.0 + (i * 5) if "Diabetes" not in patient.chronic_conditions else 130.0 + (i * 10),
                recorded_by="Nurse Johnson" if i % 2 == 0 else "Nurse Smith",
                notes="Routine vital signs" if i == 0 else None
            )
            db.add(vital)
        
        # Add 1-5 medications based on conditions
        if patient.chronic_conditions and patient.chronic_conditions != "None":
            conditions = patient.chronic_conditions.split(", ")
            for idx, condition in enumerate(conditions[:5]):
                med = Medication(
                    patient_id=patient.id,
                    name=f"Med-{condition.split()[0]}",
                    dosage=f"{10 * (idx + 1)}mg",
                    frequency="Once daily" if idx % 2 == 0 else "Twice daily",
                    route="oral",
                    prescribed_by=f"Dr. {['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][idx % 5]}",
                    start_date=date.today() - timedelta(days=30 * (idx + 1)),
                    is_active=True,
                    indication=condition,
                    notes="Continue as prescribed"
                )
                db.add(med)
        
        # Add 1-5 visits
        num_visits = 1 if patient.risk_level == "low" else 5
        for i in range(num_visits):
            visit = Visit(
                patient_id=patient.id,
                visit_date=datetime.utcnow() - timedelta(days=30 * i),
                visit_type=["routine", "follow-up", "emergency"][i % 3],
                department=["General Medicine", "Cardiology", "Endocrinology"][i % 3],
                provider=f"Dr. {['Smith', 'Johnson', 'Williams'][i % 3]}",
                chief_complaint="Routine checkup" if i == 0 else "Follow-up visit",
                diagnosis="Stable condition" if patient.risk_level in ["low", "moderate"] else "Requires monitoring",
                treatment="Continue current medications",
                notes="Patient counseled on medication adherence and lifestyle modifications."
            )
            db.add(visit)
    
    await db.commit()
    print(f"✓ Seeded {len(SEED_PATIENTS)} patients with vitals, medications, and visits")


async def run_seed():
    """Main seed function."""
    async with AsyncSessionLocal() as db:
        await seed_patients(db)
    print("✓ Patient database seeding complete")


if __name__ == "__main__":
    asyncio.run(run_seed())
