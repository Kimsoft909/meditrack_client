// Help and feedback component with user guides and support resources

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';
import { BookOpen, Video, FileText, MessageSquare, Mail, ExternalLink, Rocket, BarChart3, User, Lightbulb, Search, ClipboardList, Pill, AlertTriangle, Bot, MessageCircle, Target, Stethoscope, AlertCircle, Settings as SettingsIcon, Palette, Tag, Upload, Keyboard, Smartphone, Lock } from 'lucide-react';

const USER_GUIDES = [
  {
    id: 'getting-started',
    title: (
      <span className="flex items-center gap-2">
        <Rocket className="h-4 w-4" />
        Getting Started with MediTrack
      </span>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">
          Welcome to MediTrack! We've built this platform to help healthcare professionals like you manage patient care more effectively. 
          Let's get you up and running in just a few minutes.
        </p>
        
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Understanding Your Dashboard
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your dashboard is mission control. At the top, you'll see four key metrics that matter most:
          </p>
          <ul className="text-xs space-y-1.5 ml-4 text-muted-foreground">
            <li><strong className="text-foreground">Active Patients:</strong> Total patients currently under your care</li>
            <li><strong className="text-foreground">Critical Cases:</strong> Patients flagged as high-risk who need immediate attention</li>
            <li><strong className="text-foreground">Pending Reviews:</strong> Patients with recent vitals or visits awaiting your review</li>
            <li><strong className="text-foreground">Appointments:</strong> Scheduled visits for today and upcoming days</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary" />
            Adding Your First Patient
          </h4>
          <ol className="text-xs space-y-1.5 ml-4 text-muted-foreground list-decimal">
            <li>Click the <strong className="text-foreground">"Patients"</strong> tab in the sidebar</li>
            <li>Hit the <strong className="text-foreground">"Add Patient"</strong> button (top right)</li>
            <li>Fill in the essentials: name, date of birth, contact info</li>
            <li>Don't forget to add known allergies and chronic conditions—this helps prevent issues later</li>
          </ol>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong className="inline-flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" />
              Pro Tip:
            </strong> Start with one or two patients to familiarize yourself. You'll quickly see how everything connects—vitals, medications, visits, and AI insights all in one place.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'managing-patients',
    title: (
      <span className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4" />
        Managing Patients & Clinical Data
      </span>
    ),
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-primary" />
            Finding & Organizing Patients
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The patient directory is your searchable database. Use the search bar to find patients by name, or filter by status (Active, Inactive) 
            and risk level (Critical, High, Moderate, Low). The color-coded risk badges help you spot who needs attention fast.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
            Patient Profile Tabs
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each patient profile has four tabs that tell the complete story:
          </p>
          <ul className="text-xs space-y-2 ml-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">Overview:</strong> Quick snapshot—demographics, allergies, chronic conditions, current risk level, 
              and a summary of active medications
            </li>
            <li>
              <strong className="text-foreground">Vitals:</strong> Record and track heart rate, blood pressure, oxygen saturation, temperature, 
              blood glucose. Charts show trends over time so you can catch deterioration early
            </li>
            <li>
              <strong className="text-foreground">Treatment:</strong> Complete medication list with dosages, frequencies, start dates. 
              Easily add new prescriptions or mark medications as discontinued
            </li>
            <li>
              <strong className="text-foreground">History:</strong> Visit records with chief complaints, diagnoses, treatment plans, and provider notes. 
              Your clinical documentation lives here
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Pill className="h-3.5 w-3.5 text-primary" />
            Recording Vital Signs
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click <strong className="text-foreground">"Add Reading"</strong> in the Vitals tab. Enter measurements, and MediTrack automatically 
            flags abnormal values. The trend charts update in real-time—perfect for monitoring recovery or disease progression.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Best Practice:
            </strong> Always document allergies and chronic conditions upfront. This information feeds into the AI analysis
            and drug interaction checker, helping you avoid potentially dangerous prescribing errors.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'ai-tools',
    title: (
      <span className="flex items-center gap-2">
        <Bot className="h-4 w-4" />
        AI-Powered Clinical Tools
      </span>
    ),
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            AI Clinical Analysis
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Generate comprehensive, evidence-based reports in seconds. The AI analyzes vitals trends, medication regimens, visit history, 
            and chronic conditions to provide clinical insights, risk assessments, and actionable recommendations.
          </p>
          <div className="space-y-2 ml-4">
            <p className="text-xs font-medium text-foreground">How to use it:</p>
            <ol className="text-xs space-y-1.5 ml-4 text-muted-foreground list-decimal">
              <li>Go to <strong className="text-foreground">AI Analysis</strong> from the sidebar</li>
              <li>Select a patient from the dropdown</li>
              <li>Configure parameters: choose date range, analysis depth (Quick, Standard, Comprehensive)</li>
              <li>Click <strong className="text-foreground">"Generate Analysis"</strong> and watch the AI work in real-time</li>
              <li>Review the report sections: Clinical Summary, Risk Assessment, Vitals Analysis, Medication Review, Recommendations</li>
              <li>Export to PDF or DOCX for medical records or patient handouts</li>
            </ol>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            AI Medical Assistant (Chat)
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Think of this as having a medical reference at your fingertips. Ask about drug mechanisms, differential diagnoses, 
            treatment guidelines, or lab interpretation. The AI provides evidence-based responses with streaming answers so you get information fast.
          </p>
          <div className="space-y-2 ml-4">
            <p className="text-xs font-medium text-foreground">Effective questions to ask:</p>
            <ul className="text-xs space-y-1 ml-4 text-muted-foreground list-disc">
              <li>"What are the contraindications for lisinopril in elderly patients?"</li>
              <li>"Explain the mechanism of action of metformin"</li>
              <li>"What's the differential diagnosis for chest pain in a 45-year-old male?"</li>
              <li>"When should I order a troponin test?"</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong className="inline-flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              Remember:
            </strong> AI is a powerful assistant, but it's not a replacement for your clinical judgment.
            Always verify recommendations, consider patient-specific factors (age, comorbidities, preferences), and consult 
            authoritative sources for prescribing decisions. You're the doctor—AI just helps you work smarter.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'drug-safety',
    title: (
      <span className="flex items-center gap-2">
        <Pill className="h-4 w-4" />
        Drug Safety & Interaction Checker
      </span>
    ),
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            Checking Drug Interactions
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Before prescribing, always check for interactions. This tool analyzes drug-drug interactions based on clinical databases 
            and pharmaceutical literature, flagging potentially dangerous combinations.
          </p>
          <div className="space-y-2 ml-4">
            <p className="text-xs font-medium text-foreground">How it works:</p>
            <ol className="text-xs space-y-1.5 ml-4 text-muted-foreground list-decimal">
              <li>Go to <strong className="text-foreground">Drug Checker</strong> in the sidebar</li>
              <li>Search and add medications (you need at least 2)</li>
              <li>Click <strong className="text-foreground">"Check Interactions"</strong> (or press Ctrl+Enter)</li>
              <li>Review results sorted by severity</li>
            </ol>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-primary" />
            Understanding Severity Levels
          </h4>
          <ul className="text-xs space-y-2 ml-4 text-muted-foreground">
            <li>
              <strong className="text-red-600">CONTRAINDICATED:</strong> Do not prescribe together. The risk of serious adverse events 
              (death, hospitalization) outweighs any benefit. Find an alternative immediately.
            </li>
            <li>
              <strong className="text-orange-600">MAJOR:</strong> Potentially life-threatening or causing permanent damage. 
              Only use if benefits clearly outweigh risks, and monitor closely.
            </li>
            <li>
              <strong className="text-yellow-600">MODERATE:</strong> May cause clinically significant effects. 
              Consider alternatives, dose adjustments, or increased monitoring.
            </li>
            <li>
              <strong className="text-green-600">MINOR:</strong> Limited clinical significance. Usually safe, but document awareness.
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            FDA Drug Lookup
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Switch to the <strong className="text-foreground">"Drug Lookup"</strong> tab to search the FDA database. 
            Get detailed information: indications, dosing, warnings, mechanism of action, pharmacokinetics. Great for refreshing 
            your knowledge or looking up unfamiliar medications.
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Clinical Decision Support:
            </strong> This tool provides evidence-based guidance, but it's not exhaustive.
            Always consider patient-specific factors: age, renal/hepatic function, pregnancy status, pharmacogenomics. 
            When in doubt, consult a pharmacist or specialist. Your clinical judgment is irreplaceable.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'advanced-features',
    title: (
      <span className="flex items-center gap-2">
        <SettingsIcon className="h-4 w-4" />
        Advanced Features & Customization
      </span>
    ),
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-primary" />
            Personalizing Your Experience
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MediTrack adapts to your preferences. Go to <strong className="text-foreground">Settings</strong> to customize:
          </p>
          <ul className="text-xs space-y-1.5 ml-4 text-muted-foreground list-disc">
            <li><strong className="text-foreground">Theme:</strong> Switch between light, dark, or system-matched themes to reduce eye strain</li>
            <li><strong className="text-foreground">Typography:</strong> Choose font family and size for optimal readability during long shifts</li>
            <li><strong className="text-foreground">Notifications:</strong> Control in-app and email alerts for critical cases and pending reviews</li>
            <li><strong className="text-foreground">Security:</strong> Change password, review active sessions, manage account security</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Understanding Risk Levels
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MediTrack automatically calculates patient risk based on vitals, medications, chronic conditions, and recent changes:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground list-disc">
            <li><strong className="text-red-600">Critical:</strong> Requires immediate intervention. Review urgently.</li>
            <li><strong className="text-orange-600">High:</strong> Close monitoring needed. Prioritize in your workflow.</li>
            <li><strong className="text-yellow-600">Moderate:</strong> Stable but requires regular follow-up.</li>
            <li><strong className="text-green-600">Low:</strong> Stable, routine care sufficient.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Upload className="h-3.5 w-3.5 text-primary" />
            Exporting & Sharing
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Export AI analysis reports as PDF (for printing/EMR) or DOCX (for editing). Perfect for referral letters, 
            patient handouts, or medical record documentation. All exports are HIPAA-aware and include only the information you select.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Keyboard className="h-3.5 w-3.5 text-primary" />
            Keyboard Shortcuts
          </h4>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground list-disc">
            <li><strong className="text-foreground">Ctrl+Enter:</strong> Quick-check interactions in Drug Checker</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            Mobile vs Desktop
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MediTrack works on any device. The interface adapts: charts stack vertically on mobile, tables become scrollable, 
            and touch-friendly buttons make data entry easy on tablets during rounds.
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-xs text-foreground">
            <strong className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              Your Data is Secure:
            </strong> All patient data is encrypted in transit and at rest. We follow HIPAA guidelines
            for data protection. You control access—no one sees your patient information without your permission.
          </p>
        </div>
      </div>
    )
  },
];

const RESOURCES = [
  { icon: Video, label: 'Video Tutorials', url: '#', description: 'Watch step-by-step guides' },
  { icon: FileText, label: 'API Documentation', url: '#', description: 'Technical integration docs' },
  { icon: BookOpen, label: 'FAQs', url: '#', description: 'Frequently asked questions' },
];

export const HelpAndFeedback = React.memo(() => {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const openFeedbackDialog = useCallback(() => setFeedbackDialogOpen(true), []);

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Guides</CardTitle>
            <CardDescription className="text-xs">
              Learn how to use MediTrack features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {USER_GUIDES.map((guide) => (
                <AccordionItem key={guide.id} value={guide.id}>
                  <AccordionTrigger className="text-xs hover:no-underline font-medium">
                    {guide.title}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {guide.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resources</CardTitle>
            <CardDescription className="text-xs">
              Additional learning materials and documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {RESOURCES.map((resource) => {
              const Icon = resource.icon;
              return (
                <a
                  key={resource.label}
                  href={resource.url}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{resource.label}</p>
                      <p className="text-[10px] text-muted-foreground">{resource.description}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                </a>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact Support</CardTitle>
            <CardDescription className="text-xs">
              Get help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium">Email Support</p>
                <a href="mailto:support@meditrack.com" className="text-xs text-primary hover:underline">
                  support@meditrack.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium mb-1">Send Feedback</p>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Share your thoughts and suggestions to help us improve
                </p>
                <Button size="sm" variant="outline" onClick={openFeedbackDialog} className="text-xs">
                  Submit Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
    </>
  );
});

HelpAndFeedback.displayName = 'HelpAndFeedback';
