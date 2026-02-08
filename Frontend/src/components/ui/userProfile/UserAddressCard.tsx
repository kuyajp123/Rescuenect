import Label from '@/components/ui/forms/Label';
import { barangays } from '@/config/constant';
import { sortBarangays } from '@/helper/commonHelpers';
import { UserData } from '@/stores/useAuth';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';

interface UserAddressCardProps {
  userData: UserData | null;
  onUpdate: (data: Partial<UserData>) => Promise<void>;
}

export default function UserAddressCard({ userData, onUpdate }: UserAddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    barangay: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const sortedBarangays = useMemo(() => sortBarangays(barangays), []);

  useEffect(() => {
    if (userData) {
      setFormData({
        barangay: userData.barangay || '',
        address: userData.address || '',
      });
    }
  }, [userData]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userData) {
      setFormData({
        barangay: userData.barangay || '',
        address: userData.address || '',
      });
    }
  };

  const selectedBarangayLabel =
    sortedBarangays.find(b => b.value === userData?.barangay)?.label || userData?.barangay || '-';

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Address</h4>

            {/* Action Buttons */}
            {isEditing ? (
              <div className="flex gap-3">
                <Button size="sm" color="danger" variant="light" onPress={handleCancel} isDisabled={isLoading}>
                  Cancel
                </Button>
                <Button size="sm" color="primary" onPress={handleSave} isLoading={isLoading}>
                  Save
                </Button>
              </div>
            ) : (
              <Button
                onPress={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                  />
                </svg>
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              {!isEditing && <Label>Barangay</Label>}
              {isEditing ? (
                <Select
                  placeholder="Select a barangay"
                  selectedKeys={formData.barangay ? [formData.barangay] : []}
                  onChange={e => setFormData(prev => ({ ...prev, barangay: e.target.value }))}
                  variant="bordered"
                  items={sortedBarangays}
                  aria-label="Select Barangay"
                  label="Barangay"
                  labelPlacement="outside"
                >
                  {item => <SelectItem key={item.value}>{item.label}</SelectItem>}
                </Select>
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedBarangayLabel}</p>
              )}
            </div>

            <div>
              {!isEditing && <Label>Address</Label>}
              {isEditing ? (
                <Input
                  type="text"
                  variant="bordered"
                  placeholder="Address"
                  value={formData.address}
                  onValueChange={val => setFormData(prev => ({ ...prev, address: val }))}
                  label="Address"
                  labelPlacement="outside"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{userData?.address || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
