import { GoogleButton } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/endPoints';
import { ThemeSwitcher } from '@/hooks/ThemeSwitcher';
import { AccessUnavailable } from '@/security/AccessUnavailable';
import { useAuth } from '@/stores/useAuth';
import { useErrorStore } from '@/stores/useErrorMessage';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import axios from 'axios';
import {
  Activity,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileCheck2,
  LifeBuoy,
  MapPinned,
  QrCode,
  RadioTower,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const mainFeatures = [
  {
    title: 'Real-Time Emergency Reporting',
    description:
      'Residents can submit reports about floods, hazards, accidents, or emergency situations in their area.',
    icon: Activity,
    tone: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
  },
  {
    title: 'Disaster Alerts and Notifications',
    description: 'Users can receive important updates, warnings, and announcements from authorized administrators.',
    icon: BellRing,
    tone: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
  },
  {
    title: 'Location-Based Reports',
    description: 'Reports can include location details to help responders identify affected areas faster.',
    icon: MapPinned,
    tone: 'bg-primary/10 text-primary dark:bg-sky-400/15 dark:text-sky-200',
  },
  {
    title: 'Admin Monitoring Dashboard',
    description: 'Administrators can view, verify, manage, and resolve reports through a centralized dashboard.',
    icon: ClipboardList,
    tone: 'bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200',
  },
  {
    title: 'Community Status Updates',
    description: 'Residents can share status updates to help others stay informed about current conditions.',
    icon: UsersRound,
    tone: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
  },
  {
    title: 'Evacuation Center Guidance',
    description: 'Communities can access evacuation center information to support safer movement during emergencies.',
    icon: LifeBuoy,
    tone: 'bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200',
  },
];

const howItWorks = [
  {
    step: 'Step 1',
    title: 'Report',
    description: 'Residents submit emergency reports or status updates.',
    icon: Activity,
  },
  {
    step: 'Step 2',
    title: 'Verify',
    description: 'Administrators review and verify submitted information.',
    icon: FileCheck2,
  },
  {
    step: 'Step 3',
    title: 'Respond',
    description: 'The community receives alerts, updates, and coordinated response information.',
    icon: RadioTower,
  },
];

const userRoles = [
  {
    title: 'Residents',
    description: 'Report incidents, receive alerts, and check community updates.',
    icon: UsersRound,
  },
  {
    title: 'Administrators',
    description: 'Review reports, publish updates, and monitor active cases.',
    icon: ShieldCheck,
  },
  {
    title: 'LGU Teams',
    description: 'Use verified updates for local response planning.',
    icon: Building2,
  },
];

const whyHighlights = [
  {
    label: 'One shared view',
    value: 'Reports, alerts, and resident status stay organized.',
  },
  {
    label: 'Less noise',
    value: 'Teams can focus on verified updates and urgent cases.',
  },
];

const trustPoints = [
  {
    title: 'Administrator review',
    description: 'Submitted reports move through a clear review flow.',
  },
  {
    title: 'Role-based access',
    description: 'Users see the tools that match their responsibility.',
  },
  {
    title: 'Status visibility',
    description: 'Reports can be tracked from submitted to resolved.',
  },
];

const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Mobile App', href: '#mobile-app' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Trust', href: '#trust' },
  { label: 'Contact', href: '#contact' },
];

type PublicLguClient = {
  id: string;
  name: string;
  type: 'municipality' | 'city';
  provinceName: string;
  municipalityName: string;
  municipalityType: 'municipality' | 'city';
  activeBarangayCount: number;
};

type PublicMobileAppRelease = {
  available: boolean;
  platform: 'android';
  version: string | null;
  buildNumber: string | null;
  buildProfile: string | null;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  completedAt: string | null;
  downloadUrl: string | null;
  publicUrl: string | null;
};

const unavailableMobileAppRelease: PublicMobileAppRelease = {
  available: false,
  platform: 'android',
  version: null,
  buildNumber: null,
  buildProfile: null,
  fileName: null,
  fileSize: null,
  uploadedAt: null,
  completedAt: null,
  downloadUrl: null,
  publicUrl: null,
};

const Login = () => {
  const userAuth = useAuth(state => state.auth);
  const accessIssue = useAuth(state => state.accessIssue);
  const isVerifying = useAuth(state => state.isVerifying);
  const error = useErrorStore(state => state.message);
  const setError = useErrorStore(state => state.setError);
  const [activeClients, setActiveClients] = useState<PublicLguClient[]>([]);
  const [mobileAppRelease, setMobileAppRelease] = useState<PublicMobileAppRelease | null>(null);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const appVersion = __APP_VERSION__;
  const visibleNavItems =
    activeClients.length > 0
      ? navItems.flatMap(item => (item.href === '#how-it-works' ? [item, { label: 'LGUs', href: '#clients' }] : [item]))
      : navItems;
  const mobileAppDownloadUrl =
    mobileAppRelease?.available && mobileAppRelease.downloadUrl ? mobileAppRelease.downloadUrl : null;
  const mobileAppQrSrc = mobileAppDownloadUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(
        mobileAppDownloadUrl
      )}`
    : null;
  const mobileAppVersionLabel = mobileAppRelease?.version
    ? `Latest ${mobileAppRelease.version}${mobileAppRelease.buildNumber ? ` (build ${mobileAppRelease.buildNumber})` : ''}`
    : mobileAppDownloadUrl
      ? 'Latest Android APK'
      : 'APK not published yet';

  useEffect(() => {
    if (userAuth && !isVerifying && !accessIssue) {
      navigate('/');
    }
  }, [userAuth, isVerifying, accessIssue, navigate]);

  useEffect(() => {
    return () => {
      setError('');
    };
  }, [setError]);

  useEffect(() => {
    let isActive = true;

    axios
      .get<{ clients: PublicLguClient[] }>(API_ENDPOINTS.PUBLIC.CLIENTS)
      .then(response => {
        if (!isActive) return;
        setActiveClients(response.data.clients || []);
      })
      .catch(() => {
        if (!isActive) return;
        setActiveClients([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    axios
      .get<{ release: PublicMobileAppRelease }>(API_ENDPOINTS.PUBLIC.MOBILE_APP_LATEST)
      .then(response => {
        if (!isActive) return;
        setMobileAppRelease(response.data.release || unavailableMobileAppRelease);
      })
      .catch(() => {
        if (!isActive) return;
        setMobileAppRelease(unavailableMobileAppRelease);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (userAuth && accessIssue) {
    return <AccessUnavailable issue={accessIssue} />;
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-950 dark:bg-[#101419] dark:text-white">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#0b2338_46%,#123b35_100%)] text-white">
        <div
          className="absolute inset-0 bg-[linear-gradient(115deg,rgba(14,165,233,0.18)_0%,rgba(20,184,166,0.08)_48%,rgba(16,185,129,0.18)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04)_0%,rgba(2,6,23,0.26)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[76svh] max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 py-3">
            <a className="flex items-center gap-3" href="#top" aria-label="Rescuenect home">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/95 p-2 shadow-lg shadow-black/20">
                <img src="/images/logo/logo.svg" alt="Rescuenect logo" className="h-8 w-8" />
              </span>
              <span className="text-lg font-semibold sm:text-xl">Rescuenect</span>
            </a>

            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="hidden items-center gap-5 text-sm font-medium text-white/80 lg:flex mr-5">
                {visibleNavItems.map(item => (
                  <a key={item.href} className="transition hover:text-white" href={item.href}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <ThemeSwitcher />
            </div>
          </header>

          <div id="top" className="flex min-w-0 flex-1 items-center py-10 lg:py-14">
            <div className="w-full min-w-0 max-w-4xl">
              <span className="inline-flex max-w-full rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium leading-5 text-white backdrop-blur">
                Built for community resilience and disaster preparedness
              </span>

              <h1 className="mt-5 w-full max-w-4xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Stay Informed. Report Emergencies. Respond Faster.
              </h1>

              <p className="mt-5 w-full max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                Rescuenect helps communities, residents, and local responders communicate quickly during disasters
                through real-time reports, alerts, and emergency coordination.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <GoogleButton
                  label="Login"
                  loadingLabel="Opening Google..."
                  className="h-12 w-full min-w-[168px] rounded-lg border-0 bg-white px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 data-[hover=true]:bg-white/90 sm:w-auto dark:bg-white dark:text-slate-950 dark:data-[hover=true]:bg-white/90"
                />
                <Button
                  as={Link}
                  to="/request-access"
                  className="h-12 w-full rounded-lg border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white data-[hover=true]:bg-white/15 sm:w-auto"
                  endContent={<ChevronRight size={18} />}
                  variant="bordered"
                >
                  Request Access
                </Button>
              </div>

              {error && (
                <div className="mt-4 w-full max-w-xl rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="overflow-hidden bg-white py-16 dark:bg-[#151a20]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Chip color="primary" variant="flat">
              What is Rescuenect?
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              A clearer way for communities and responders to stay connected.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
            <div className="max-w-xl">
              <p className="text-base leading-7 text-default-500 sm:text-lg">
                Rescuenect is a disaster risk management system designed to help communities report emergencies, receive
                important alerts, and support faster response coordination between residents and administrators.
              </p>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 rounded-xl bg-gradient-to-br from-primary/25 via-emerald-400/20 to-cyan-400/25 blur-2xl dark:from-sky-500/25 dark:via-emerald-400/15 dark:to-cyan-300/20 sm:-inset-5"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-lg border border-default-200 bg-[#f7fbfd] p-2 shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-[#0b111a] dark:shadow-cyan-950/40">
                <div className="aspect-[16/9] overflow-hidden rounded-md bg-[#0d1724]">
                  <img
                    src="/images/screens/dashboard.png"
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                    alt="Rescuenect admin dashboard preview"
                    className="h-full w-full object-fit dark:hidden no-drag select-none"
                  />
                  <img
                    src="/images/screens/dark-dashboard.png"
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                    alt="Rescuenect admin dashboard preview"
                    className="hidden h-full w-full object-fit dark:block no-drag select-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#eef3f7] py-16 dark:bg-[#101419]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Chip color="primary" variant="flat">
              Main Features
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Simple tools for reporting, alerting, and monitoring.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              Rescuenect provides a straightforward platform for residents to report emergencies and for administrators
              to verify and manage information.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mainFeatures.map(feature => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="rounded-lg border border-default-200 shadow-none">
                  <CardBody className="gap-4 p-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.tone}`}>
                      <Icon size={23} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-default-500">{feature.description}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16 dark:bg-[#151a20]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Chip className="bg-slate-900 text-white dark:bg-white dark:text-slate-950" variant="flat">
              How It Works
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              A straightforward flow from report to response.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {howItWorks.map(item => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="rounded-lg border border-default-200 shadow-none">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-sky-400/15 dark:text-sky-200">
                        <Icon size={23} />
                      </div>
                      <span className="text-sm font-semibold text-default-400">{item.step}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-default-500">{item.description}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-[#eef3f7] py-24 dark:bg-[#101419]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-xl">
            <Chip color="primary" variant="flat">
              User Roles
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Clear tools for each part of the response.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              Each user group gets a focused experience, so reporting, review, and coordination stay easy to follow.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-default-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
            {userRoles.map(role => {
              const Icon = role.icon;

              return (
                <div
                  key={role.title}
                  className="flex items-start gap-4 border-b border-default-200 p-5 last:border-b-0 dark:border-white/10 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">{role.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-default-500">{role.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why" className="bg-white py-24 dark:bg-[#151a20]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
          <div className="max-w-2xl">
            <Chip color="primary" variant="flat">
              Why Rescuenect Matters
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Built for clearer local response.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              During incidents, communities need a dependable place to see what is happening and what needs attention.
            </p>
          </div>

          <div className="rounded-lg border border-default-200 bg-[#f8fbfd] p-6 dark:border-white/10 dark:bg-[#101419] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-sky-400/15 dark:text-sky-200">
                <RadioTower size={23} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                  From scattered updates to one queue.
                </h3>
                <p className="mt-2 text-sm leading-6 text-default-500">
                  Reports, announcements, and status updates stay easier to review.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {whyHighlights.map(item => (
                <div key={item.label} className="border-l-2 border-primary/50 pl-4 dark:border-sky-300/50">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-default-500">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {activeClients.length > 0 && (
        <section id="clients" className="bg-[#eef3f7] py-24 dark:bg-[#101419]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div className="max-w-xl">
              <div>
                <Chip color="primary" variant="flat">
                  Current LGU Clients
                </Chip>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
                  Active LGU coverage.
                </h2>
                <p className="mt-4 text-base leading-7 text-default-500">
                  Live LGU clients pulled from the Rescuenect backend.
                </p>
              </div>
              <div className="mt-6 inline-flex rounded-lg border border-default-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#151a20] dark:text-slate-200">
                {activeClients.length} active LGU {activeClients.length === 1 ? 'client' : 'clients'}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-default-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
              {activeClients.map(client => {
                const clientType = client.municipalityType === 'city' ? 'City' : 'Municipality';
                const barangayLabel = `${client.activeBarangayCount} barangay${
                  client.activeBarangayCount === 1 ? '' : 's'
                }`;

                return (
                  <div
                    key={client.id}
                    className="grid gap-4 border-b border-default-200 p-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-sky-400/15 dark:text-sky-200">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-950 dark:text-white">{client.name}</h3>
                        <p className="mt-1 text-sm leading-6 text-default-500">
                          {client.municipalityName}, {client.provinceName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span className="rounded-full bg-default-100 px-3 py-1 text-xs font-semibold text-default-600 dark:bg-white/10 dark:text-white/70">
                        {clientType}
                      </span>
                      <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                        <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-300" />
                        {barangayLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="trust" className="bg-[#0f1b2a] py-24 text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div className="max-w-xl">
            <Chip
              classNames={{
                base: 'border-white/20 bg-white/10 text-white',
                content: 'font-medium',
              }}
              variant="bordered"
            >
              Safety and Trust
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Simple safeguards for emergency data.</h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              Rescuenect keeps report handling structured, role-aware, and easier to audit.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-6 sm:p-7">
            {trustPoints.map(point => (
              <div
                key={point.title}
                className="flex gap-4 border-b border-white/10 py-5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{point.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8f3ef] py-24 dark:bg-[#10201c]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 border-y border-emerald-900/10 py-10 dark:border-emerald-200/10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Chip className="bg-emerald-700 text-white dark:bg-emerald-300 dark:text-emerald-950" variant="flat">
                Get Started
              </Chip>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
                Start with Rescuenect.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
                Sign in or request LGU access.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <GoogleButton
                label="Login with Google"
                loadingLabel="Opening Google..."
                className="h-12 min-w-[188px] rounded-lg border-0 bg-primary px-6 text-sm font-semibold text-white data-[hover=true]:bg-primary/90 dark:bg-sky-500 dark:text-white dark:data-[hover=true]:bg-sky-400"
              />
              <Button
                as={Link}
                to="/request-access"
                className="h-12 rounded-lg px-6 text-sm font-semibold"
                endContent={<ChevronRight size={18} />}
                variant="bordered"
              >
                Request Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="overflow-hidden bg-[#07111f] text-white">
        <div id="mobile-app" className="relative border-b border-white/10 py-14">
          <div
            className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.16)_0%,rgba(20,184,166,0.08)_48%,rgba(16,185,129,0.14)_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-6 top-10 h-80 rounded-[2rem] bg-[linear-gradient(100deg,rgba(56,189,248,0.12),rgba(45,212,191,0.09),rgba(52,211,153,0.12))] blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="order-1 lg:order-2">
              <Chip
                classNames={{
                  base: 'border-white/20 bg-white/10 text-white',
                  content: 'font-medium',
                }}
                variant="bordered"
              >
                Mobile App
              </Chip>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">
                Scan the QR code to download the resident app.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                Residents can install the latest Android APK, report emergencies, check announcements, and stay
                connected from their phone.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {mobileAppDownloadUrl ? (
                  <Button
                    as="a"
                    href={mobileAppDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950"
                    startContent={<Download size={18} />}
                  >
                    Download APK
                  </Button>
                ) : (
                  <Button
                    isDisabled
                    className="h-11 rounded-lg bg-white/70 px-5 text-sm font-semibold text-slate-950"
                    startContent={<Download size={18} />}
                  >
                    APK not available yet
                  </Button>
                )}
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                  {mobileAppVersionLabel}
                </span>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
                <div className="rounded-lg border border-white/10 bg-white p-3 shadow-2xl shadow-sky-950/40">
                  {mobileAppQrSrc ? (
                    <img
                      src={mobileAppQrSrc}
                      alt="QR code to download the Rescuenect Android APK"
                      className="h-36 w-36 rounded-md object-contain sm:h-40 sm:w-40"
                    />
                  ) : (
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-md bg-slate-100 text-slate-400 sm:h-40 sm:w-40">
                      <QrCode size={64} strokeWidth={1.5} />
                      <span className="mt-2 text-xs font-semibold text-slate-500">Publish APK</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                    <QrCode size={17} />
                    {mobileAppDownloadUrl ? 'Scan latest APK' : 'Waiting for APK'}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200">
                        <Smartphone size={20} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Built for residents</h3>
                        <p className="mt-1 text-sm leading-6 text-white/70">
                          Quick access to status reporting, community feed, contacts, and evacuation information.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200">
                        <Download size={20} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Android APK access</h3>
                        <p className="mt-1 text-sm leading-6 text-white/70">
                          {mobileAppDownloadUrl
                            ? 'Scan the QR code or use the download button to install the current APK.'
                            : 'The download link will appear here after the next successful EAS APK build.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2 relative min-h-[420px] lg:order-1">
              <div
                className="absolute inset-x-4 top-20 h-64 rounded-[2rem] bg-[linear-gradient(115deg,rgba(14,165,233,0.2),rgba(45,212,191,0.12),rgba(16,185,129,0.18))] blur-3xl"
                aria-hidden="true"
              />
              <img
                src="/images/screens/slanted-app-community.webp"
                draggable={false}
                onDragStart={e => e.preventDefault()}
                alt="Rescuenect mobile community status preview"
                className="absolute left-[12%] top-16 hidden w-[100%] scale-y-[1.24] scale-x-[1.24] select-none rounded-[2rem] opacity-90 drop-shadow-2xl lg:block dark:hidden"
              />
              <img
                src="/images/screens/dark-slanted-app-community.png"
                draggable={false}
                onDragStart={e => e.preventDefault()}
                alt="Rescuenect mobile community status preview"
                className="absolute left-[18%] top-16 hidden w-[95%] scale-y-[1.20] scale-x-[1.14] select-none rounded-[2rem] opacity-90 drop-shadow-2xl dark:lg:block"
              />
              <img
                src="/images/screens/app-home.png"
                draggable={false}
                onDragStart={e => e.preventDefault()}
                alt="Rescuenect mobile home screen preview"
                className="relative z-10 mx-auto h-[380px] scale-x-[1.14] transform-gpu select-none object-contain drop-shadow-2xl sm:h-[450px] lg:ml-2 lg:mr-0 dark:hidden"
              />
              <img
                src="/images/screens/dark-app-home.png"
                draggable={false}
                onDragStart={e => e.preventDefault()}
                alt="Rescuenect mobile home screen preview"
                className="relative z-10 mx-auto hidden h-[380px] scale-x-[0.94] transform-gpu select-none object-contain drop-shadow-2xl sm:h-[420px] lg:ml-2 lg:mr-0 dark:block"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/95 p-2 shadow-lg shadow-black/20">
                <img src="/images/logo/logo.svg" alt="Rescuenect logo" className="h-8 w-8" />
              </span>
              <span className="text-lg font-semibold">Rescuenect</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
              A disaster risk management system for community resilience, emergency reporting, and faster local
              coordination.
            </p>
            <p className="mt-4 text-sm text-white/60">
              Contact:{' '}
              <a
                className="font-medium text-sky-200 transition hover:text-white"
                href="mailto:reserveexample@gmail.com"
              >
                reserveexample@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/60">
              <a className="transition hover:text-white" href="#about">
                About Rescuenect
              </a>
              <a className="transition hover:text-white" href="#mobile-app">
                Mobile App
              </a>
              <a className="transition hover:text-white" href="#features">
                Features
              </a>
              <a className="transition hover:text-white" href="#how-it-works">
                How It Works
              </a>
              <a className="transition hover:text-white" href="#trust">
                Safety and Trust
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/60">
              <Link className="transition hover:text-white" to="/request-access">
                Request Access
              </Link>
              <Link
                className="transition hover:text-white"
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
              <Link
                className="transition hover:text-white"
                to="/terms-and-condition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Use
              </Link>
              <a className="transition hover:text-white" href="#contact">
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>
              &copy; {currentYear} Rescuenect {appVersion}. All rights reserved.
            </p>
            <p>Built for safer, more connected communities.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Login;
