// Typography settings component for font family and size control

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { FontFamily, FontSize } from '@/types/settings';
import { loadFont } from '@/utils/fontManager';
import { toast } from 'sonner';

export const TypographySettings = React.memo(() => {
  const { settings, updateTypography } = useSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customScale, setCustomScale] = useState(1);

  const handleFontFamilyChange = useCallback(async (value: string) => {
    const fontFamily = value as FontFamily;
    await loadFont(fontFamily);
    updateTypography({ fontFamily });
    toast.success('Font family updated');
  }, [updateTypography]);

  const handleFontSizeChange = useCallback((value: string) => {
    updateTypography({ fontSize: value as FontSize });
    toast.success('Font size updated');
  }, [updateTypography]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Font Family</CardTitle>
          <CardDescription className="text-xs">
            Choose the typeface used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.typography.fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FontFamily.CAMBRIA} className="text-xs">
                <span style={{ fontFamily: 'Cambria' }}>Cambria (System)</span>
              </SelectItem>
              <SelectItem value={FontFamily.INTER} className="text-xs">
                <span style={{ fontFamily: 'Inter' }}>Inter</span>
              </SelectItem>
              <SelectItem value={FontFamily.ROBOTO} className="text-xs">
                <span style={{ fontFamily: 'Roboto' }}>Roboto</span>
              </SelectItem>
              <SelectItem value={FontFamily.OPEN_SANS} className="text-xs">
                <span style={{ fontFamily: 'Open Sans' }}>Open Sans</span>
              </SelectItem>
              <SelectItem value={FontFamily.SOURCE_SANS} className="text-xs">
                <span style={{ fontFamily: 'Source Sans Pro' }}>Source Sans Pro</span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="mt-4 p-3 rounded-lg border border-border bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Preview</p>
            <p className="text-sm" style={{ fontFamily: settings.typography.fontFamily }}>
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-xs mt-1" style={{ fontFamily: settings.typography.fontFamily }}>
              0123456789 - Medical abbreviations: BP, HR, RR, SpO2
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Font Size</CardTitle>
          <CardDescription className="text-xs">
            Adjust the overall text size throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={settings.typography.fontSize} onValueChange={handleFontSizeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FontSize.SMALL} id="small" />
              <Label htmlFor="small" className="text-xs font-normal cursor-pointer">
                Small - Compact display
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FontSize.MEDIUM} id="medium" />
              <Label htmlFor="medium" className="text-xs font-normal cursor-pointer">
                Medium - Balanced (default)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FontSize.LARGE} id="large" />
              <Label htmlFor="large" className="text-xs font-normal cursor-pointer">
                Large - Enhanced readability
              </Label>
            </div>
          </RadioGroup>

          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="font-medium">Advanced Font Size</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Custom Scale</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {customScale.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[customScale]}
                  onValueChange={([value]) => {
                    setCustomScale(value);
                    const root = document.documentElement;
                    root.style.setProperty('--font-scale', value.toString());
                    toast.success('Custom font scale applied');
                  }}
                  min={0.75}
                  max={1.25}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Smallest (0.75x)</span>
                  <span>Largest (1.25x)</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TypographySettings.displayName = 'TypographySettings';
