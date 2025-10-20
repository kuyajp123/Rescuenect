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
import { useAsyncList } from '@react-stately/data';
import { ChevronDown, EllipsisVertical, History, Info, MapPin, Plus, Search, UserRound } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

export const columns = [
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
  {
    id: '2',
    vid: 'status-654321-v1',
    email: 'jane.smith@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=b124581f4e29026024d',
    name: 'Jane Smith',
    condition: 'safe',
    location: 'Tanza, Cavite',
    lat: 14.331292,
    lng: 120.855431,
    status: 'current',
    createdAt: '1 hour ago',
    expirationDuration: '12 hours',
  },
  {
    id: '3',
    vid: 'status-987654-v1',
    email: 'michael.lee@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=c042581f4e29026024d',
    name: 'Michael Lee',
    condition: 'affected',
    location: 'Trece Martires, Cavite',
    lat: 14.280522,
    lng: 120.866113,
    status: 'current',
    createdAt: '30 minutes ago',
    expirationDuration: '12 hours',
  },
  {
    id: '4',
    vid: 'status-192837-v1',
    email: 'sarah.ang@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=d042581f4e29026024d',
    name: 'Sarah Ang',
    condition: 'missing',
    location: 'General Trias, Cavite',
    lat: 14.386457,
    lng: 120.881721,
    status: 'current',
    createdAt: '5 hours ago',
    expirationDuration: '24 hours',
  },
  {
    id: '5',
    vid: 'status-283746-v1',
    email: 'kevin.bautista@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=e042581f4e29026024d',
    name: 'Kevin Bautista',
    condition: 'safe',
    location: 'Indang, Cavite',
    lat: 14.195382,
    lng: 120.876425,
    status: 'history',
    createdAt: '1 day ago',
    expirationDuration: '24 hours',
  },
  {
    id: '6',
    vid: 'status-564738-v1',
    email: 'anna.torres@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=f042581f4e29026024d',
    name: 'Anna Torres',
    condition: 'evacuated',
    location: 'Maragondon, Cavite',
    lat: 14.268938,
    lng: 120.735421,
    status: 'current',
    createdAt: '3 hours ago',
    expirationDuration: '12 hours',
  },
  {
    id: '7',
    vid: 'status-918273-v1',
    email: 'carlo.mendoza@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=g042581f4e29026024d',
    name: 'Carlo Mendoza',
    condition: 'affected',
    location: 'Naic, Cavite',
    lat: 14.318947,
    lng: 120.769354,
    status: 'history',
    createdAt: '2 days ago',
    expirationDuration: '24 hours',
  },
  {
    id: '8',
    vid: 'status-726354-v1',
    email: 'diana.garcia@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=h042581f4e29026024d',
    name: 'Diana Garcia',
    condition: 'safe',
    location: 'Silang, Cavite',
    lat: 14.220846,
    lng: 120.971291,
    status: 'current',
    createdAt: '4 hours ago',
    expirationDuration: '24 hours',
  },
  {
    id: '9',
    vid: 'status-839201-v1',
    email: 'paul.santos@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=i042581f4e29026024d',
    name: 'Paul Santos',
    condition: 'missing',
    location: 'Tagaytay, Cavite',
    lat: 14.115034,
    lng: 120.962155,
    status: 'deleted',
    createdAt: '3 days ago',
    expirationDuration: '12 hours',
  },
  {
    id: '10',
    vid: 'status-192020-v1',
    email: 'lisa.delacruz@example.com',
    profileImage: 'https://i.pravatar.cc/150?u=j042581f4e29026024d',
    name: 'Lisa Dela Cruz',
    condition: 'evacuated',
    location: 'Naic, Cavite',
    lat: 14.304192,
    lng: 120.796781,
    status: 'current',
    createdAt: '45 minutes ago',
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

type User = (typeof users)[0];

export const StatusHistory = () => {
  const [isLoading, setIsLoading] = React.useState(true);
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

  const hasSearchFilter = Boolean(filterValue);

  const list = useAsyncList({
    async load() {
      let res = users;

      setIsLoading(false);

      return {
        items: res,
      };
    },
    async sort({ items, sortDescriptor }) {
      return {
        items: items.sort((a: any, b: any) => {
          let first = a[sortDescriptor.column];
          let second = b[sortDescriptor.column];

          // Handle different data types
          if (typeof first === 'string' && typeof second === 'string') {
            first = first.toLowerCase();
            second = second.toLowerCase();
          }

          let cmp = first < second ? -1 : first > second ? 1 : 0;

          if (sortDescriptor.direction === 'descending') {
            cmp *= -1;
          }

          return cmp;
        }),
      };
    },
  });

  const handleAction = (key: any, user: User) => {
    switch (key) {
      case 'details':
        console.log('View Details for:', user.name, user);
        // Add your logic for viewing details
        break;
      case 'history':
        console.log('View History for:', user.name, user);
        // Add your logic for viewing history
        break;
      case 'map':
        console.log('Show in Map:', user.name, user.lat, user.lng);
        // Add your logic for showing on map
        break;
      case 'user':
        console.log('View Profile for:', user.name, user);
        // Add your logic for viewing profile
        break;
    }
  };

  const renderCell = useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];

    switch (columnKey) {
      case 'vid':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
          </div>
        );
      case 'name':
        return (
          <User avatarProps={{ radius: 'lg', src: user.profileImage }} description={user.email} name={cellValue}>
            {user.name}
          </User>
        );
      case 'condition':
        return (
          <Chip className="capitalize" color={conditionColorMap[user.condition]} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      case 'location':
        return (
          <div className="flex flex-col max-w-[200px]">
            <p className="text-bold text-sm capitalize flex-wrap" title={cellValue as string}>
              {cellValue}
            </p>
            <p className="text-bold text-tiny capitalize text-default-400">lat: {user.lat}</p>
            <p className="text-bold text-tiny capitalize text-default-400">lng: {user.lng}</p>
          </div>
        );
      case 'status':
        return (
          <div className="flex flex-col">
            <p className={`text-bold text-sm capitalize ${statusColorMap[user.status]}`}>
              {cellValue === 'current' ? 'Active' : cellValue}
            </p>
          </div>
        );
      case 'createdAt':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{cellValue}</p>
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
                <DropdownItem key="details" shortcut="⌘N" startContent={<Info size={20} className={iconClasses} />}>
                  View Details
                </DropdownItem>
                <DropdownItem key="history" shortcut="⌘C" startContent={<History size={20} className={iconClasses} />}>
                  View History
                </DropdownItem>
                <DropdownItem key="map" shortcut="⌘⇧E" startContent={<MapPin size={20} className={iconClasses} />}>
                  Show in Map
                </DropdownItem>
                <DropdownItem key="user" shortcut="⌘⇧E" startContent={<UserRound size={20} className={iconClasses} />}>
                  View Profile
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
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

      let cmp = first < second ? -1 : first > second ? 1 : 0;

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
          <span className="text-default-400 text-small">Total {filteredItems.length} users</span>
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
      selectionMode="single"
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
          <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
        )}
      </TableBody>
    </Table>
  );
};
