import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '@/components/OnboardingWizard';
import { toast } from 'sonner';
import { updateSupplierProfile } from '@/lib/api';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = async (data: {
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
  }) => {
    try {
      await updateSupplierProfile({
        companyName: data.companyName,
        registrationNumber: data.registrationNumber,
        bbbeeLevel: data.bbbeeLevel,
        email: data.email,
        phone: data.phone,
        province: data.province,
        city: data.city,
        preferredCPVs: data.selectedCPVs,
        preferredBuyers: [],
        minValue: data.minValue,
        maxValue: data.maxValue,
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        whatsappNotifications: data.whatsappNotifications,
      });
      toast.success('Profile setup complete! Welcome to TenderPulseZA');
      navigate('/');
    } catch (error) {
      toast.error('Failed to save your profile. Please try again.');
    }
  };

  return <OnboardingWizard onComplete={handleComplete} />;
};

export default Onboarding;
