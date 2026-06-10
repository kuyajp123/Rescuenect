import {
  askForPermissionAndGetToken,
  getDesktopNotificationPreference,
  revokeToken,
  setDesktopNotificationPreference,
} from '@/config/notificationPermission';
import { saveFCMtoken } from '@/helper/commonHelpers';
import { MobileApkReleasePanel } from '@/pages/contents/Settings/MobileApkReleasePanel';
import { useAuth } from '@/stores/useAuth';
import { useMapStyleStore } from '@/stores/useMapStyleStore';
import { Card, CardBody, CardHeader, Chip, Divider, Radio, RadioGroup, Switch, addToast } from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { BellRing, ChevronRight, FileText, Map, Moon, Scale, Shield, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'rescuenect_map_style';

type SettingsSectionId = 'appearance' | 'map-style' | 'system-notifications' | 'mobile-release' | 'legal';

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
};

const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
};

const Settings = () => {
  const authUser = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const updateUserData = useAuth(state => state.updateUserData);
  const { theme, setTheme } = useTheme();
  const { styleUrl, setMapStyle } = useMapStyleStore();
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>('light');
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance');
  const [isDesktopNotificationsEnabled, setIsDesktopNotificationsEnabled] = useState(false);
  const [isSavingNotificationPreference, setIsSavingNotificationPreference] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    getBrowserNotificationPermission()
  );
  const isSuperAdmin = userData?.role === 'super_admin';
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const settingsSections = useMemo<SettingsSection[]>(
    () => [
      { id: 'appearance', label: 'Appearance' },
      { id: 'map-style', label: 'Map Style' },
      { id: 'system-notifications', label: 'System Notifications' },
      ...(isSuperAdmin ? [{ id: 'mobile-release' as const, label: 'Mobile App' }] : []),
      { id: 'legal', label: 'Legal' },
    ],
    [isSuperAdmin]
  );

  useEffect(() => {
    const savedStyle = localStorage.getItem(STORAGE_KEY);
    if (savedStyle) {
      setSelectedMapStyle(savedStyle);
    } else if (styleUrl.includes('alidade_smooth_dark')) {
      setSelectedMapStyle('dark');
    } else {
      setSelectedMapStyle('light');
    }
  }, [styleUrl]);

  useEffect(() => {
    setIsDesktopNotificationsEnabled(getDesktopNotificationPreference(Boolean(userData?.fcmToken)));
    setNotificationPermission(getBrowserNotificationPermission());
  }, [userData?.fcmToken]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visibleSection = entries
          .filter(entry => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];

        if (visibleSection?.target.id) {
          setActiveSection(visibleSection.target.id as SettingsSectionId);
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0.12, 0.35, 0.6],
      }
    );

    settingsSections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [settingsSections]);

  const scrollToSection = (sectionId: SettingsSectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleMapStyleChange = (value: string) => {
    setSelectedMapStyle(value);

    if (value === 'light') {
      setMapStyle(
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      );
    } else {
      setMapStyle(
        'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      );
    }

    localStorage.setItem(STORAGE_KEY, value);
  };

  const handleDesktopNotificationsChange = async (enabled: boolean) => {
    if (!authUser) {
      addToast({ title: 'Sign in required', description: 'Please sign in again to update this setting.', color: 'warning' });
      return;
    }

    setIsSavingNotificationPreference(true);

    try {
      if (enabled) {
        if (!VAPID_KEY) {
          throw new Error('Notification configuration is missing.');
        }

        if (
          getBrowserNotificationPermission() === 'unsupported' ||
          typeof navigator === 'undefined' ||
          !('serviceWorker' in navigator)
        ) {
          addToast({
            title: 'Notifications unavailable',
            description: 'This browser does not support system notifications.',
            color: 'warning',
          });
          return;
        }

        const fcmToken = await askForPermissionAndGetToken(VAPID_KEY);
        setNotificationPermission(getBrowserNotificationPermission());

        if (!fcmToken) {
          setDesktopNotificationPreference(false);
          setIsDesktopNotificationsEnabled(false);
          addToast({
            title: 'Notifications not enabled',
            description: 'Browser notification permission was not granted.',
            color: 'warning',
          });
          return;
        }

        await saveFCMtoken(fcmToken, authUser);
        setDesktopNotificationPreference(true);
        updateUserData({ fcmToken });
        setIsDesktopNotificationsEnabled(true);
        addToast({ title: 'System notifications enabled', color: 'success' });
        return;
      }

      await revokeToken();
      await saveFCMtoken(null, authUser);
      setDesktopNotificationPreference(false);
      updateUserData({ fcmToken: null });
      setIsDesktopNotificationsEnabled(false);
      setNotificationPermission(getBrowserNotificationPermission());
      addToast({ title: 'System notifications disabled', color: 'success' });
    } catch (error) {
      addToast({
        title: 'Notification setting failed',
        description: error instanceof Error ? error.message : 'Failed to update notification preference.',
        color: 'danger',
      });
      setIsDesktopNotificationsEnabled(getDesktopNotificationPreference(Boolean(userData?.fcmToken)));
    } finally {
      setIsSavingNotificationPreference(false);
    }
  };

  return (
    <div className="w-full px-4 pb-6 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1160px] gap-6 lg:grid-cols-[220px_minmax(0,820px)]">
        <aside className="self-start lg:sticky lg:top-4">
          <Card className="border border-default-200 shadow-sm">
            <CardBody className="gap-1 p-2">
              <p className="px-3 py-2 text-sm font-semibold text-default-700">Settings</p>
              <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {settingsSections.map(section => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-200 lg:w-full ${
                        isActive
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-default-600 hover:bg-default-100 hover:text-default-900'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full transition-colors ${
                          isActive ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                      <span className="whitespace-nowrap">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardBody>
          </Card>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="mb-2">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Customize your Rescuenect experience</p>
          </div>

          <section id="appearance" className="scroll-mt-24">
            <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
              <CardHeader className="flex gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sun size={20} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Appearance</p>
                  <p className="text-small text-default-500">Choose your interface theme</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="gap-4 overflow-hidden py-6">
                <RadioGroup
                  value={theme}
                  onValueChange={handleThemeChange}
                  classNames={{
                    wrapper: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
                  }}
                >
                  <Radio
                    value="light"
                    classNames={{
                      base: 'm-0 w-full max-w-none cursor-pointer items-center justify-between gap-4 rounded-lg border-2 border-transparent bg-content1 p-4 transition-all hover:bg-content2 data-[selected=true]:border-primary',
                      wrapper: 'hidden',
                    }}
                  >
                    <div className="flex w-full items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30">
                        <Sun size={24} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="text-base font-semibold">Light Mode</p>
                        <p className="text-tiny text-default-500">Bright and clear interface</p>
                      </div>
                      {theme === 'light' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </Radio>

                  <Radio
                    value="dark"
                    classNames={{
                      base: 'm-0 w-full max-w-none cursor-pointer items-center justify-between gap-4 rounded-lg border-2 border-transparent bg-content1 p-4 transition-all hover:bg-content2 data-[selected=true]:border-primary',
                      wrapper: 'hidden',
                    }}
                  >
                    <div className="flex w-full items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                        <Moon size={24} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="text-base font-semibold">Dark Mode</p>
                        <p className="text-tiny text-default-500">Easy on the eyes</p>
                      </div>
                      {theme === 'dark' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </Radio>
                </RadioGroup>
              </CardBody>
            </Card>
          </section>

          <section id="map-style" className="scroll-mt-24">
            <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
              <CardHeader className="flex gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Map size={20} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Map Style</p>
                  <p className="text-small text-default-500">Choose your preferred map appearance</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="gap-4 overflow-hidden py-6">
                <RadioGroup
                  value={selectedMapStyle}
                  onValueChange={handleMapStyleChange}
                  classNames={{
                    wrapper: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
                  }}
                >
                  <Radio
                    value="light"
                    classNames={{
                      base: 'm-0 w-full max-w-none cursor-pointer gap-3 rounded-lg border-2 border-transparent bg-content1 p-4 transition-all hover:bg-content2 data-[selected=true]:border-primary',
                      wrapper: 'hidden',
                    }}
                  >
                    <div className="flex w-full flex-col gap-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
                        <img src="/images/map/map-light.png" alt="Light Map Style" className="h-full w-full object-cover" />
                        {selectedMapStyle === 'light' && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                            <div className="h-2.5 w-2.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                          <Sun size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <p className="text-base font-semibold">Light Style</p>
                          <p className="text-tiny text-default-500">Standard OpenStreetMap</p>
                        </div>
                      </div>
                    </div>
                  </Radio>

                  <Radio
                    value="dark"
                    classNames={{
                      base: 'm-0 w-full max-w-none cursor-pointer gap-3 rounded-lg border-2 border-transparent bg-content1 p-4 transition-all hover:bg-content2 data-[selected=true]:border-primary',
                      wrapper: 'hidden',
                    }}
                  >
                    <div className="flex w-full flex-col gap-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
                        <img src="/images/map/map-dark.png" alt="Dark Map Style" className="h-full w-full object-cover" />
                        {selectedMapStyle === 'dark' && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                            <div className="h-2.5 w-2.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30">
                          <Moon size={20} className="text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <p className="text-base font-semibold">Dark Style</p>
                          <p className="text-tiny text-default-500">Smooth dark theme</p>
                        </div>
                      </div>
                    </div>
                  </Radio>
                </RadioGroup>

                <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-start gap-2 text-xs text-default-600">
                    <Map size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>Map style will be applied to all maps throughout the application</span>
                  </p>
                </div>
              </CardBody>
            </Card>
          </section>

          <section id="system-notifications" className="scroll-mt-24">
            <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
              <CardHeader className="flex gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BellRing size={20} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">System Notifications</p>
                  <p className="text-small text-default-500">Choose whether this computer receives push alerts</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="gap-4 py-6">
                <div className="flex flex-col gap-4 rounded-lg bg-content1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold">Desktop push notifications</p>
                    <p className="mt-1 text-sm text-default-500">In-app notifications remain available.</p>
                  </div>
                  <Switch
                    aria-label="Toggle desktop push notifications"
                    isSelected={isDesktopNotificationsEnabled}
                    isDisabled={isSavingNotificationPreference || !authUser}
                    onValueChange={value => void handleDesktopNotificationsChange(value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip color={isDesktopNotificationsEnabled ? 'success' : 'default'} variant="flat">
                    {isDesktopNotificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Chip>
                  <Chip color={notificationPermission === 'denied' ? 'warning' : 'default'} variant="flat">
                    Browser: {notificationPermission}
                  </Chip>
                  {isSavingNotificationPreference && (
                    <Chip color="primary" variant="flat">
                      Saving
                    </Chip>
                  )}
                </div>
              </CardBody>
            </Card>
          </section>

          {isSuperAdmin && (
            <section id="mobile-release" className="scroll-mt-24">
              <MobileApkReleasePanel />
            </section>
          )}

          <section id="legal" className="scroll-mt-24">
            <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
              <CardHeader className="flex gap-3 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Scale size={20} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Legal</p>
                  <p className="text-small text-default-500">Review our policies and terms</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="gap-2 py-6">
                <Link
                  to="/terms-and-condition"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg bg-content1 p-4 transition-all hover:bg-content2"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100 transition-colors group-hover:bg-default-200">
                      <FileText size={20} className="text-default-600" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-base font-semibold">Terms and Conditions</p>
                      <p className="text-tiny text-default-500">Read our terms of service</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-default-400 transition-colors group-hover:text-primary" />
                </Link>

                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg bg-content1 p-4 transition-all hover:bg-content2"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-default-100 transition-colors group-hover:bg-default-200">
                      <Shield size={20} className="text-default-600" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-base font-semibold">Privacy Policy</p>
                      <p className="text-tiny text-default-500">Read our privacy policy</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-default-400 transition-colors group-hover:text-primary" />
                </Link>
              </CardBody>
            </Card>
          </section>

          <p className="pb-6 text-center text-xs text-default-400">Rescuenect {__APP_VERSION__}</p>
        </main>
      </div>
    </div>
  );
};

export default Settings;
