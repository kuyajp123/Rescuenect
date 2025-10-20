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

import { db } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/types';
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
import { collectionGroup, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ChevronDown, EllipsisVertical, History, Info, Plus, Search, UserRound } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

// Helper function to format Firestore timestamp
const formatTimeSince = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return 'Unknown';
  }
};

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

const transformStatusData = (dynamicData: StatusData[]): User[] => {
  return dynamicData.map((item, index) => ({
    no: index + 1,
    id: item.uid || '',
    vid: item.versionId || '',
    email: `${item.firstName?.toLowerCase() || 'unknown'}.${item.lastName?.toLowerCase() || 'user'}@example.com`,
    profileImage: item.profileImage || '',
    name: `${item.firstName || 'Unknown'} ${item.lastName || 'User'}`,
    condition: item.condition,
    location: item.location || 'Unknown Location',
    lat: item.lat || 0,
    lng: item.lng || 0,
    status: item.statusType,
    createdAt: formatTimeSince(item.createdAt),
    expirationDuration: `${item.expirationDuration || 0} hours`,
    // Additional fields for action handlers
    parentId: item.parentId,
    originalStatus: {
      ...item,
      id: item.uid || item.versionId || '', // Add the required id property
    } as FirebaseStatusData, // Keep original for detailed actions
  }));
};

export const columns = [
  {
    uid: 'no',
    name: 'NO',
  },
  {
    uid: 'vid',
    name: 'VERSION ID',
  },
  {
    uid: 'name',
    name: 'NAME',
  },
  {
    uid: 'condition',
    name: 'CONDITION',
  },
  {
    uid: 'location',
    name: 'LOCATION',
  },
  {
    uid: 'status',
    name: 'STATUS',
  },
  {
    uid: 'createdAt',
    name: 'CREATED AT',
  },
  {
    uid: 'expirationDuration',
    name: 'DURATION',
  },
  {
    uid: 'actions',
    name: 'ACTIONS',
  },
];

export const users = [
  {
    id: '1',
    vid: 'status-123456-v1',
    email: 'john.doe@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    name: 'John Doe',
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

type User = (typeof users)[0] & {
  parentId?: string;
  originalStatus?: FirebaseStatusData;
};

// Placeholder hook - replace this with your real Firebase integration
const useLatestStatusesForHistory = () => {
  const [statuses, setStatuses] = React.useState<StatusData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      query(
        collectionGroup(db, 'statuses'),
        orderBy('createdAt', 'desc')
      ),
        snapshot => {
          const latestStatusMap = new Map<string, StatusData>();

          // Process all statuses and keep only latest version per parentId
          snapshot.docs.forEach(doc => {
            const statusData = { id: doc.id, ...doc.data() } as unknown as StatusData;
            const parentId = statusData.parentId;

            // Check if this is the latest version for this parentId
            const existing = latestStatusMap.get(parentId);
            
            // Helper function to get timestamp value
            const getTimestamp = (timestamp: any): number => {
              if (!timestamp) return 0;
              if (typeof timestamp === 'string') return new Date(timestamp).getTime();
              if (timestamp.seconds) return timestamp.seconds * 1000;
              if (timestamp.toDate) return timestamp.toDate().getTime();
              return new Date(timestamp).getTime();
            };
            
            if (!existing || getTimestamp(statusData.createdAt) > getTimestamp(existing.createdAt)) {
              latestStatusMap.set(parentId, statusData);
            }
          });

          const latestStatuses = Array.from(latestStatusMap.values()).sort(
            (a, b) => {
              const getTimestamp = (timestamp: any): number => {
                if (!timestamp) return 0;
                if (typeof timestamp === 'string') return new Date(timestamp).getTime();
                if (timestamp.seconds) return timestamp.seconds * 1000;
                if (timestamp.toDate) return timestamp.toDate().getTime();
                return new Date(timestamp).getTime();
              };
              return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
            }
          );

          setStatuses(latestStatuses);
          setLoading(false);
          setError(null);
        },
        err => {
          console.error('Error fetching latest statuses:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const transformedStatuses = React.useMemo(() => {
    return transformStatusData(statuses);
  }, [statuses]);

  return {
    statuses: transformedStatuses,
    loading,
    error,
    totalCount: transformedStatuses.length,
  };
};

export const StatusHistory = () => {
  // Use Firebase data instead of static data
  const { statuses: firebaseStatuses, loading: firebaseLoading, totalCount } = useLatestStatusesForHistory();

  // Use Firebase data as the source
  const users = React.useMemo(() => firebaseStatuses, [firebaseStatuses]);
  const [isLoading, setIsLoading] = React.useState(firebaseLoading);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
  const [filterValue, setFilterValue] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Selection>(new Set(['current']));
  const [conditionFilter, setConditionFilter] = React.useState<Selection>('all');
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'status',
    direction: 'ascending',
  });

  const [page, setPage] = React.useState(1);

  // Update loading state when Firebase loading changes
  React.useEffect(() => {
    setIsLoading(firebaseLoading);
  }, [firebaseLoading]);

  const hasSearchFilter = Boolean(filterValue);

  const handleAction = async (key: any, user: User) => {
    switch (key) {
      case 'details':
        // View latest status details for this parentId
        console.log('View Details for:', user.name, {
          parentId: user.parentId,
          versionId: user.vid,
          status: user.originalStatus,
        });
        // TODO: Open status details modal with full information
        // await handleViewDetails(user);
        break;
      case 'history':
        // View all versions of this parentId status
        console.log('View History for:', user.name, {
          parentId: user.parentId,
          uid: user.id,
        });
        // TODO: Fetch and display all versions of this parentId
        // await handleViewHistory(user);
        break;
      case 'user':
        // View user profile with all their parent statuses
        console.log('View Profile for:', user.name, {
          uid: user.id,
          profileImage: user.profileImage,
        });
        // TODO: Open user profile modal
        // await handleViewUserProfile(user);
        break;
    }
  };

  const renderCell = useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];

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
            description={user.email}
            name={String(cellValue)}
          >
            {String(user.name)}
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
                <Button
                  id={user.id}
                  onPress={() => {
                    // console.log(user.id);
                  }}
                  isIconOnly
                  variant="light"
                >
                  <EllipsisVertical size={24} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Dropdown menu with icons"
                variant="faded"
                onAction={key => handleAction(key, user)}
              >
                <DropdownItem key="details" shortcut="⌘D" startContent={<Info size={20} className={iconClasses} />}>
                  View Details
                </DropdownItem>
                <DropdownItem key="history" shortcut="⌘H" startContent={<History size={20} className={iconClasses} />}>
                  View History
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
          user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
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
    return [...items].sort((a: User, b: User) => {
      let first = a[sortDescriptor.column as keyof User];
      let second = b[sortDescriptor.column as keyof User];

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
            {/* Conditions Filter */}
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
            <Button color="primary" endContent={<Plus />}>
              Add New
            </Button>
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
      // isStriped={list.items.length > 2}
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
      onSelectionChange={setSelectedKeys}
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
        {(item: User) => (
          <TableRow key={item.vid}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
        )}
      </TableBody>
    </Table>
  );
};
