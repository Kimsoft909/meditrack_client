// Help and feedback component with user guides and support resources

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';
import { BookOpen, Video, FileText, MessageSquare, Mail, ExternalLink } from 'lucide-react';

const USER_GUIDES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: 'Learn the basics of MediTrack including navigation, dashboard overview, and initial setup.'
  },
  {
    id: 'managing-patients',
    title: 'Managing Patients',
    content: 'Add, edit, and organize patient records. Track vital signs, medical history, and visit details.'
  },
  {
    id: 'ai-analysis',
    title: 'Using AI Analysis',
    content: 'Generate comprehensive health reports using AI-powered analysis. Configure parameters and export reports.'
  },
  {
    id: 'drug-checker',
    title: 'Drug Interaction Checker',
    content: 'Check for potential drug interactions, view severity levels, and manage medication lists.'
  },
  {
    id: 'exporting-reports',
    title: 'Exporting Reports',
    content: 'Export patient data, analysis reports, and medical records in various formats (PDF, DOCX).'
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
                  <AccordionTrigger className="text-xs hover:no-underline">
                    {guide.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
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
