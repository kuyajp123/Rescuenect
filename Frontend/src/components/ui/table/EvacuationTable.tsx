import { PanelSelection, usePanelStore } from '@/stores/panelStore';
import { EvacuationCenter } from '@/types/types';
import type { ChipProps, Selection, SortDescriptor } from '@heroui/react';
import { ChevronDown, EllipsisVertical, Search } from 'lucide-react';

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
import React from 'react';

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'LOCATION', uid: 'location', sortable: true },
  { name: 'CAPACITY', uid: 'capacity', sortable: true },
  { name: 'CONTACT', uid: 'contact', sortable: true },
  { name: 'TYPE', uid: 'type', sortable: true },
  { name: 'STATUS', uid: 'status', sortable: true },
  { name: 'CREATED AT', uid: 'createdAt', sortable: true },
  { name: 'ACTIONS', uid: 'actions' },
];

const statusOptions = [
  { name: 'Available', uid: 'available' },
  { name: 'Full', uid: 'full' },
  { name: 'Closed', uid: 'closed' },
];

// Remove static users array, use data prop instead

const statusColorMap: Record<string, ChipProps['color']> = {
  available: 'success',
  full: 'warning',
  closed: 'danger',
};

const INITIAL_VISIBLE_COLUMNS = ['name', 'location', 'type', 'status', 'actions'];

type User = EvacuationCenter;

interface EvacuationTableProps {
  data: EvacuationCenter[];
  onDeleteRequest: (center: EvacuationCenter) => void;
  onEditRequest: (center: EvacuationCenter) => void;
}

export default function EvacuationTable({ data, onDeleteRequest, onEditRequest }: EvacuationTableProps) {
  const [filterValue, setFilterValue] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = React.useState<Selection>('all');
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'status',
    direction: 'ascending',
  });

  const { openEvacuationPanel, closePanel, setSelectedUser } = usePanelStore();

  React.useEffect(() => {
    return () => {
      closePanel();
      setSelectedUser(null);
    };
  }, []);

  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns;
    return columns.filter(column => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = Array.isArray(data) ? [...data] : [];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(user => (user.name ?? '').toLowerCase().includes(filterValue.toLowerCase()));
    }
    if (statusFilter !== 'all' && Array.from(statusFilter).length !== statusOptions.length) {
      filteredUsers = filteredUsers.filter(user => user.status && Array.from(statusFilter).includes(user.status));
    }

    // Only show items with a name (ignore incomplete objects)
    filteredUsers = filteredUsers.filter(user => user.name);

    return filteredUsers;
  }, [data, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: User, b: User) => {
      const first = a[sortDescriptor.column as keyof User];
      const second = b[sortDescriptor.column as keyof User];
      if (sortDescriptor.column === 'capacity') {
        const numA = Number(first) || 0;
        const numB = Number(second) || 0;
        const cmp = numA < numB ? -1 : numA > numB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      } else if (sortDescriptor.column === 'createdAt') {
        // Sort by Firestore timestamp
        const getSeconds = (value: unknown) => {
          if (
            value &&
            typeof value === 'object' &&
            'seconds' in value &&
            typeof (value as { seconds: unknown }).seconds === 'number'
          ) {
            return (value as { seconds: number }).seconds;
          }
          return 0;
        };
        const secA = getSeconds(first);
        const secB = getSeconds(second);
        const cmp = secA < secB ? -1 : secA > secB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      } else {
        const strA = (first ?? '').toString().toLowerCase();
        const strB = (second ?? '').toString().toLowerCase();
        const cmp = strA < strB ? -1 : strA > strB ? 1 : 0;
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      }
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];
    switch (columnKey) {
      case 'id':
        return <span className="text-xs text-default-400">{String(cellValue)}</span>;
      case 'name':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{String(cellValue)}</p>
          </div>
        );
      case 'location':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{String(cellValue)}</p>
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{String(cellValue)}</p>
          </div>
        );
      case 'capacity':
        return <span>{String(cellValue)}</span>;
      case 'type':
        return <span className="capitalize">{String(cellValue)}</span>;
      case 'status':
        return (
          <Chip className="capitalize" color={statusColorMap[user.status ?? 'closed']} size="sm" variant="flat">
            {String(cellValue)}
          </Chip>
        );
      case 'createdAt': {
        // Firestore timestamp: { _seconds: number, _nanoseconds: number } or { seconds: number }
        let dateStr = '';
        let dateObj: Date | null = null;
        if (cellValue && typeof cellValue === 'object') {
          if ('toDate' in cellValue && typeof cellValue.toDate === 'function') {
            dateObj = cellValue.toDate();
          } else if ('_seconds' in cellValue && typeof cellValue._seconds === 'number') {
            dateObj = new Date(cellValue._seconds * 1000);
          } else if ('seconds' in cellValue && typeof cellValue.seconds === 'number') {
            dateObj = new Date(cellValue.seconds * 1000);
          }
        }
        if (dateObj) {
          dateStr = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
        return <span className="text-xs text-default-400">{dateStr}</span>;
      }
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
                    openEvacuationPanel(user);
                    setSelectedKeys(new Set());
                  }}
                >
                  View
                </DropdownItem>
                <DropdownItem key="edit" onPress={() => onEditRequest(user)}>
                  Edit
                </DropdownItem>
                <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => onDeleteRequest(user)}>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return String(cellValue);
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

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
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
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
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
            Total {Array.isArray(data) ? data.filter(d => d.name).length : 0} centers
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
  }, [filterValue, statusFilter, visibleColumns, onSearchChange, onRowsPerPageChange, data, hasSearchFilter]);

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
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <Table
      isHeaderSticky
      aria-label="Example table with custom cells, pagination and sorting"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: 'max-h-[582px]',
      }}
      selectedKeys={selectedKeys}
      selectionMode="single"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={keys => {
        setSelectedKeys(keys);

        if (keys !== 'all' && keys instanceof Set && keys.size > 0) {
          const selectedId = Array.from(keys)[0];
          const selectedUser = data.find(user => user.id === selectedId);
          console.log('Selected User:', selectedUser);
          if (selectedUser) {
            setSelectedUser(selectedUser as unknown as PanelSelection);
            openEvacuationPanel(selectedUser);
          }
        } else {
          closePanel();
        }
      }}
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
      <TableBody emptyContent={'No evacuation centers found'} items={sortedItems}>
        {item => <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
      </TableBody>
    </Table>
  );
}
