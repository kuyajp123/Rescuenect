import { API_ENDPOINTS } from '@/config/endPoints';
import { GoogleButton } from '@/components/ui/button';
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
  FileCheck2,
  LifeBuoy,
  MapPinned,
  RadioTower,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const mainFeatures = [
  {
    title: 'Real-Time Emergency Reporting',
    description: 'Residents can submit reports about floods, hazards, accidents, or emergency situations in their area.',
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
    title: 'For Residents',
    description: 'Report emergencies, receive alerts, save locations, and stay updated during disasters.',
    icon: UsersRound,
  },
  {
    title: 'For Administrators',
    description: 'Manage reports, verify information, send announcements, and monitor community situations.',
    icon: ShieldCheck,
  },
  {
    title: 'For Responders or LGU Personnel',
    description: 'Use verified information to support faster decision-making and response.',
    icon: Building2,
  },
];

const keyBenefits = [
  'Faster emergency reporting',
  'Better coordination between residents and LGU',
  'Improved community awareness',
  'Support for disaster preparedness and response',
];

const trustPoints = [
  'Reports are reviewed by authorized administrators.',
  'Fake or misleading reports can be verified and resolved.',
  'User information is handled responsibly.',
  'The system supports safer communication during emergency situations.',
];

const navItems = [
  { label: 'About', href: '#about' },
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

const Login = () => {
  const userAuth = useAuth(state => state.auth);
  const accessIssue = useAuth(state => state.accessIssue);
  const isVerifying = useAuth(state => state.isVerifying);
  const error = useErrorStore(state => state.message);
  const setError = useErrorStore(state => state.setError);
  const [activeClients, setActiveClients] = useState<PublicLguClient[]>([]);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const appVersion = __APP_VERSION__;
  const visibleNavItems =
    activeClients.length > 0
      ? [...navItems.slice(0, 3), { label: 'LGUs', href: '#clients' }, ...navItems.slice(3)]
      : navItems;

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

  if (userAuth && accessIssue) {
    return <AccessUnavailable issue={accessIssue} />;
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-950 dark:bg-[#101419] dark:text-white">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="/images/map/map-light.png"
            alt=""
            className="h-full w-full object-cover opacity-70 dark:hidden"
          />
          <img
            src="/images/map/map-dark.png"
            alt=""
            className="hidden h-full w-full object-cover opacity-75 dark:block"
          />
          <div className="absolute inset-0 bg-[#07101f]/90" />
        </div>

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

      <section id="about" className="bg-white py-16 dark:bg-[#151a20]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <Chip color="primary" variant="flat">
              What is Rescuenect?
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              A clearer way for communities and responders to stay connected.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              Rescuenect is a disaster risk management system designed to help communities report emergencies, receive
              important alerts, and support faster response coordination between residents and administrators.
            </p>
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-default-200 bg-[#edf4f8] dark:border-white/10 dark:bg-[#101923]">
            <img src="/images/map/map-light.png" alt="" className="h-full min-h-[300px] w-full object-cover dark:hidden" />
            <img
              src="/images/map/map-dark.png"
              alt=""
              className="hidden h-full min-h-[300px] w-full object-cover opacity-90 dark:block"
            />
            <div className="absolute inset-0 bg-white/45 dark:bg-black/20" />
            <div className="absolute left-5 top-5 rounded-lg border border-white/70 bg-white/90 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#151a20]/90">
              <p className="text-xs font-semibold uppercase text-default-500">Community signal</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Live reports</p>
            </div>
            <div className="absolute bottom-5 right-5 rounded-lg border border-white/70 bg-white/90 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#151a20]/90">
              <p className="text-xs font-semibold uppercase text-default-500">Response view</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Verified updates</p>
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
              Rescuenect provides a straightforward platform for residents to report emergencies and for administrators to verify
              and manage information.
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

      <section id="roles" className="bg-[#eef3f7] py-16 dark:bg-[#101419]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <Chip color="primary" variant="flat">
              User Roles
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Designed for everyone involved in local safety.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              Rescuenect supports residents who report what is happening, administrators who verify information, and
              response teams that need trusted updates.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {userRoles.map(role => {
              const Icon = role.icon;

              return (
                <Card key={role.title} className="rounded-lg border border-default-200 shadow-none">
                  <CardBody className="flex-row items-start gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">{role.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-default-500">{role.description}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why" className="bg-white py-16 dark:bg-[#151a20]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Chip color="primary" variant="flat">
              Why Rescuenect Matters
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Better communication can change response outcomes.
            </h2>
            <p className="mt-4 text-base leading-7 text-default-500">
              During disasters, delayed communication and inaccurate reports can affect emergency response. Rescuenect
              helps improve information sharing by providing a centralized platform where residents and administrators
              can communicate more effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keyBenefits.map(benefit => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-lg border border-default-200 bg-[#f8fbfd] p-4 dark:border-white/10 dark:bg-[#101419]"
              >
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={20} />
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeClients.length > 0 && (
        <section id="clients" className="bg-[#eef3f7] py-16 dark:bg-[#101419]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Chip color="primary" variant="flat">
                  Current LGU Clients
                </Chip>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
                  Trusted by active LGUs using Rescuenect.
                </h2>
                <p className="mt-4 text-base leading-7 text-default-500">
                  These LGU clients are active in the Rescuenect backend and configured for community coverage.
                </p>
              </div>
              <div className="rounded-lg border border-default-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#151a20] dark:text-slate-200">
                {activeClients.length} active LGU {activeClients.length === 1 ? 'client' : 'clients'}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeClients.map(client => {
                const clientType = client.municipalityType === 'city' ? 'City' : 'Municipality';
                const barangayLabel = `${client.activeBarangayCount} active barangay${
                  client.activeBarangayCount === 1 ? '' : 's'
                }`;

                return (
                  <Card key={client.id} className="rounded-lg border border-default-200 shadow-none">
                    <CardBody className="gap-5 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-sky-400/15 dark:text-sky-200">
                          <Building2 size={23} />
                        </div>
                        <Chip size="sm" variant="flat">
                          {clientType}
                        </Chip>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{client.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-default-500">
                          {client.municipalityName}, {client.provinceName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-[#f8fbfd] px-3 py-2 text-sm font-medium text-slate-700 dark:bg-[#101419] dark:text-slate-200">
                        <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-300" />
                        {barangayLabel}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="trust" className="bg-[#0f1b2a] py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <Chip
              classNames={{
                base: 'border-white/20 bg-white/10 text-white',
                content: 'font-medium',
              }}
              variant="bordered"
            >
              Safety and Trust
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Built with Safety, Trust, and Accountability
            </h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              Rescuenect is designed with user privacy, report verification, and responsible data handling in mind.
              Submitted reports are reviewed by authorized personnel to help prevent fake or misleading information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trustPoints.map(point => (
              <div key={point} className="rounded-lg border border-white/10 bg-white/10 p-5">
                <ShieldCheck size={22} className="text-cyan-200" />
                <p className="mt-4 text-sm leading-6 text-white/80">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8f3ef] py-16 dark:bg-[#10201c]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <Chip className="bg-emerald-700 text-white dark:bg-emerald-300 dark:text-emerald-950" variant="flat">
              Get Started
            </Chip>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
              Be prepared before disaster happens.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Join Rescuenect and help build a safer, more connected community.
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
      </section>

      <footer id="contact" className="border-t border-default-200 bg-white py-10 dark:border-white/10 dark:bg-[#151a20]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 p-2">
                <img src="/images/logo/logo.svg" alt="Rescuenect logo" className="h-7 w-7" />
              </span>
              <span className="text-base font-semibold text-slate-950 dark:text-white">Rescuenect</span>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-6 text-default-500">
              A disaster risk management system for community resilience.
            </p>
            <p className="mt-2 text-sm text-default-500">
              Contact:{' '}
              <a className="font-medium text-primary hover:underline" href="mailto:reserveexample@gmail.com">
                reserveexample@gmail.com
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-default-500 sm:items-end">
            <div className="flex flex-wrap gap-4">
              <a className="transition hover:text-primary" href="#about">
                About Rescuenect
              </a>
              <a className="transition hover:text-primary" href="#features">
                Features
              </a>
              <a className="transition hover:text-primary" href="#contact">
                Contact
              </a>
              <Link className="transition hover:text-primary" to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>
              <Link className="transition hover:text-primary" to="/terms-and-condition" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </Link>
            </div>
            <p className="mt-3">
              &copy; {currentYear} Rescuenect {appVersion}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Login;
