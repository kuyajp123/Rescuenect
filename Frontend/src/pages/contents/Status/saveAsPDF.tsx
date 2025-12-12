import { Button } from '@heroui/react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const SaveAsPDF = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const items = location.state?.items || [];
  const filters = location.state?.filters || {};
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);

    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateLong = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFilterSelection = (selection: any, options: { name: string; uid: string }[]) => {
    if (!selection || selection === 'all') return 'All';
    const selectedArray = Array.from(selection as Set<string>);
    if (selectedArray.length === options.length) return 'All';
    const names = selectedArray.map(uid => {
      const option = options.find(opt => opt.uid === uid);
      return option?.name || uid;
    });
    return names.join(', ');
  };

  const statusOptions = [
    { name: 'Active', uid: 'current' },
    { name: 'History', uid: 'history' },
    { name: 'Deleted', uid: 'deleted' },
    { name: 'Resolved', uid: 'resolved' },
  ];

  const conditionOptions = [
    { name: 'Safe', uid: 'safe' },
    { name: 'Evacuated', uid: 'evacuated' },
    { name: 'Affected', uid: 'affected' },
    { name: 'Missing', uid: 'missing' },
  ];

  const formatCategory = (category: any) => {
    if (!category) return 'N/A';
    try {
      const parsed = typeof category === 'string' ? JSON.parse(category) : category;
      return Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
    } catch {
      return String(category);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'current':
        return '#22c55e'; // green
      case 'resolved':
        return '#3b82f6'; // blue
      case 'history':
        return '#f59e0b'; // orange
      case 'deleted':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'safe':
        return '#22c55e'; // green
      case 'evacuated':
        return '#3b82f6'; // blue
      case 'affected':
        return '#f59e0b'; // orange
      case 'missing':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || items.length === 0) return;

    setIsGenerating(true);

    const opt: any = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `rescuenect-status-history-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      alert('No data to export');
      navigate(-1);
    }
  }, [items]);

  return (
    <div className="flex p-4 h-fit flex-col w-full gap-5">
      {/* Download button */}
      <div className="ml-auto">
        <Button color="primary" isIconOnly onPress={handleDownloadPDF} disabled={isGenerating}>
          <Download size={20} />
        </Button>
      </div>

      {/* PDF Content */}
      <div
        ref={contentRef}
        style={{
          backgroundColor: 'white',
          padding: '40px',
          maxWidth: '1200px',
          margin: '0 auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          height: 'fit-content',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #3b82f6',
            paddingBottom: '20px',
            marginBottom: '30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img
              src="/images/logo/logoHori.svg"
              alt="Rescuenect Logo"
              style={{ height: '60px', width: 'auto' }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                }}
              >
                Rescuenect
              </h1>
              <p
                style={{
                  margin: '5px 0 0 0',
                  fontSize: '14px',
                  color: '#6b7280',
                }}
              >
                Status History Report
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                margin: '0',
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500',
              }}
            >
              Generated Date
            </p>
            <p
              style={{
                margin: '5px 0 0 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
              }}
            >
              {new Date().toLocaleDateString('en-PH', {
                timeZone: 'Asia/Manila',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '25px',
            border: '1px solid #bfdbfe',
          }}
        >
          <p
            style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: '#1e40af',
              fontWeight: '600',
            }}
          >
            📊 Total Records: <span style={{ fontSize: '20px' }}>{items.length}</span>
          </p>

          {/* Applied Filters */}
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #bfdbfe' }}>
            <p
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#1e40af',
                fontWeight: '600',
              }}
            >
              🔍 Applied Filters:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px',
                color: '#1e40af',
              }}
            >
              {/* Search Filter */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontWeight: '600' }}>Search:</span>
                <span>{filters.search || 'None'}</span>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontWeight: '600' }}>Status:</span>
                <span>{formatFilterSelection(filters.status, statusOptions)}</span>
              </div>

              {/* Condition Filter */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontWeight: '600' }}>Condition:</span>
                <span>{formatFilterSelection(filters.condition, conditionOptions)}</span>
              </div>

              {/* Date Range Filter */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ fontWeight: '600' }}>Date Range:</span>
                <span>
                  {filters.dateRange?.start && filters.dateRange?.end
                    ? `${formatDateLong(filters.dateRange.start)} - ${formatDateLong(filters.dateRange.end)}`
                    : 'All dates'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              lineHeight: '1.4',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={tableHeaderStyle}>No.</th>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Category</th>
                <th style={tableHeaderStyle}>Condition</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>People</th>
                <th style={tableHeaderStyle}>Created At</th>
                <th style={tableHeaderStyle}>Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr
                  key={`${item.id}-${index}`}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  }}
                >
                  <td style={tableCellStyle}>{item.no}</td>
                  <td style={tableCellStyle}>
                    <strong>
                      {item.firstName} {item.lastName}
                    </strong>
                  </td>
                  <td style={tableCellStyle}>{item.email || 'N/A'}</td>
                  <td style={tableCellStyle}>
                    {item.location || 'N/A'}
                    {item.lat && item.lng && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                        ({item.lat.toFixed(4)}, {item.lng.toFixed(4)})
                      </div>
                    )}
                  </td>
                  <td style={tableCellStyle}>{formatCategory(item.originalStatus?.category)}</td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        backgroundColor: getConditionColor(item.condition),
                        borderRadius: '50px',
                      }}
                    >
                      {item.condition || 'N/A'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        color: getStatusBadgeColor(item.status),
                      }}
                    >
                      {item.status === 'current' ? 'active' : item.status || 'N/A'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{item.originalStatus?.people || 1}</td>
                  <td style={tableCellStyle}>{formatDate(item.createdAt)}</td>
                  <td style={tableCellStyle}>{item.originalStatus?.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: '0',
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            This document was automatically generated by Rescuenect System
          </p>
          <p
            style={{
              margin: '5px 0 0 0',
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            © {new Date().getFullYear()} Rescuenect. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#374151',
  borderBottom: '2px solid #d1d5db',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px 8px',
  color: '#4b5563',
  verticalAlign: 'middle',
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  color: 'white',
  fontSize: '10px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  display: 'inline-block',
  textAlign: 'center',
  verticalAlign: 'middle',
  lineHeight: '1',
};

export default SaveAsPDF;
