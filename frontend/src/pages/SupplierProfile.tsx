import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { cpvCategories, provinces } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Tags, 
  Bell, 
  Save,
  Plus,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchSupplierProfile, updateSupplierProfile, fetchMetaCategories } from '@/lib/api';
import type { SupplierProfile as SupplierProfileType } from '@/types/tender';

const SupplierProfile = () => {
  const [profile, setProfile] = useState<SupplierProfileType | null>(null);
  const [newBuyer, setNewBuyer] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(
    cpvCategories.map(c => ({ code: c.code, name: c.name })),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchSupplierProfile();
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load supplier profile from backend');
        }
      }
    };
    load();

    // Load dynamic categories
    const loadCategories = async () => {
      try {
        const data = await fetchMetaCategories();
        if (Array.isArray(data) && data.length) {
          setCategoryOptions(data.map(name => ({ code: name, name })));
        }
      } catch {
        // ignore and keep static cpvCategories
      }
    };
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    }
    return `R${(value / 1000).toFixed(0)}K`;
  };

  const toggleCPV = (code: string) => {
    setProfile(prev =>
      prev
        ? {
            ...prev,
            preferredCPVs: prev.preferredCPVs.includes(code)
              ? prev.preferredCPVs.filter(c => c !== code)
              : [...prev.preferredCPVs, code],
          }
        : prev,
    );
  };

  const addBuyer = () => {
    if (!profile) return;
    if (newBuyer.trim() && !profile.preferredBuyers.includes(newBuyer.trim())) {
      setProfile(prev =>
        prev
          ? {
              ...prev,
              preferredBuyers: [...prev.preferredBuyers, newBuyer.trim()],
            }
          : prev,
      );
      setNewBuyer('');
    }
  };

  const removeBuyer = (buyer: string) => {
    setProfile(prev =>
      prev
        ? {
            ...prev,
            preferredBuyers: prev.preferredBuyers.filter(b => b !== buyer),
          }
        : prev,
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await updateSupplierProfile(profile);
      setProfile(updated);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm">Loading supplier profile…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supplier Profile</h1>
            <p className="text-muted-foreground">Manage your company details and preferences</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                <Check className="h-4 w-4" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Save className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={profile.registrationNumber}
                  onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>B-BBEE Level</Label>
                <Select 
                  value={profile.bbbeeLevel} 
                  onValueChange={(v) => setProfile({ ...profile, bbbeeLevel: v })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8'].map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Province</Label>
                      <Select
                        value={provinces.find(p => p.name === profile.province)?.code ?? ''}
                        onValueChange={code => {
                          const province = provinces.find(p => p.code === code);
                          setProfile({
                            ...profile,
                            province: province?.name ?? '',
                            city: '',
                          });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select province" />
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
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <Select
                        value={profile.city}
                        onValueChange={city => setProfile({ ...profile, city })}
                        disabled={!provinces.find(p => p.name === profile.province)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select city (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces
                            .find(p => p.name === profile.province)
                            ?.cities.map(city => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={
                        profile.city && profile.province
                          ? `${profile.city}, ${profile.province}`
                          : profile.province || profile.city || 'Not set'
                      }
                      disabled
                      className="pl-10"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferred Categories */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tags className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Preferred Categories</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryOptions.map((category) => (
                <div
                  key={category.code}
                  onClick={() => isEditing && toggleCPV(category.code)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${profile.preferredCPVs.includes(category.code)
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                    }
                    ${isEditing ? 'cursor-pointer hover:border-primary/50' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                      ${profile.preferredCPVs.includes(category.code)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                      }
                    `}>
                      {profile.preferredCPVs.includes(category.code) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Buyers */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Preferred Buyers</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.preferredBuyers.map((buyer) => (
                  <Badge key={buyer} variant="secondary" className="gap-1.5 py-1.5 px-3">
                    {buyer}
                    {isEditing && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeBuyer(buyer)}
                      />
                    )}
                  </Badge>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a preferred buyer..."
                    value={newBuyer}
                    onChange={(e) => setNewBuyer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBuyer()}
                  />
                  <Button onClick={addBuyer} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Value Range & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Value Range */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Tender Value Range</h2>
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={[profile.minValue, profile.maxValue]}
                    min={50000}
                    max={100000000}
                    step={50000}
                    onValueChange={([min, max]) => setProfile({ ...profile, minValue: min, maxValue: max })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-primary">{formatCurrency(profile.minValue)}</span>
                  <span className="text-muted-foreground">to</span>
                  <span className="font-medium text-primary">{formatCurrency(profile.maxValue)}</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📧</span>
                    <span className="text-sm font-medium">Email Alerts</span>
                  </div>
                  <Checkbox
                    checked={profile.emailNotifications}
                    onCheckedChange={(checked) => setProfile({ ...profile, emailNotifications: !!checked })}
                    disabled={!isEditing}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-medium">SMS Alerts</span>
                  </div>
                  <Checkbox
                    checked={profile.smsNotifications}
                    onCheckedChange={(checked) => setProfile({ ...profile, smsNotifications: !!checked })}
                    disabled={!isEditing}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>
                  <Checkbox
                    checked={profile.whatsappNotifications}
                    onCheckedChange={(checked) => setProfile({ ...profile, whatsappNotifications: !!checked })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupplierProfile;
