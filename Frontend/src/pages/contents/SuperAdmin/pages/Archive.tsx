import { API_ENDPOINTS } from '@/config/endPoints';
import { useSuperFetch } from '@/pages/contents/SuperAdmin/hooks/useSuperFetch';
import type { ArchivedClientDocument, ClientArchive, ClientArchiveSummary } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime, formatStatusLabel, getToken, statusColor } from '@/pages/contents/SuperAdmin/utils';
import type { SortDescriptor } from '@heroui/react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Archive as ArchiveIcon, Database, Eye, RefreshCcw, Search, Trash2, Users } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

const SNAPSHOT_GROUPS = [
  { key: 'lguAdmins', label: 'LGU Admins' },
  { key: 'adminInvitations', label: 'Invitations' },
  { key: 'residents', label: 'Residents' },
  { key: 'statuses', label: 'Statuses' },
  { key: 'evacuationCenters', label: 'Centers' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'clientBoundaries', label: 'Boundaries' },
  { key: 'clientChangeRequests', label: 'Change Requests' },
  { key: 'lguRequests', label: 'LGU Requests' },
] as const;

const valueText = (value: unknown, fallback = 'Not recorded') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const docValue = (doc: ArchivedClientDocument, key: string) => valueText(doc.data?.[key]);

export const SuperAdminArchive = () => {
  const { data, loading, refetch } = useSuperFetch<{ archives: ClientArchiveSummary[] }>(
    API_ENDPOINTS.SUPER_ADMIN.CLIENT_ARCHIVES,
    'client archives'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<ClientArchive | null>(null);
  const [archiveToDelete, setArchiveToDelete] = useState<ClientArchiveSummary | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'archivedAt',
    direction: 'descending',
  });

  const filteredArchives = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const archives = data?.archives ?? [];
    if (!term) return archives;

    return archives.filter(archive =>
      [
        archive.clientName,
        archive.clientId,
        archive.municipalityName,
        archive.provinceName,
        archive.deletionReason,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [data, searchQuery]);

  const sortedArchives = useMemo(() => {
    const column = String(sortDescriptor.column || 'archivedAt');
    const getValue = (archive: ClientArchiveSummary): string | number => {
      if (column === 'location') return `${archive.municipalityName || ''} ${archive.provinceName || ''}`;
      if (column === 'counts') return Object.values(archive.counts ?? {}).reduce((sum, count) => sum + count, 0);
      if (column === 'archivedAt') {
        const value = archive.archivedAt as { _seconds?: number; seconds?: number };
        return value?._seconds ?? value?.seconds ?? 0;
      }
      return archive.clientName;
    };

    return [...filteredArchives].sort((a, b) => {
      const first = getValue(a);
      const second = getValue(b);
      const result =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).toLowerCase().localeCompare(String(second).toLowerCase());
      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [filteredArchives, sortDescriptor]);

  const pages = Math.max(1, Math.ceil(sortedArchives.length / rowsPerPage));
  const paginatedArchives = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedArchives.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedArchives]);
  const firstRow = sortedArchives.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastRow = Math.min(page * rowsPerPage, sortedArchives.length);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  const openArchive = async (archiveId: string) => {
    try {
      setIsLoadingDetail(true);
      const token = await getToken();
      const response = await axios.get<{ archive: ClientArchive }>(
        API_ENDPOINTS.SUPER_ADMIN.CLIENT_ARCHIVE_DETAIL(archiveId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedArchive(response.data.archive);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to load archive'
        : 'Failed to load archive';
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const deleteArchive = async () => {
    if (!archiveToDelete) return;

    try {
      setIsDeleting(true);
      const token = await getToken();
      await axios.delete(API_ENDPOINTS.SUPER_ADMIN.DELETE_CLIENT_ARCHIVE(archiveToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ title: 'Archive permanently deleted', color: 'success' });
      if (selectedArchive?.id === archiveToDelete.id) setSelectedArchive(null);
      setArchiveToDelete(null);
      refetch();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to delete archive'
        : 'Failed to delete archive';
      addToast({ title: message, color: 'danger' });
    } finally {
      setIsDeleting(false);
    }
  };

  const bottomContent = (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-small text-default-400">
        Showing {firstRow}-{lastRow} of {sortedArchives.length} archives
      </span>
      <Pagination showControls showShadow color="primary" page={page} total={pages} onChange={setPage} />
      <label className="flex items-center gap-2 text-small text-default-400">
        Rows per page:
        <select
          className="rounded-md border border-default-200 bg-transparent px-2 py-1 text-small text-default-600 outline-none"
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
    </div>
  );

  const renderAdminSnapshot = (docs: ArchivedClientDocument[]) => {
    if (docs.length === 0) {
      return <p className="text-sm text-default-500">No LGU admins were captured for this client.</p>;
    }

    return (
      <div className="overflow-hidden rounded-lg border border-default-200">
        <Table removeWrapper aria-label="Archived LGU admins">
          <TableHeader>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>UID</TableColumn>
            <TableColumn>STATUS</TableColumn>
          </TableHeader>
          <TableBody items={docs}>
            {doc => (
              <TableRow key={doc.id}>
                <TableCell>{docValue(doc, 'email')}</TableCell>
                <TableCell>{valueText(doc.data.uid || doc.originalId)}</TableCell>
                <TableCell>
                  <Chip size="sm" color={statusColor(String(doc.data.status || 'inactive')) as any}>
                    {formatStatusLabel(String(doc.data.status || 'inactive'))}
                  </Chip>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archive</h1>
          <p className="text-sm text-default-500">Deleted client snapshots and final removal controls.</p>
        </div>
        <Tooltip content="Refresh archive">
          <Button isIconOnly variant="flat" aria-label="Refresh archive" onPress={refetch} isLoading={loading}>
            <RefreshCcw size={18} />
          </Button>
        </Tooltip>
      </div>

      <Input
        className="max-w-xl"
        placeholder="Search archived clients by LGU, location, reason, or ID"
        startContent={<Search size={16} />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      <Table
        aria-label="Archived clients table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{ wrapper: 'border border-default-200 shadow-none' }}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader>
          <TableColumn key="clientName" allowsSorting>
            CLIENT
          </TableColumn>
          <TableColumn key="location" allowsSorting>
            LOCATION
          </TableColumn>
          <TableColumn key="archivedAt" allowsSorting>
            ARCHIVED
          </TableColumn>
          <TableColumn key="counts" allowsSorting>
            SNAPSHOT
          </TableColumn>
          <TableColumn key="actions" align="center">
            ACTIONS
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? 'Loading archives...' : 'No archived clients found'} items={paginatedArchives}>
          {archive => (
            <TableRow key={archive.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-default-100 text-default-600">
                    <ArchiveIcon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">{archive.clientName}</p>
                    <p className="text-xs text-default-500">{archive.clientId}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{archive.municipalityName || 'Not recorded'}</p>
                <p className="text-xs text-default-500">{archive.provinceName || 'No province set'}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{formatDateTime(archive.archivedAt)}</p>
                {archive.deletionReason && <p className="text-xs text-default-500">{archive.deletionReason}</p>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Chip size="sm" variant="flat" startContent={<Users size={13} />}>
                    {archive.counts?.lguAdmins ?? 0}
                  </Chip>
                  <Chip size="sm" variant="flat" startContent={<Database size={13} />}>
                    {Object.values(archive.counts ?? {}).reduce((sum, count) => sum + count, 0)}
                  </Chip>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Eye size={15} />}
                    isLoading={isLoadingDetail}
                    onPress={() => openArchive(archive.id)}
                  >
                    View
                  </Button>
                  <Tooltip content="Permanently delete archive">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      aria-label="Permanently delete archive"
                      onPress={() => setArchiveToDelete(archive)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={!!selectedArchive}
        onOpenChange={open => !open && setSelectedArchive(null)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {onClose => {
            const archive = selectedArchive;
            if (!archive) return null;
            const client = archive.client ?? {};
            const admins = archive.collections?.lguAdmins ?? [];
            const mapSettings = client.mapSettings ?? {};
            const earthquakeSettings = client.earthquakeSettings ?? {};
            const barangays = Array.isArray(client.barangays) ? client.barangays : [];

            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <span>{archive.clientName}</span>
                  <span className="text-sm font-normal text-default-500">
                    {archive.municipalityName || 'Not recorded'}, {archive.provinceName || 'Not recorded'}
                  </span>
                </ModalHeader>
                <ModalBody className="gap-5">
                  <section className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-default-200 p-3">
                      <p className="text-xs text-default-500">Client ID</p>
                      <p className="font-semibold">{archive.clientId}</p>
                    </div>
                    <div className="rounded-lg border border-default-200 p-3">
                      <p className="text-xs text-default-500">Archived</p>
                      <p className="font-semibold">{formatDateTime(archive.archivedAt)}</p>
                    </div>
                    <div className="rounded-lg border border-default-200 p-3">
                      <p className="text-xs text-default-500">Effective Deletion</p>
                      <p className="font-semibold">{formatDateTime(archive.deletionEffectiveAt)}</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Client Setup</h2>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-default-200 p-3">
                        <p className="text-xs text-default-500">Weather Key</p>
                        <p className="font-semibold">{valueText(client.weatherLocationKey)}</p>
                      </div>
                      <div className="rounded-lg border border-default-200 p-3">
                        <p className="text-xs text-default-500">Center Latitude</p>
                        <p className="font-semibold">{valueText(client.weatherLatitude)}</p>
                      </div>
                      <div className="rounded-lg border border-default-200 p-3">
                        <p className="text-xs text-default-500">Center Longitude</p>
                        <p className="font-semibold">{valueText(client.weatherLongitude)}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <pre className="max-h-56 overflow-auto rounded-lg border border-default-200 bg-default-50 p-3 text-xs">
                        {JSON.stringify(mapSettings, null, 2)}
                      </pre>
                      <pre className="max-h-56 overflow-auto rounded-lg border border-default-200 bg-default-50 p-3 text-xs">
                        {JSON.stringify(earthquakeSettings, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-lg border border-default-200 p-3">
                      <p className="text-xs text-default-500">Barangay Coverage</p>
                      <p className="font-semibold">{barangays.length} barangays captured</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold">LGU Admins</h2>
                    {renderAdminSnapshot(admins)}
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Snapshot Data</h2>
                    <div className="flex flex-wrap gap-2">
                      {SNAPSHOT_GROUPS.map(group => (
                        <Chip key={group.key} size="sm" variant="flat">
                          {group.label}: {archive.counts?.[group.key] ?? archive.collections?.[group.key]?.length ?? 0}
                        </Chip>
                      ))}
                    </div>
                    <details className="rounded-lg border border-default-200 p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Raw archive JSON</summary>
                      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-default-50 p-3 text-xs">
                        {JSON.stringify(archive, null, 2)}
                      </pre>
                    </details>
                  </section>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="danger" variant="flat" onPress={() => setArchiveToDelete(archive)}>
                    Delete Archive
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      <Modal isOpen={!!archiveToDelete} onOpenChange={open => !open && setArchiveToDelete(null)} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete archive?</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-600">
                  Permanently remove <span className="font-semibold">{archiveToDelete?.clientName}</span> from Archive.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" isLoading={isDeleting} onPress={deleteArchive}>
                  Delete Permanently
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
