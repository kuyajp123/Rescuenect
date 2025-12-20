import { types } from '@/config/constant';
import { API_ENDPOINTS } from '@/config/endPoints';
import { revokeToken } from '@/config/notificationPermission';
import { auth } from '@/lib/firebaseConfig';
import { Coordinates, EvacuationCenterFormData } from '@/types/types';
import { Button, Card, CardBody, Form, Input, Select, SelectItem, Textarea } from '@heroui/react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

const status = [
  { key: 'available', label: 'Available' },
  { key: 'full', label: 'Full' },
  { key: 'closed', label: 'Closed' },
];

const EvacuationCenterForm = ({ coordinates }: { coordinates: Coordinates | null }) => {
  const [images, setImages] = useState<(File | null)[]>([null, null, null]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    setIsLoading(true);

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
      setIsLoading(false);
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

    setIsLoading(false);
  };

  return (
    <Card className="h-full flex flex-col relative bg-content1 overflow-hidden max-h-[89vh]">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
          {/* Left Column: Form Inputs */}
          <div className="w-full">
            <p className="text-2xl font-bold mb-4 md:mb-6">Evacuation Center Form</p>
            <Form 
              id="evacuation-form"
              className="w-full flex flex-col gap-2" 
              validationErrors={errors} 
              onSubmit={onSubmit}
            >
              <Input
                label="Name"
                variant="bordered"
                labelPlacement="outside"
                name="name"
                placeholder="Enter name of center"
                classNames={{ inputWrapper: "h-10" }}
              />
              <Input
                label="Location"
                variant="bordered"
                labelPlacement="outside"
                name="location"
                placeholder="Enter location of center"
                classNames={{ inputWrapper: "h-10" }}
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
                classNames={{ inputWrapper: "h-10" }}
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
                  classNames={{ trigger: "h-10 min-h-10" }}
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
                  classNames={{ trigger: "h-10 min-h-10" }}
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
                classNames={{ inputWrapper: "h-10" }}
              />
              <Textarea
                key="description"
                name="description"
                minRows={3}
                maxRows={6}
                className="w-full mb-1"
                label="Description"
                labelPlacement="outside"
                placeholder="Enter center description"
                variant="bordered"
              />
            </Form>
          </div>

          {/* Right Column: Images */}
          <div className="h-auto flex flex-col gap-3 md:justify-end mt-4 md:mt-0">
            <div className="order-2 md:order-1">
                 {images.every(img => img === null) && errors.images && (
                    <p className="text-red-600 text-sm mt-1">{errors.images}</p>
                  )}
                  {coordinates === null && errors.coordinates && (
                    <p className="text-red-600 text-sm mt-1">{errors.coordinates}</p>
                  )}
                  {responseMessage && <p className="text-green-600 text-sm mt-1">{responseMessage}</p>}
            </div>
            <p className="text-lg font-semibold order-1 md:order-2">Insert Images</p>
            <div className="flex flex-col gap-3 h-auto order-3">
              {[0, 1, 2].map(idx => (
                <Card
                  key={idx}
                  shadow="sm"
                  className="border-2 border-dashed relative overflow-hidden border-gray-300 dark:border-gray-700 h-36 flex items-center justify-center shrink-0"
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
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="p-4 border-t border-default-200 bg-content1 z-10">
        <Button
          form="evacuation-form"
          className="w-full"
          variant="solid"
          color="primary"
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </Card>
  );
};

export default EvacuationCenterForm;
