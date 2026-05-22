import { API_ENDPOINTS } from '@/config/endPoints';
import { useAuth } from '@/stores/useAuth';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ClientLgu, LguRequest } from '@/pages/contents/SuperAdmin/types';
import { Card, CardBody } from '@heroui/react';
import { Activity, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export const SuperAdminOverview = () => {
  const userData = useAuth(state => state.userData);
  const { data: requestData } = useSuperFetch<{ requests: LguRequest[] }>(
    API_ENDPOINTS.SUPER_ADMIN.LGU_REQUESTS,
    'LGU requests'
  );
  const { data: clientData } = useSuperFetch<{ clients: ClientLgu[] }>(API_ENDPOINTS.SUPER_ADMIN.CLIENTS, 'clients');

  const summary = useMemo(() => {
    const requests = requestData?.requests ?? [];
    const clients = clientData?.clients ?? [];
    return {
      pendingRequests: requests.filter(item => item.status === 'pending').length,
      activeClients: clients.filter(item => item.status === 'active').length,
      draftClients: clients.filter(item => item.status === 'draft').length,
      inactiveClients: clients.filter(item => item.status === 'inactive').length,
    };
  }, [requestData, clientData]);

  const cards = [
    { label: 'Pending Requests', value: summary.pendingRequests, icon: Building2, to: '/super/requests' },
    { label: 'Active Clients', value: summary.activeClients, icon: CheckCircle2, to: '/super/clients' },
    { label: 'Draft Clients', value: summary.draftClients, icon: Activity, to: '/super/clients' },
    { label: 'Inactive Clients', value: summary.inactiveClients, icon: XCircle, to: '/super/clients' },
  ];

  return (
    <div className="w-full space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Overview</h1>
        <p className="text-sm text-default-500">Signed in as {userData?.email}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <Card key={card.label} as={Link} to={card.to} className="border border-default-200">
            <CardBody className="flex-row items-center justify-between">
              <div>
                <p className="text-sm text-default-500">{card.label}</p>
                <p className="text-3xl font-semibold">{card.value}</p>
              </div>
              <card.icon className="text-primary" size={28} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
