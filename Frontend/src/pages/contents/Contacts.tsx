import { API_ENDPOINTS } from '@/config/endPoints';
import { useAuth } from '@/stores/useAuth';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Tooltip,
} from '@heroui/react';
import axios from 'axios';
import {
  Clipboard,
  ExternalLink,
  Flame,
  Globe,
  GripVertical,
  Link2,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

type ContactAction = 'call' | 'copy' | 'link' | 'display';
type CategoryType = 'Emergency Hotline' | 'Contact Information';

type ContactItem = {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  action: ContactAction;
  iconKey: keyof typeof ICONS;
  iconColor: string;
  isActive: boolean;
};

type CategoryItem = {
  id: string;
  name: string;
  type: CategoryType;
  description?: string;
};

type ContactsResponse = {
  data?: {
    categories?: unknown[];
    contacts?: unknown[];
  };
};

const makeId = () => (crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`);

const ICONS = {
  phone: Phone,
  shield: Shield,
  flame: Flame,
  smartphone: Smartphone,
  mail: Mail,
  globe: Globe,
  link: Link2,
  clipboard: Clipboard,
  user: UserRound,
};

const ICON_OPTIONS = [
  { key: 'phone', label: 'Phone' },
  { key: 'shield', label: 'Shield' },
  { key: 'flame', label: 'Flame' },
  { key: 'smartphone', label: 'Smartphone' },
  { key: 'mail', label: 'Mail' },
  { key: 'globe', label: 'Globe' },
  { key: 'link', label: 'Link' },
  { key: 'clipboard', label: 'Clipboard' },
  { key: 'user', label: 'User' },
] as const;

const ACTION_OPTIONS: { key: ContactAction; label: string; description: string }[] = [
  { key: 'call', label: 'Call', description: 'Launch phone dialer' },
  { key: 'copy', label: 'Copy', description: 'Copy value to clipboard' },
  { key: 'link', label: 'Link', description: 'Open in browser' },
  { key: 'display', label: 'Display', description: 'Display only' },
];

const ACTION_META: Record<ContactAction, { label: string; chip: 'primary' | 'secondary' | 'success' | 'warning' }> = {
  call: { label: 'Call', chip: 'success' },
  copy: { label: 'Copy', chip: 'warning' },
  link: { label: 'Link', chip: 'primary' },
  display: { label: 'Display', chip: 'secondary' },
};

const CATEGORY_TYPES: CategoryType[] = ['Emergency Hotline', 'Contact Information'];

const isCategoryType = (value: unknown): value is CategoryType => CATEGORY_TYPES.includes(value as CategoryType);

const isContactAction = (value: unknown): value is ContactAction => ACTION_OPTIONS.some(option => option.key === value);

const normalizeCategory = (category: any): CategoryItem => ({
  id: typeof category?.id === 'string' ? category.id : makeId(),
  name: typeof category?.name === 'string' && category.name.trim() ? category.name : 'Untitled Category',
  type: isCategoryType(category?.type) ? category.type : 'Emergency Hotline',
  description: typeof category?.description === 'string' ? category.description : '',
});

const normalizeContact = (contact: any): ContactItem => ({
  id: typeof contact?.id === 'string' ? contact.id : makeId(),
  categoryId: typeof contact?.categoryId === 'string' ? contact.categoryId : '',
  name: typeof contact?.name === 'string' ? contact.name : '',
  value: typeof contact?.value === 'string' ? contact.value : '',
  action: isContactAction(contact?.action) ? contact.action : 'display',
  iconKey: (contact?.iconKey && contact.iconKey in ICONS ? contact.iconKey : 'phone') as keyof typeof ICONS,
  iconColor: typeof contact?.iconColor === 'string' ? contact.iconColor : '#0ea5e9',
  isActive: typeof contact?.isActive === 'boolean' ? contact.isActive : true,
});

const actionValueLabel = (action: ContactAction) => {
  switch (action) {
    case 'call':
      return 'Phone number';
    case 'copy':
      return 'Text to copy';
    case 'link':
      return 'URL';
    case 'display':
      return 'Display text';
    default:
      return 'Value';
  }
};

const actionValuePlaceholder = (action: ContactAction) => {
  switch (action) {
    case 'call':
      return 'e.g. 0917-000-0000';
    case 'copy':
      return 'e.g. (046) 875-4322';
    case 'link':
      return 'e.g. https://cavite.gov.ph';
    case 'display':
      return 'e.g. ask@cavite.gov.ph';
    default:
      return '';
  }
};

const SortableContactRow = ({
  contact,
  onEdit,
  onDelete,
  onToggle,
}: {
  contact: ContactItem;
  onEdit: (contact: ContactItem) => void;
  onDelete: (contact: ContactItem) => void;
  onToggle: (contactId: string, value: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.id,
  });
  const Icon = ICONS[contact.iconKey] ?? Phone;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-80' : ''}>
      <Card className="border border-default-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
        <CardBody className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center" style={{ overflow: 'visible' }}>
          <div className="flex w-full items-center gap-3 md:w-auto">
            <button
              className="flex h-9 w-9 cursor-grab items-center justify-center rounded-lg border border-default-200/80 bg-default-50 text-default-500 hover:bg-default-100 active:cursor-grabbing dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={18} />
            </button>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: contact.iconColor }}
            >
              <Icon size={18} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-default-900 dark:text-slate-100">{contact.name}</span>
              <Chip size="sm" color={ACTION_META[contact.action].chip}>
                {ACTION_META[contact.action].label}
              </Chip>
            </div>
            <div className="wrap-break-word text-sm text-default-500 dark:text-slate-400">{contact.value}</div>
          </div>

          <div className="flex items-center justify-between gap-2 md:justify-end">
            <Switch size="sm" isSelected={contact.isActive} onValueChange={value => onToggle(contact.id, value)}>
              <span className="text-xs text-default-500 dark:text-slate-400">Active</span>
            </Switch>
            <div className="flex items-center gap-2">
              <Tooltip content="Edit">
                <Button size="sm" variant="flat" onPress={() => onEdit(contact)}>
                  Edit
                </Button>
              </Tooltip>
              <Tooltip content="Delete" color="danger">
                <Button size="sm" color="danger" variant="light" onPress={() => onDelete(contact)}>
                  <Trash2 size={16} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

const Contacts = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const auth = useAuth(state => state.auth);
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'contact' | 'category';
    id: string;
    label: string;
  } | null>(null);

  const [contactErrors, setContactErrors] = useState<{
    name?: string;
    value?: string;
    categoryId?: string;
    action?: string;
  }>({});

  const [categoryErrors, setCategoryErrors] = useState<{
    name?: string;
    type?: string;
  }>({});

  const [contactForm, setContactForm] = useState<ContactItem>({
    id: '',
    categoryId: selectedCategoryId,
    name: '',
    value: '',
    action: 'call',
    iconKey: 'phone',
    iconColor: '#0ea5e9',
    isActive: true,
  });

  const [categoryForm, setCategoryForm] = useState<CategoryItem>({
    id: '',
    name: '',
    type: 'Emergency Hotline',
    description: '',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const selectPopoverProps = useMemo(() => ({ disableAnimation: true }), []);
  const selectListboxProps = useMemo(() => ({ autoFocus: false, shouldUseVirtualFocus: true }), []);

  const blurActiveElement = () => {
    if (typeof document === 'undefined') return;
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  };

  const handleContactModalChange = (open: boolean) => {
    if (!open) {
      setTimeout(blurActiveElement, 0);
    }
    setIsContactModalOpen(open);
  };

  const handleCategoryModalChange = (open: boolean) => {
    if (!open) {
      setTimeout(blurActiveElement, 0);
    }
    setIsCategoryModalOpen(open);
  };

  const handleSelectClose = () => {
    setTimeout(blurActiveElement, 0);
  };

  const handleConfirmModalChange = (open: boolean) => {
    if (!open) {
      setTimeout(blurActiveElement, 0);
      setConfirmDelete(null);
    }
  };

  const selectedCategory = useMemo(
    () => categories.find(category => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const visibleContacts = useMemo(() => {
    return contacts
      .filter(contact => contact.categoryId === selectedCategoryId)
      .filter(contact => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        return contact.name.toLowerCase().includes(term) || contact.value.toLowerCase().includes(term);
      });
  }, [contacts, selectedCategoryId, searchQuery]);

  const rowHeight = 96;
  const rowGap = 12;
  const minRows = Math.max(visibleContacts.length, 1);
  const listMinHeight = Math.max(minRows * rowHeight + (minRows - 1) * rowGap, 240);

  const summary = useMemo(() => {
    const total = contacts.length;
    const emergency = contacts.filter(contact => {
      const category = categories.find(cat => cat.id === contact.categoryId);
      return category?.type === 'Emergency Hotline';
    }).length;
    const info = contacts.filter(contact => {
      const category = categories.find(cat => cat.id === contact.categoryId);
      return category?.type === 'Contact Information';
    }).length;
    const active = contacts.filter(contact => contact.isActive).length;
    return { total, emergency, info, active };
  }, [contacts, categories]);

  useEffect(() => {
    if (!auth || hasLoadedRemote) return;
    let isMounted = true;

    const loadContacts = async () => {
      try {
        const idToken = await auth.getIdToken();
        const response = await axios.get<ContactsResponse>(API_ENDPOINTS.CONTACTS.GET_CONTACTS, {
          headers: { Authorization: `Bearer ${idToken}` },
          withCredentials: true,
        });

        const data = response.data?.data;
        const remoteCategories = Array.isArray(data?.categories) ? data.categories.map(normalizeCategory) : [];
        const remoteContacts = Array.isArray(data?.contacts) ? data.contacts.map(normalizeContact) : [];

        if (!isMounted) return;
        if (remoteCategories.length > 0 || remoteContacts.length > 0) {
          setCategories(remoteCategories);
          setContacts(remoteContacts);
          const fallbackCategoryId = remoteCategories[0]?.id ?? '';
          setSelectedCategoryId(prev =>
            remoteCategories.some(category => category.id === prev) ? prev : fallbackCategoryId
          );
        }

        setHasLoadedRemote(true);
      } catch (error) {
        console.error('[Contacts Load Error]', error);
        if (isMounted) {
          setHasLoadedRemote(true);
        }
      }
    };

    loadContacts();

    return () => {
      isMounted = false;
    };
  }, [auth, hasLoadedRemote]);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0]?.id ?? '');
      return;
    }
    if (selectedCategoryId && !categories.some(category => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id ?? '');
    }
  }, [categories, selectedCategoryId]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setContacts(prev => {
      const categoryItems = prev.filter(contact => contact.categoryId === selectedCategoryId);
      const oldIndex = categoryItems.findIndex(contact => contact.id === active.id);
      const newIndex = categoryItems.findIndex(contact => contact.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(categoryItems, oldIndex, newIndex);
      let cursor = 0;
      return prev.map(item => {
        if (item.categoryId !== selectedCategoryId) return item;
        const next = reordered[cursor];
        cursor += 1;
        return next;
      });
    });
  };

  const buildContactsPayload = () => {
    const categoryOrder = categories.map((category, index) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      description: category.description ?? null,
      order: index,
    }));

    const categoryPosition: Record<string, number> = {};
    const contactPayload = contacts.map(contact => {
      const position = categoryPosition[contact.categoryId] ?? 0;
      categoryPosition[contact.categoryId] = position + 1;

      return {
        id: contact.id,
        categoryId: contact.categoryId,
        name: contact.name,
        value: contact.value,
        action: contact.action,
        iconKey: contact.iconKey,
        iconColor: contact.iconColor,
        isActive: contact.isActive,
        order: position,
      };
    });

    return {
      updatedAt: new Date().toISOString(),
      categories: categoryOrder,
      contacts: contactPayload,
    };
  };

  const handleSyncContacts = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    const payload = buildContactsPayload();

    if (!auth) {
      console.warn('Cannot sync contacts: missing auth user');
      setSyncError('Missing authenticated user. Please re-login.');
      setIsSyncing(false);
      return;
    }

    try {
      const idToken = await auth.getIdToken();
      await axios.post(API_ENDPOINTS.CONTACTS.CREATE_CONTACT, payload, {
        headers: { Authorization: `Bearer ${idToken}` },
        withCredentials: true,
      });
    } catch (error) {
      console.error('[Sync Contacts Error]', error);
      setSyncError('Failed to save contacts. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const openCreateContact = () => {
    setEditingContact(null);
    setContactForm({
      id: '',
      categoryId: selectedCategoryId,
      name: '',
      value: '',
      action: 'call',
      iconKey: 'phone',
      iconColor: '#0ea5e9',
      isActive: true,
    });
    setContactErrors({});
    setIsContactModalOpen(true);
  };

  const openEditContact = (contact: ContactItem) => {
    setEditingContact(contact);
    setContactForm(contact);
    setContactErrors({});
    setIsContactModalOpen(true);
  };

  const saveContact = () => {
    const nextErrors: typeof contactErrors = {};
    if (!contactForm.name.trim()) {
      nextErrors.name = 'Contact name is required.';
    }
    if (!contactForm.value.trim()) {
      nextErrors.value = 'Contact value is required.';
    }
    if (!contactForm.categoryId) {
      nextErrors.categoryId = 'Please select a category.';
    }
    if (!contactForm.action) {
      nextErrors.action = 'Please select an action type.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setContactErrors(nextErrors);
      return;
    }

    if (editingContact) {
      setContacts(prev => prev.map(item => (item.id === editingContact.id ? { ...contactForm } : item)));
    } else {
      setContacts(prev => [...prev, { ...contactForm, id: makeId() }]);
    }

    handleContactModalChange(false);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      id: '',
      name: '',
      type: 'Emergency Hotline',
      description: '',
    });
    setCategoryErrors({});
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category: CategoryItem) => {
    setEditingCategory(category);
    setCategoryForm(category);
    setCategoryErrors({});
    setIsCategoryModalOpen(true);
  };

  const saveCategory = () => {
    const nextErrors: typeof categoryErrors = {};
    if (!categoryForm.name.trim()) {
      nextErrors.name = 'Category name is required.';
    }
    if (!categoryForm.type) {
      nextErrors.type = 'Category type is required.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setCategoryErrors(nextErrors);
      return;
    }
    if (editingCategory) {
      setCategories(prev => prev.map(item => (item.id === editingCategory.id ? { ...categoryForm } : item)));
    } else {
      const newCategory = { ...categoryForm, id: makeId() };
      setCategories(prev => [...prev, newCategory]);
      setSelectedCategoryId(newCategory.id);
    }
    handleCategoryModalChange(false);
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => {
      const next = prev.filter(cat => cat.id !== categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(next[0]?.id ?? '');
      }
      return next;
    });
    setContacts(prev => prev.filter(contact => contact.categoryId !== categoryId));
  };

  const deleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  const selectedIcon = ICONS[contactForm.iconKey] ?? Phone;

  return (
    <div className="relative px-6 text-default-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_45%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_50%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border border-default-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
          <CardBody className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Chip color="primary" variant="flat">
                Contacts Administration
              </Chip>
              <h1 className="text-2xl font-semibold text-default-900 dark:text-slate-100 md:text-3xl">
                Hotline & Contact Manager
              </h1>
              <p className="max-w-2xl text-sm text-default-500 dark:text-slate-400">
                Organize emergency hotlines and public information. Drag to reorder, set interaction types, and keep the
                mobile experience consistent for residents.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button color="primary" startContent={<Plus size={18} />} onPress={openCreateContact}>
                New Contact
              </Button>
              <Button variant="flat" startContent={<Plus size={18} />} onPress={openCreateCategory}>
                New Category
              </Button>
              <Button
                type="button"
                variant="bordered"
                onPress={handleSyncContacts}
                isLoading={isSyncing}
                isDisabled={isSyncing}
              >
                Save Changes
              </Button>
            </div>
            {syncError && <p className="text-xs text-danger-500">{syncError}</p>}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="border border-default-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <div className="flex w-full items-center justify-between">
                <h2 className="text-lg font-semibold text-default-900 dark:text-slate-100">Categories</h2>
                <Chip size="sm" variant="flat">
                  {categories.length} total
                </Chip>
              </div>
              <p className="text-xs text-default-500 dark:text-slate-400">Tap a category to manage its contacts.</p>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition ${
                    selectedCategoryId === category.id
                      ? 'border-primary/40 bg-primary/10 dark:border-primary/40 dark:bg-primary/20'
                      : 'border-default-200/70 bg-white/60 hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800/70 dark:bg-slate-900/60 dark:hover:border-primary/40 dark:hover:bg-slate-800/70'
                  }`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-default-900 dark:text-slate-100">{category.name}</div>
                      <div className="text-xs text-default-500 dark:text-slate-400">{category.type}</div>
                    </div>
                    <Chip size="sm" variant="flat">
                      {contacts.filter(contact => contact.categoryId === category.id).length}
                    </Chip>
                  </div>
                  <div className="text-xs text-default-500 dark:text-slate-400">{category.description}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="light" onPress={() => openEditCategory(category)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => setConfirmDelete({ type: 'category', id: category.id, label: category.name })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="flex flex-col gap-6">
            <Card
              className="border border-default-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80"
              style={{ overflow: 'visible' }}
            >
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-default-900 dark:text-slate-100">
                    {selectedCategory?.name ?? 'Select a category'}
                  </h2>
                  <p className="text-xs text-default-500 dark:text-slate-400">
                    {selectedCategory?.description || 'Create a category to start adding contacts.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    size="sm"
                    placeholder="Search contacts"
                    startContent={<Search size={16} />}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="w-full md:w-56"
                  />
                  <Button variant="flat" onPress={openCreateContact}>
                    Add contact
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-default-200/70 bg-default-50 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/80">
                  <div className="text-xs text-default-500 dark:text-slate-400">Total contacts</div>
                  <div className="text-lg font-semibold text-default-900 dark:text-slate-100">{summary.total}</div>
                </div>
                <div className="rounded-xl border border-default-200/70 bg-default-50 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/80">
                  <div className="text-xs text-default-500 dark:text-slate-400">Emergency</div>
                  <div className="text-lg font-semibold text-default-900 dark:text-slate-100">{summary.emergency}</div>
                </div>
                <div className="rounded-xl border border-default-200/70 bg-default-50 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/80">
                  <div className="text-xs text-default-500 dark:text-slate-400">Info</div>
                  <div className="text-lg font-semibold text-default-900 dark:text-slate-100">{summary.info}</div>
                </div>
                <div className="rounded-xl border border-default-200/70 bg-default-50 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/80">
                  <div className="text-xs text-default-500 dark:text-slate-400">Active</div>
                  <div className="text-lg font-semibold text-default-900 dark:text-slate-100">{summary.active}</div>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-default-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
              <CardHeader className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-default-900 dark:text-slate-100">Contacts</h3>
                  <p className="text-xs text-default-500 dark:text-slate-400">
                    Drag a row to reorder the display in the mobile app.
                  </p>
                </div>
                <Chip size="sm" variant="flat">
                  {visibleContacts.length} shown
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="flex min-w-0 flex-col gap-3" style={{ overflow: 'visible' }}>
                {visibleContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-default-200/80 bg-default-50 px-6 py-12 text-center dark:border-slate-800/70 dark:bg-slate-900/70">
                    <p className="text-sm font-semibold text-default-900 dark:text-slate-100">No contacts yet</p>
                    <p className="mt-1 text-xs text-default-500 dark:text-slate-400">
                      Add your first contact for this category to get started.
                    </p>
                    <Button className="mt-4" color="primary" onPress={openCreateContact}>
                      Add contact
                    </Button>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={visibleContacts.map(contact => contact.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className="flex min-w-0 flex-col gap-3"
                        style={{ minHeight: listMinHeight, minWidth: '100%', overflow: 'visible' }}
                      >
                        {visibleContacts.map(contact => (
                          <SortableContactRow
                            key={contact.id}
                            contact={contact}
                            onEdit={openEditContact}
                            onDelete={item => setConfirmDelete({ type: 'contact', id: item.id, label: item.name })}
                            onToggle={(id, value) =>
                              setContacts(prev =>
                                prev.map(item => (item.id === id ? { ...item, isActive: value } : item))
                              )
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isContactModalOpen} onOpenChange={handleContactModalChange} size="3xl">
        <ModalContent className="dark:bg-slate-950/95">
          <ModalHeader className="flex flex-col gap-1">
            {editingContact ? 'Update contact' : 'Create new contact'}
            <span className="text-xs text-default-500 dark:text-slate-400">
              Configure icon, action type, and where this contact appears.
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col gap-4">
                <Input
                  label="Contact name"
                  placeholder="e.g. OPDRRMO Hotline"
                  value={contactForm.name}
                  onValueChange={value => {
                    setContactForm(prev => ({ ...prev, name: value }));
                    if (contactErrors.name) {
                      setContactErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  isInvalid={!!contactErrors.name}
                  errorMessage={contactErrors.name}
                />
                <Input
                  label={actionValueLabel(contactForm.action)}
                  placeholder={actionValuePlaceholder(contactForm.action)}
                  value={contactForm.value}
                  onValueChange={value => {
                    setContactForm(prev => ({ ...prev, value }));
                    if (contactErrors.value) {
                      setContactErrors(prev => ({ ...prev, value: undefined }));
                    }
                  }}
                  isInvalid={!!contactErrors.value}
                  errorMessage={contactErrors.value}
                />
                <Select
                  label="Action type"
                  selectedKeys={[contactForm.action]}
                  disableAnimation
                  popoverProps={selectPopoverProps}
                  listboxProps={selectListboxProps}
                  onClose={handleSelectClose}
                  onSelectionChange={keys => {
                    const value = Array.from(keys)[0] as ContactAction;
                    setContactForm(prev => ({ ...prev, action: value }));
                    if (contactErrors.action) {
                      setContactErrors(prev => ({ ...prev, action: undefined }));
                    }
                  }}
                  isInvalid={!!contactErrors.action}
                  errorMessage={contactErrors.action}
                >
                  {ACTION_OPTIONS.map(option => (
                    <SelectItem key={option.key} description={option.description}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Category"
                  selectedKeys={[contactForm.categoryId]}
                  disableAnimation
                  popoverProps={selectPopoverProps}
                  listboxProps={selectListboxProps}
                  onClose={handleSelectClose}
                  onSelectionChange={keys => {
                    const value = Array.from(keys)[0] as string;
                    setContactForm(prev => ({ ...prev, categoryId: value }));
                    if (contactErrors.categoryId) {
                      setContactErrors(prev => ({ ...prev, categoryId: undefined }));
                    }
                  }}
                  isInvalid={!!contactErrors.categoryId}
                  errorMessage={contactErrors.categoryId}
                >
                  {categories.map(category => (
                    <SelectItem key={category.id} description={category.type}>
                      {category.name}
                    </SelectItem>
                  ))}
                </Select>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px]">
                  <Select
                    label="Icon"
                    selectedKeys={[contactForm.iconKey]}
                    disableAnimation
                    popoverProps={selectPopoverProps}
                    listboxProps={selectListboxProps}
                    onClose={handleSelectClose}
                    onSelectionChange={keys => {
                      const value = Array.from(keys)[0] as keyof typeof ICONS;
                      setContactForm(prev => ({ ...prev, iconKey: value }));
                    }}
                  >
                    {ICON_OPTIONS.map(option => {
                      const OptionIcon = ICONS[option.key];
                      return (
                        <SelectItem key={option.key} startContent={<OptionIcon size={16} />}>
                          {option.label}
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-default-600 dark:text-slate-300">Icon color</label>
                    <input
                      className="h-10 w-full cursor-pointer rounded-xl border border-default-200 bg-default-50 p-1 dark:border-slate-700 dark:bg-slate-900"
                      type="color"
                      value={contactForm.iconColor}
                      onChange={event => setContactForm(prev => ({ ...prev, iconColor: event.target.value }))}
                    />
                  </div>
                </div>
                <Switch
                  isSelected={contactForm.isActive}
                  onValueChange={value => setContactForm(prev => ({ ...prev, isActive: value }))}
                >
                  Active
                </Switch>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-default-200/70 bg-default-50 p-4 dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="text-xs font-semibold uppercase text-default-400 dark:text-slate-500">Live preview</div>
                <div className="rounded-2xl border border-default-200 bg-white px-4 py-5 dark:border-slate-800/70 dark:bg-slate-950/70">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: contactForm.iconColor }}
                    >
                      {React.createElement(selectedIcon, { size: 18 })}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-default-900 dark:text-slate-100">
                        {contactForm.name || 'Contact name'}
                      </div>
                      <div className="text-xs text-default-500 dark:text-slate-400">
                        {contactForm.value || 'Contact value'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-default-500 dark:text-slate-400">
                    <span>{ACTION_META[contactForm.action].label} action</span>
                    {contactForm.action === 'link' && <ExternalLink size={14} />}
                  </div>
                </div>
                <div className="text-xs text-default-500 dark:text-slate-400">
                  This preview mirrors how the contact card will appear in the mobile hotline screen.
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => handleContactModalChange(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={saveContact}>
              {editingContact ? 'Update contact' : 'Create contact'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onOpenChange={handleCategoryModalChange}>
        <ModalContent className="dark:bg-slate-950/95">
          <ModalHeader>{editingCategory ? 'Edit category' : 'Create category'}</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input
              label="Category name"
              placeholder="e.g. Emergency Hotlines"
              value={categoryForm.name}
              onValueChange={value => {
                setCategoryForm(prev => ({ ...prev, name: value }));
                if (categoryErrors.name) {
                  setCategoryErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              isInvalid={!!categoryErrors.name}
              errorMessage={categoryErrors.name}
            />
            <Select
              label="Category type"
              selectedKeys={[categoryForm.type]}
              disableAnimation
              popoverProps={selectPopoverProps}
              listboxProps={selectListboxProps}
              onClose={handleSelectClose}
              onSelectionChange={keys => {
                const value = Array.from(keys)[0] as CategoryType;
                setCategoryForm(prev => ({ ...prev, type: value }));
                if (categoryErrors.type) {
                  setCategoryErrors(prev => ({ ...prev, type: undefined }));
                }
              }}
              isInvalid={!!categoryErrors.type}
              errorMessage={categoryErrors.type}
            >
              {['Emergency Hotline', 'Contact Information'].map(type => (
                <SelectItem key={type}>{type}</SelectItem>
              ))}
            </Select>
            <Textarea
              label="Description"
              placeholder="Short description for admin context"
              value={categoryForm.description ?? ''}
              onValueChange={value => setCategoryForm(prev => ({ ...prev, description: value }))}
              minRows={2}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => handleCategoryModalChange(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={saveCategory}>
              {editingCategory ? 'Update category' : 'Create category'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!confirmDelete} onOpenChange={handleConfirmModalChange}>
        <ModalContent className="dark:bg-slate-950/95">
          <ModalHeader>Confirm delete</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600 dark:text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-default-900 dark:text-slate-100">{confirmDelete?.label}</span>?
            </p>
            {confirmDelete?.type === 'category' && (
              <p className="text-xs text-default-500 dark:text-slate-400">
                This will also remove contacts under the category. You can add them back later.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => handleConfirmModalChange(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                if (confirmDelete?.type === 'contact') {
                  deleteContact(confirmDelete.id);
                }
                if (confirmDelete?.type === 'category') {
                  deleteCategory(confirmDelete.id);
                }
                handleConfirmModalChange(false);
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Contacts;
