/**
 * Status History Table Component
 *
 * This component displays the latest status version for each parentId across all users.
 *
 * Key Features:
 * - Shows latest status per parentId (not just current statuses)
 * - Real-time updates from Firebase using collection group queries
 * - Action buttons: View Details, View History, View Profile
 * - Filtering by condition, status type, and search
 * - Compatible with Firebase status data structure
 *
 * Integration Notes:
 * - Replace useLatestStatusesForHistory with your real Firebase hook
 * - Implement handleViewDetails, handleViewHistory, handleViewUserProfile
 * - See FIRESTORE_STATUS_QUERIES.md for query documentation
 */

import { useStatusHistory } from '@/hooks/useStatusHistory';
import { usePanelStore } from '@/stores/panelStore';
import { useStatusStore } from '@/stores/useStatusStore';
import { useVersionHistoryStore } from '@/stores/useVersionHistoryStore';
import type { ChipProps, Selection, SortDescriptor } from '@heroui/react';
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from '@heroui/react';
import { ChevronDown, EllipsisVertical, History, RefreshCcw, Search, UserRound } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

// Transform Firebase data to table format
interface FirebaseStatusData {
  id: string;
  note: string;
  retentionUntil: any;
  lng: number;
  profileImage: string;
  parentId: string;
  phoneNumber: string;
  image?: string;
  firstName: string;
  condition: 'missing' | 'safe' | 'affected' | 'evacuated';
  expirationDuration: number;
  location: string;
  shareLocation: boolean;
  expiresAt: any;
  versionId: string;
  shareContact: boolean;
  createdAt: any;
  lastName: string;
  lat: number;
  uid: string;
  statusType: 'current' | 'history' | 'deleted';
  updatedAt?: any;
}

export const columns = [
  // { uid: 'no', name: 'NO' },
  { uid: 'vid', name: 'VERSION ID' },
  { uid: 'name', name: 'NAME' },
  { uid: 'condition', name: 'CONDITION' },
  { uid: 'location', name: 'LOCATION' },
  { uid: 'status', name: 'STATUS' },
  { uid: 'createdAt', name: 'CREATED AT' },
  { uid: 'expirationDuration', name: 'DURATION' },
  { uid: 'actions', name: 'ACTIONS' },
];

export const users = [
  {
    id: '1',
    vid: 'status-123456-v1',
    email: 'john.doe@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+63 912 345 6789',
    condition: 'evacuated',
    location: 'Naic, Cavite',
    lat: 14.305580227490012,
    lng: 120.79735799230258,
    status: 'current',
    createdAt: '2 hours ago',
    expirationDuration: '24 hours',
  },
];

const conditionColorMap: Record<string, ChipProps['color']> = {
  safe: 'success',
  evacuated: 'primary',
  affected: 'warning',
  missing: 'danger',
};

const statusColorMap: Record<string, string> = {
  current: 'text-green-500',
  history: 'text-yellow-500',
  deleted: 'text-red-500',
};

export const statusOptions = [
  { name: 'Active', uid: 'current' },
  { name: 'History', uid: 'history' },
  { name: 'Deleted', uid: 'deleted' },
];

export const conditionsOptions = [
  { name: 'Safe', uid: 'safe' },
  { name: 'Evacuated', uid: 'evacuated' },
  { name: 'Affected', uid: 'affected' },
  { name: 'Missing', uid: 'missing' },
];

type StatusUser = {
  id: string;
  vid: string;
  email?: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  condition: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
  expirationDuration: string;
  parentId: string;
  originalStatus?: FirebaseStatusData;
};

export const StatusHistory = () => {
  const statusData = useStatusStore(state => state.statusData);
  const setParentId = useVersionHistoryStore(state => state.setParentId);
  const setUid = useVersionHistoryStore(state => state.setUid);
  const navigate = useNavigate();
  const {
    statuses: firebaseStatuses,
    loading: firebaseLoading,
    error,
    totalCount,
    fetchStatusHistory,
  } = useStatusHistory();

  error;

  // Get panel control functions from Zustand store
  const { openPanel, closePanel, setSelectedUser } = usePanelStore();

  // Use Firebase data as the source
  const users = React.useMemo(() => firebaseStatuses as StatusUser[], [firebaseStatuses]);
  const [isLoading, setIsLoading] = React.useState(firebaseLoading);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
  const [filterValue, setFilterValue] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Selection>('all');
  const [conditionFilter, setConditionFilter] = React.useState<Selection>('all');
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [statusChanges, setStatusChanges] = React.useState(false);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'status',
    direction: 'ascending',
  });

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const activeStatusCount = statusData.length;
    const usersStatusesActiveCount = users.filter(
      user => user.status === 'current' || user.originalStatus?.statusType === 'current'
    ).length;

    const hasChanges = activeStatusCount !== usersStatusesActiveCount;

    setStatusChanges(hasChanges);
  }, [statusData, users, statusChanges]);

  // Update loading state when Firebase loading changes
  React.useEffect(() => {
    setIsLoading(firebaseLoading);
  }, [firebaseLoading]);

  React.useEffect(() => {
    return () => {
      closePanel();
      setSelectedUser(null);
    };
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  // Handle table row selection
  const handleRowSelect = React.useCallback(
    (keys: Selection) => {
      const selectedKey = Array.from(keys)[0] as string;
      if (selectedKey) {
        const selectedUser = users.find(user => user.vid === selectedKey);
        if (selectedUser) {
          // Prepare user data for the panel
          const userData = {
            id: selectedUser.id,
            vid: selectedUser.vid,
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            profileImage: selectedUser.profileImage,
            phoneNumber: selectedUser.phoneNumber || selectedUser.originalStatus?.phoneNumber || 'N/A',
            condition: selectedUser.condition as 'missing' | 'safe' | 'affected' | 'evacuated',
            location: selectedUser.location,
            lat: selectedUser.lat,
            lng: selectedUser.lng,
            status: selectedUser.status as 'current' | 'history' | 'deleted',
            createdAt: selectedUser.createdAt,
            expirationDuration: selectedUser.expirationDuration,
            parentId: selectedUser.parentId,
            originalStatus: selectedUser.originalStatus,
          };

          // Update the store and open panel
          setSelectedUser(userData);
          openPanel(userData);
        }
      }
    },
    [users, setSelectedUser, openPanel]
  );

  const handleAction = async (key: any, user: StatusUser) => {
    switch (key) {
      case 'history':
        // View all versions of this parentId status;

        setParentId(user.parentId);
        setUid(user.id);
        navigate('/status/history/versions');
        break;
      case 'user':
        // View user profile with all their parent statuses
        console.log('View Profile for:', user.firstName, user.lastName, {
          uid: user.id,
          profileImage: user.profileImage,
        });
        // TODO: Open user profile modal
        // await handleViewUserProfile(user);
        break;
    }
  };

  const renderCell = useCallback((user: StatusUser, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof StatusUser];

    switch (columnKey) {
      case 'vid':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{String(cellValue)}</p>
          </div>
        );
      case 'name':
        return (
          <User
            avatarProps={{ radius: 'lg', src: user.profileImage }}
            description={user.id}
            name={`${user.firstName} ${user.lastName}`}
          >
            {user.firstName} {user.lastName}
          </User>
        );
      case 'condition':
        return (
          <Chip className="capitalize" color={conditionColorMap[user.condition]} size="sm" variant="flat">
            {String(cellValue)}
          </Chip>
        );
      case 'location':
        return (
          <div className="flex flex-col max-w-[200px]">
            <p className="text-bold text-sm capitalize flex-wrap" title={cellValue as string}>
              {String(cellValue)}
            </p>
            <p className="text-bold text-tiny capitalize text-default-400">lat: {String(user.lat)}</p>
            <p className="text-bold text-tiny capitalize text-default-400">lng: {String(user.lng)}</p>
          </div>
        );
      case 'status':
        return (
          <div className="flex flex-col">
            <p className={`text-bold text-sm capitalize ${statusColorMap[user.status]}`}>
              {String(cellValue === 'current' ? 'Active' : cellValue)}
            </p>
          </div>
        );
      case 'createdAt':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{String(cellValue)}</p>
          </div>
        );
      case 'actions':
        const iconClasses = 'text-xl text-default-500 pointer-events-none shrink-0';

        return (
          <div className="flex justify-center cursor-pointer">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light">
                  <EllipsisVertical size={24} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Dropdown menu with icons"
                variant="faded"
                onAction={key => handleAction(key, user)}
              >
                <DropdownItem key="history" shortcut="⌘H" startContent={<History size={20} className={iconClasses} />}>
                  View Versions
                </DropdownItem>
                <DropdownItem key="user" shortcut="⌘U" startContent={<UserRound size={20} className={iconClasses} />}>
                  View Profile
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return String(cellValue);
    }
  }, []);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(
        user =>
          user.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
          user.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
          user.vid.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter !== 'all' && Array.from(statusFilter).length !== statusOptions.length) {
      filteredUsers = filteredUsers.filter(user => Array.from(statusFilter).includes(user.status));
    }
    if (conditionFilter !== 'all' && Array.from(conditionFilter).length !== conditionsOptions.length) {
      filteredUsers = filteredUsers.filter(user => Array.from(conditionFilter).includes(user.condition));
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter, conditionFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: StatusUser, b: StatusUser) => {
      let first = a[sortDescriptor.column as keyof StatusUser];
      let second = b[sortDescriptor.column as keyof StatusUser];

      // Handle different data types
      if (typeof first === 'string' && typeof second === 'string') {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }

      let cmp = String(first) < String(second) ? -1 : String(first) > String(second) ? 1 : 0;

      if (sortDescriptor.direction === 'descending') {
        cmp *= -1;
      }

      return cmp;
    });
  }, [sortDescriptor, items]);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue('');
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name or version ID"
            startContent={<Search />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            {/* Conditions Filter */}
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                  Condition
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Condition Filter"
                closeOnSelect={false}
                selectedKeys={conditionFilter}
                selectionMode="multiple"
                onSelectionChange={setConditionFilter}
              >
                {conditionsOptions.map(condition => (
                  <DropdownItem key={condition.uid} className="capitalize">
                    {capitalize(condition.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* Status Filter */}
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Status Filter"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map(status => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <div className="relative">
              <Button
                isIconOnly
                variant="flat"
                onPress={() => {
                  fetchStatusHistory();
                  setStatusChanges(false);
                }}
              >
                <RefreshCcw size={20} />
              </Button>
              {statusChanges && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"
                  style={{ zIndex: 9999 }}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-3 items-center">
          <span className="text-default-400 text-small">
            Showing {filteredItems.length} of {totalCount} statuses
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option selected value="10">
                10
              </option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filteredItems.length,
    filterValue,
    statusFilter,
    conditionFilter,
    onSearchChange,
    onRowsPerPageChange,
    hasSearchFilter,
    statusChanges,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="relative py-2 px-2 flex items-center">
        {/* Centered Pagination */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Pagination
            className="cursor-pointer"
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={setPage}
          />
        </div>

        {/* Right-aligned Buttons */}
        <div className="ml-auto hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={false} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button isDisabled={false} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <Table
      isHeaderSticky
      aria-label="Example table with infinite pagination"
      classNames={{
        wrapper: 'max-h-[650px]',
      }}
      topContent={topContent}
      topContentPlacement="outside"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      onSelectionChange={keys => {
        setSelectedKeys(keys);

        // Determine how many items are selected. `Selection` may be a Set or an Array
        const selectedCount = (keys as Set<any>)?.size ?? (Array.isArray(keys) ? (keys as any[]).length : 0);

        if (!selectedCount) {
          // If nothing is selected, clear the panel state and close the panel
          setSelectedUser(null);
          closePanel();
        } else {
          // Otherwise open/view the selected row
          handleRowSelect(keys);
        }
      }}
      selectedKeys={selectedKeys}
      selectionMode="single"
    >
      <TableHeader columns={columns}>
        {column => (
          <TableColumn
            key={column.uid}
            align={column.uid === 'actions' ? 'center' : 'start'}
            maxWidth={column.uid === 'location' ? 200 : undefined}
            allowsSorting={column.uid !== 'actions'}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody isLoading={isLoading} items={sortedItems}>
        {(item: StatusUser) => (
          <TableRow
            key={item.vid}
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            {columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
