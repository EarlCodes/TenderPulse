import { useState } from 'react';
import { provinces, cpvCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Tags, 
  MapPin, 
  Sliders, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  companyName: string;
  registrationNumber: string;
  bbbeeLevel: string;
  email: string;
  phone: string;
  selectedCPVs: string[];
  province: string;
  city: string;
  minValue: number;
  maxValue: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    registrationNumber: '',
    bbbeeLevel: '',
    email: '',
    phone: '',
    selectedCPVs: [],
    province: '',
    city: '',
    minValue: 100000,
    maxValue: 50000000,
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
  });

  const [selectedProvince, setSelectedProvince] = useState<typeof provinces[0] | null>(null);

  const steps = [
    { number: 1, title: 'Company Info', icon: Building2 },
    { number: 2, title: 'Categories', icon: Tags },
    { number: 3, title: 'Location', icon: MapPin },
    { number: 4, title: 'Preferences', icon: Sliders },
  ];

  const handleCPVToggle = (code: string) => {
    setData(prev => ({
      ...prev,
      selectedCPVs: prev.selectedCPVs.includes(code)
        ? prev.selectedCPVs.filter(c => c !== code)
        : [...prev.selectedCPVs, code]
    }));
  };

  const handleProvinceChange = (provinceCode: string) => {
    const province = provinces.find(p => p.code === provinceCode);
    setSelectedProvince(province || null);
    setData(prev => ({ ...prev, province: province?.name || '', city: '' }));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    }
    return `R${(value / 1000).toFixed(0)}K`;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.companyName && data.email;
      case 2:
        return data.selectedCPVs.length > 0;
      case 3:
        return data.province;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    wizard-step
                    ${step === s.number ? 'wizard-step-active' : ''}
                    ${step > s.number ? 'wizard-step-complete' : ''}
                    ${step < s.number ? 'wizard-step-pending' : ''}
                  `}>
                    {step > s.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-20 mx-2 mt-[-1.5rem] ${
                    step > s.number ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sm:p-8 animate-fade-in">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Tell us about your company</h2>
                <p className="text-muted-foreground">We'll use this to match you with relevant tenders.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={data.companyName}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    placeholder="e.g., 2019/123456/07"
                    value={data.registrationNumber}
                    onChange={(e) => setData({ ...data, registrationNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bbbee">B-BBEE Level</Label>
                  <Select value={data.bbbeeLevel} onValueChange={(v) => setData({ ...data, bbbeeLevel: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select B-BBEE level" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Non-compliant'].map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="procurement@company.co.za"
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 11 555 0123"
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: CPV Categories */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">What do you supply?</h2>
                <p className="text-muted-foreground">Select categories that match your products or services.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cpvCategories.map((category) => (
                  <div
                    key={category.code}
                    onClick={() => handleCPVToggle(category.code)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${data.selectedCPVs.includes(category.code)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5
                        ${data.selectedCPVs.includes(category.code)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                        }
                      `}>
                        {data.selectedCPVs.includes(category.code) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.selectedCPVs.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {data.selectedCPVs.map(code => {
                    const cat = cpvCategories.find(c => c.code === code);
                    return (
                      <Badge key={code} variant="secondary" className="cursor-pointer" onClick={() => handleCPVToggle(code)}>
                        {cat?.name} ×
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Where do you operate?</h2>
                <p className="text-muted-foreground">We'll prioritize tenders in your preferred regions.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Province *</Label>
                  <Select onValueChange={handleProvinceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(province => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProvince && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>City</Label>
                    <Select onValueChange={(v) => setData({ ...data, city: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvince.cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-accent/50 rounded-xl p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Pro Tip</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You can always change your location preferences later or add multiple regions in your profile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Value Range & Notifications */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Final preferences</h2>
                <p className="text-muted-foreground">Set your budget range and notification preferences.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Tender Value Range</Label>
                  <div className="px-2">
                    <Slider
                      value={[data.minValue, data.maxValue]}
                      min={50000}
                      max={100000000}
                      step={50000}
                      onValueChange={([min, max]) => setData({ ...data, minValue: min, maxValue: max })}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-primary">{formatCurrency(data.minValue)}</span>
                    <span className="text-muted-foreground">to</span>
                    <span className="font-medium text-primary">{formatCurrency(data.maxValue)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <Label>Notifications</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📧</span>
                        <div>
                          <p className="font-medium text-foreground">Email Alerts</p>
                          <p className="text-xs text-muted-foreground">Daily digest of matching tenders</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={data.emailNotifications}
                        onCheckedChange={(checked) => setData({ ...data, emailNotifications: !!checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📱</span>
                        <div>
                          <p className="font-medium text-foreground">SMS Alerts</p>
                          <p className="text-xs text-muted-foreground">Urgent tender notifications</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={data.smsNotifications}
                        onCheckedChange={(checked) => setData({ ...data, smsNotifications: !!checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💬</span>
                        <div>
                          <p className="font-medium text-foreground">WhatsApp</p>
                          <p className="text-xs text-muted-foreground">Real-time tender updates</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={data.whatsappNotifications}
                        onCheckedChange={(checked) => setData({ ...data, whatsappNotifications: !!checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {step === 4 ? 'Complete Setup' : 'Continue'}
              {step < 4 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
