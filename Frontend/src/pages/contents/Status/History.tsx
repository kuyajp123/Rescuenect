import { SecondaryButton } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const StatusHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <SecondaryButton onClick={() => navigate('/status')} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Status
        </SecondaryButton>
        <h1 className="text-2xl font-bold">Status History</h1>
      </div>

      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-xl mb-4">Status History</h2>
        <p className="text-gray-600 mb-4">
          This page will show historical status records including expired and deleted statuses.
        </p>
        <p className="text-sm text-gray-500">
          Feature coming soon - will display status versions, timeline, and audit trail.
        </p>
      </div>
    </div>
  );
};
