// Feedback submission dialog component

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'UI/UX Improvement',
  'Performance Issue',
  'Documentation',
  'Other',
];

export const FeedbackDialog = React.memo<FeedbackDialogProps>(({ open, onOpenChange }) => {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Simulated submission (will integrate with backend when ready)
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success('Thank you for your feedback!');
    setCategory('');
    setMessage('');
    setEmail('');
    setIsSubmitting(false);
    onOpenChange(false);
  }, [category, message, email, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Submit Feedback</DialogTitle>
          <DialogDescription className="text-xs">
            Help us improve MediTrack with your suggestions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              required
              rows={5}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              We'll only use this to follow up on your feedback
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs">
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

FeedbackDialog.displayName = 'FeedbackDialog';
