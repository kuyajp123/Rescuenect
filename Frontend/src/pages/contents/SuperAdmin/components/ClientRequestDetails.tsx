import type { ClientLgu, LguRequest } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime } from '@/pages/contents/SuperAdmin/utils';
import { Card, CardBody } from '@heroui/react';

type ClientRequestDetailsProps = {
  client: ClientLgu;
  request: LguRequest | null;
};

export const ClientRequestDetails = ({ client, request }: ClientRequestDetailsProps) => {
  const requesterDetails = [
    ['LGU Name', request?.lguName || client.name],
    ['Office or Department', request?.officeDepartment || 'Not provided'],
    ['Requester Name', request?.requesterName || 'Not provided'],
    ['Position', request?.requesterPosition || 'Not provided'],
    ['Email', request?.requesterEmail || 'Not provided'],
    ['Phone', request?.requesterPhone || 'Not provided'],
  ];
  const locationDetails = [
    ['Region', request?.regionName || client.regionName || 'Not provided'],
    ['Province', request?.provinceName || client.provinceName || 'Not provided'],
    ['Municipality or City', request?.municipalityName || client.municipalityName || 'Not provided'],
    ['Client Type', request?.municipalityType || client.municipalityType || client.type || 'municipality'],
    ['Barangays Verified', request?.barangaysVerified ? 'Yes' : request ? 'No' : 'Not recorded'],
    ['Submitted', formatDateTime(request?.createdAt)],
    ['Reviewed', formatDateTime(request?.reviewedAt)],
    ['Reviewed By', request?.reviewedBy || 'Not recorded'],
  ];

  return (
    <Card className="border border-default-200">
      <CardBody className="gap-4">
        <div>
          <h2 className="text-xl font-semibold">Request Details</h2>
          <p className="text-sm text-default-500">The original access request information saved during onboarding.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requesterDetails.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-default-100 p-3">
              <p className="text-xs text-default-500">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {locationDetails.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-default-100 p-3">
              <p className="text-xs text-default-500">{label}</p>
              <p className="font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-default-200 p-3">
            <p className="text-xs text-default-500">Notes</p>
            <p className="text-sm">{request?.notes || 'No notes provided.'}</p>
          </div>
          <div className="rounded-lg border border-default-200 p-3">
            <p className="text-xs text-default-500">Review Note</p>
            <p className="text-sm">{request?.reviewNote || 'No review note recorded.'}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
