import { sortBarangays } from '@/helper/commonHelpers';
import { useResidentsStore, type ResidentTypes } from '@/hooks/useFetchResidents';
import type { Selection, SortDescriptor } from '@heroui/react';
import { ChevronDown, EllipsisVertical, Search } from 'lucide-react';

import {
  Button,
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
import React from 'react';
import { useNavigate } from 'react-router-dom';

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'EMAIL', uid: 'email' },
  { name: 'PHONE NUMBER', uid: 'phoneNumber' },
  { name: 'BARANGAY', uid: 'barangay', sortable: true },
  { name: 'UPDATED AT', uid: 'updatedAt', sortable: true },
  { name: 'CREATED AT', uid: 'createdAt', sortable: true },
  { name: 'ACTIONS', uid: 'actions' },
];

const barangayOptions = [
  { name: 'Labac', uid: 'labac' },
  { name: 'Mabolo', uid: 'mabolo' },
  { name: 'Bancaan', uid: 'bancaan' },
  { name: 'Balsahan', uid: 'balsahan' },
  { name: 'Bagong Karsada', uid: 'bagong karsada' },
  { name: 'Sapa', uid: 'sapa' },
  { name: 'Bucana Sasahan', uid: 'bucana sasahan' },
  { name: 'Capt C. Nazareno', uid: 'capt c. nazareno' },
  { name: 'Gomez-Zamora', uid: 'gomez-zamora' },
  { name: 'Kanluran', uid: 'kanluran' },
  { name: 'Humbac', uid: 'humbac' },
  { name: 'Bucana Malaki', uid: 'bucana malaki' },
  { name: 'Ibayo Estacion', uid: 'ibayo estacion' },
  { name: 'Ibayo Silangan', uid: 'ibayo silangan' },
  { name: 'Latoria', uid: 'latoria' },
  { name: 'Munting Mapino', uid: 'munting mapino' },
  { name: 'Timalan Balsahan', uid: 'timalan balsahan' },
  { name: 'Timalan Concepcion', uid: 'timalan concepcion' },
  { name: 'Muzon', uid: 'muzon' },
  { name: 'Malainem Bago', uid: 'malainem bago' },
  { name: 'Santulan', uid: 'santulan' },
  { name: 'Calubcob', uid: 'calubcob' },
  { name: 'Makina', uid: 'makina' },
  { name: 'San Roque', uid: 'san roque' },
  { name: 'Sabang', uid: 'sabang' },
  { name: 'Molino', uid: 'molino' },
  { name: 'Halang', uid: 'halang' },
  { name: 'Palangue 1', uid: 'palangue 1' },
  { name: 'Malainem Luma', uid: 'malainem luma' },
  { name: 'Palangue 2 & 3', uid: 'palangue 2 & 3' },
];

const SORTED_BARANGAY_OPTIONS = sortBarangays(barangayOptions);
const BARANGAY_KEYS = SORTED_BARANGAY_OPTIONS.map(option => option.uid);
const TOGGLE_ALL_BARANGAYS_KEY = '__toggle_all_barangays__';

const INITIAL_VISIBLE_COLUMNS = ['name', 'email', 'phoneNumber', 'barangay', 'actions'];

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

const Residents = () => {
  const [filterValue, setFilterValue] = React.useState('');
  const residents = useResidentsStore(state => state.residents);
  const isLoading = useResidentsStore(state => state.loading);
  const totalCount = useResidentsStore(state => state.totalCount);
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = React.useState<Selection>('all');
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const selectedBarangayCount =
    statusFilter === 'all' ? BARANGAY_KEYS.length : Array.from(statusFilter).length;
  const isAllBarangaysSelected = selectedBarangayCount === BARANGAY_KEYS.length;
  const selectedBarangayKeys = React.useMemo(
    () => (statusFilter === 'all' ? new Set(BARANGAY_KEYS) : statusFilter),
    [statusFilter]
  );
  const barangayMenuItems = React.useMemo(
    () => [
      {
        key: TOGGLE_ALL_BARANGAYS_KEY,
        label: isAllBarangaysSelected ? 'Unselect All' : 'Select All',
        isToggle: true,
      },
      ...SORTED_BARANGAY_OPTIONS.map(option => ({
        key: option.uid,
        label: capitalize(option.name),
        isToggle: false,
      })),
    ],
    [isAllBarangaysSelected]
  );

  const navigate = useNavigate();

  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns;
    return columns.filter(column => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...residents];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(filterValue.toLowerCase());
      });
    }
    if (statusFilter !== 'all' && Array.from(statusFilter).length !== barangayOptions.length) {
      filteredUsers = filteredUsers.filter(user => user.barangay && Array.from(statusFilter).includes(user.barangay));
    }

    return filteredUsers;
  }, [residents, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: ResidentTypes, b: ResidentTypes) => {
      if (sortDescriptor.column === 'name') {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        const cmp = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      } else if (sortDescriptor.column === 'createdAt' || sortDescriptor.column === 'updatedAt') {
        // Sort by Firestore timestamp
        const getSeconds = (value: FirestoreTimestamp | undefined) => {
          if (value && typeof value === 'object' && '_seconds' in value) {
            return value._seconds;
          }
          return 0;
        };
        const first = a[sortDescriptor.column as keyof ResidentTypes] as FirestoreTimestamp | undefined;
        const second = b[sortDescriptor.column as keyof ResidentTypes] as FirestoreTimestamp | undefined;
        const secA = getSeconds(first);
        const secB = getSeconds(second);
        const cmp = secA < secB ? -1 : secA > secB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      } else if (sortDescriptor.column === 'barangay') {
        const strA = (a.barangay ?? '').toLowerCase();
        const strB = (b.barangay ?? '').toLowerCase();
        const cmp = strA < strB ? -1 : strA > strB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      } else {
        const first = a[sortDescriptor.column as keyof ResidentTypes];
        const second = b[sortDescriptor.column as keyof ResidentTypes];
        const strA = (first ?? '').toString().toLowerCase();
        const strB = (second ?? '').toString().toLowerCase();
        const cmp = strA < strB ? -1 : strA > strB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      }
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((user: ResidentTypes, columnKey: React.Key) => {
    const formatTimestamp = (timestamp: FirestoreTimestamp | undefined): string => {
      if (!timestamp || typeof timestamp !== 'object' || !('_seconds' in timestamp)) {
        return '';
      }
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    switch (columnKey) {
      case 'id':
        return <span className="text-xs text-default-400">{user.id}</span>;
      case 'name':
        return (
          <User
            name={`${user.firstName || ''} ${user.lastName || ''}`}
            description={user.uid}
            avatarProps={{
              src: user.photo,
              size: 'sm',
            }}
          />
        );
      case 'email':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{user.email || '-'}</p>
          </div>
        );
      case 'phoneNumber':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{user.phoneNumber || '-'}</p>
          </div>
        );
      case 'barangay':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.barangay || '-'}</p>
          </div>
        );
      case 'createdAt':
        return <span className="text-xs text-default-400">{formatTimestamp(user.createdAt)}</span>;
      case 'updatedAt':
        return <span className="text-xs text-default-400">{formatTimestamp(user.updatedAt)}</span>;
      case 'actions':
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <EllipsisVertical className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="view"
                  onPress={() => {
                    navigate('/residents/profile', { state: { resident: user } });
                  }}
                >
                  View Profile
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return '';
    }
  }, []);

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

  const toggleBarangaySelection = React.useCallback(() => {
    setStatusFilter(prevSelection => {
      const prevCount =
        prevSelection === 'all' ? BARANGAY_KEYS.length : Array.from(prevSelection).length;
      if (prevCount === BARANGAY_KEYS.length) {
        return new Set();
      }
      return new Set(BARANGAY_KEYS);
    });
  }, [setStatusFilter]);

  const handleBarangaySelectionChange = React.useCallback(
    (keys: Selection) => {
      if (keys === 'all') {
        setStatusFilter(keys);
        return;
      }
      const selection = new Set(keys);
      if (selection.has(TOGGLE_ALL_BARANGAYS_KEY)) {
        toggleBarangaySelection();
        return;
      }
      setStatusFilter(selection);
    },
    [setStatusFilter, toggleBarangaySelection]
  );

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-3xl font-bold mb-2">Resident Lists</p>
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<Search />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown size={20} />} variant="flat">
                  Barangays
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection={false}
                aria-label="Table Columns"
                closeOnSelect={false}
                className="max-h-150 overflow-auto"
                items={barangayMenuItems}
                selectedKeys={selectedBarangayKeys}
                selectionMode="multiple"
                onSelectionChange={handleBarangaySelectionChange}
              >
                {(item: { key: string; label: string; isToggle: boolean }) => (
                  <DropdownItem
                    key={item.key}
                    className={item.isToggle ? undefined : 'capitalize'}
                    onPress={item.isToggle ? toggleBarangaySelection : undefined}
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown size={20} />} variant="flat">
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map(column => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {totalCount} resident{totalCount !== 1 ? 's' : ''}
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    hasSearchFilter,
    handleBarangaySelectionChange,
    toggleBarangaySelection,
    isAllBarangaysSelected,
    selectedBarangayKeys,
    barangayMenuItems,
  ]);

  const bottomContent = React.useMemo(() => {
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
  }, [items.length, page, pages, hasSearchFilter]);

  return (
    <Table
      isHeaderSticky
      aria-label="Residents table with custom cells, pagination and sorting"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: 'max-h-[582px]',
      }}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={headerColumns}>
        {column => (
          <TableColumn
            key={column.uid}
            align={column.uid === 'actions' ? 'center' : 'start'}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={isLoading ? 'Loading residents...' : 'No residents found'}
        items={sortedItems}
        isLoading={isLoading}
      >
        {item => (
          <TableRow key={item.uid || item.id}>
            {columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default Residents;
