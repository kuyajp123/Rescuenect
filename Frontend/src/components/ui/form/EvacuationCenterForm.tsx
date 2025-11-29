import { API_ENDPOINTS } from '@/config/endPoints';
import { revokeToken } from '@/config/notificationPermission';
import { auth } from '@/lib/firebaseConfig';
import { Coordinates, EvacuationCenterFormData } from '@/types/types';
import { Button, Card, CardBody, Form, Input, Select, SelectItem, Textarea } from '@heroui/react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

const types = [
  { key: 'school', label: 'School' },
  { key: 'barangay hall', label: 'Barangay Hall' },
  { key: 'gymnasium', label: 'Gymnasium' },
  { key: 'church', label: 'Church' },
  { key: 'government building', label: 'Government Building' },
  { key: 'private facility', label: 'Private Facility' },
  { key: 'vacant building', label: 'Vacant Building' },
  { key: 'covered court', label: 'Covered Court' },
  { key: 'other', label: 'Other' },
];

const status = [
  { key: 'available', label: 'Available' },
  { key: 'full', label: 'Full' },
  { key: 'closed', label: 'Closed' },
];

const EvacuationCenterForm = ({ coordinates }: { coordinates: Coordinates | null }) => {
  const [images, setImages] = useState<(File | null)[]>([null, null, null]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [responseMessage, setResponseMessage] = useState<string>('');
  const user = auth.currentUser;

  // Handle image selection
  const handleImageChange = (index: number, file: File | null) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as { [k: string]: FormDataEntryValue };

    // Basic validation
    const validationErrors: Record<string, string> = {};
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      validationErrors.name = 'Name is required';
    }
    if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
      validationErrors.location = 'Location is required';
    }
    if (!data.capacity || typeof data.capacity !== 'string' || parseInt(data.capacity) <= 0) {
      validationErrors.capacity = 'Capacity must be a positive number';
    }
    if (!data.type || typeof data.type !== 'string' || !data.type.trim()) {
      validationErrors.type = 'Type is required';
    }
    if (!data.status || typeof data.status !== 'string' || !data.status.trim()) {
      validationErrors.status = 'Status is required';
    }
    if (images.every(img => img === null)) {
      validationErrors.images = 'At least one image is required';
    }
    if (coordinates === null) {
      validationErrors.coordinates = 'Please select a location on the map';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user) {
      revokeToken();
      await signOut(auth);
      // navigate('/auth/login');
      return;
    }

    const token = await user?.getIdToken();

    setErrors({});

    const form = new FormData();

    const finalData: EvacuationCenterFormData = {
      name: data.name as string,
      location: data.location as string,
      coordinates: coordinates,
      capacity: data.capacity as string,
      type: data.type as EvacuationCenterFormData['type'],
      status: data.status as EvacuationCenterFormData['status'],
      contact: data.contact ? (data.contact as string) : undefined,
      description: data.description ? (data.description as string) : undefined,
    };

    form.append('data', JSON.stringify(finalData));

    images.forEach(img => {
      if (img) {
        form.append('images', img);
      }
    });

    try {
      const response = await axios.post(API_ENDPOINTS.EVACUATION.ADD_CENTER, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setResponseMessage((response.data as any).message);
      // Optionally reset form or show success message
      if (e.currentTarget && typeof e.currentTarget.reset === 'function') {
        e.currentTarget.reset();
      }
      setImages([null, null, null]);
      // navigate('/evacuation');
    } catch (error) {
      console.error('Error submitting evacuation center form:', error);
      setErrors({ submit: `Failed to submit form. ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  return (
    <Card className="h-full p-4 grid grid-cols-2 gap-4 relative">
      <div>
        <p className="text-2xl font-bold mb-12">Evacuation Center Form</p>
        <Form className="w-full flex flex-col gap-3" validationErrors={errors} onSubmit={onSubmit}>
          <Input
            label="Name"
            variant="bordered"
            labelPlacement="outside"
            name="name"
            placeholder="Enter name of center"
          />
          <Input
            label="Location"
            variant="bordered"
            labelPlacement="outside"
            name="location"
            placeholder="Enter location of center"
          />
          <Input
            label="Capacity"
            labelPlacement="outside"
            variant="bordered"
            name="capacity"
            placeholder="Enter capacity of center"
            type="number"
            min={1}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <div className=" w-full flex flex-col">
            <Select
              label="Select type of center"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Select type"
              name="type"
              maxListboxHeight={400}
              items={types}
            >
              {types => <SelectItem key={types.key}>{types.label}</SelectItem>}
            </Select>
          </div>
          <div className=" w-full flex flex-col">
            <Select
              label="Select status of center"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Select status"
              name="status"
              maxListboxHeight={280}
              items={status}
            >
              {status => <SelectItem key={status.key}>{status.label}</SelectItem>}
            </Select>
          </div>
          <Input
            label="Contact"
            variant="bordered"
            labelPlacement="outside"
            name="contact"
            placeholder="Enter contact information"
          />
          <Textarea
            key="description"
            name="description"
            className="col-span-12 md:col-span-6 mb-6 md:mb-0"
            label="Description"
            labelPlacement="outside"
            placeholder="Enter center description"
            variant="bordered"
          />
          <Button className="absolute bottom-4 right-4" variant="solid" color="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
      <div className="h-full flex flex-col gap-3 justify-end">
        <p className="text-lg font-semibold">Insert Images</p>
        <div className="h-[87%] flex flex-col gap-3">
          {[0, 1, 2].map(idx => (
            <Card
              key={idx}
              shadow="sm"
              className="border-2 border-dashed relati</div>ve overflow-hidden border-gray-300 dark:border-gray-700 h-48 flex items-center justify-center"
            >
              <CardBody className="p-0 h-full w-full">
                {images[idx] ? (
                  <div className="relative h-full w-full">
                    <img
                      src={URL.createObjectURL(images[idx] as File)}
                      alt={`Preview ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white/80 text-red-600 px-2 py-1 rounded shadow hover:bg-white"
                      onClick={e => {
                        e.stopPropagation();
                        handleImageChange(idx, null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center gap-3 justify-center h-full w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => document.getElementById(`image-input-${idx}`)?.click()}
                  >
                    <p className="text-gray-500">Add Image</p>
                    <Plus color="gray" size={30} />
                    <input
                      id={`image-input-${idx}`}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        handleImageChange(idx, file);
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
          {images.every(img => img === null) && errors.images && (
            <p className="text-red-600 text-sm mt-1">{errors.images}</p>
          )}
          {coordinates === null && errors.coordinates && (
            <p className="text-red-600 text-sm mt-1">{errors.coordinates}</p>
          )}
          {responseMessage && <p className="text-green-600 text-sm mt-1">{responseMessage}</p>}
        </div>
      </div>
    </Card>
  );
};

export default EvacuationCenterForm;
