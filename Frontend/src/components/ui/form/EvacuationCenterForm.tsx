import { types } from '@/config/constant';
import { API_ENDPOINTS } from '@/config/endPoints';
import { revokeToken } from '@/config/notificationPermission';
import { auth } from '@/lib/firebaseConfig';
import { Coordinates, EvacuationCenterFormData } from '@/types/types';
import { Button, Card, CardBody, Form, Input, Select, SelectItem, Textarea } from '@heroui/react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { Plus } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_NAME_LENGTH = 100;
const MAX_LOCATION_LENGTH = 200;
const MAX_CONTACT_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGES = 3;

const readFieldErrors = (error: unknown): Record<string, string> | null => {
  if (!axios.isAxiosError(error)) return null;
  const fieldErrors = error.response?.data?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object' || Array.isArray(fieldErrors)) return null;

  return Object.fromEntries(
    Object.entries(fieldErrors).filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
  ) as Record<string, string>;
};

const status = [
  { key: 'available', label: 'Available' },
  { key: 'full', label: 'Full' },
  { key: 'closed', label: 'Closed' },
];

const EvacuationCenterForm = ({ coordinates }: { coordinates: Coordinates | null }) => {
  const [images, setImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const user = auth.currentUser;
  const navigate = useNavigate();

  const imagePreviewUrls = useMemo(() => images.map(file => URL.createObjectURL(file)), [images]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const addImages = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const selected = Array.from(selectedFiles);
    const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
    const willTruncate = selected.length > remainingSlots;

    setImages(prev => {
      const next = [...prev];
      for (const file of selected) {
        if (next.length >= MAX_IMAGES) break;
        next.push(file);
      }
      return next;
    });

    if (willTruncate) {
      setErrors(prev => ({ ...prev, images: `You can only upload up to ${MAX_IMAGES} images` }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.images;
        return copy;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.images;
      return copy;
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
    } else if (data.name.trim().length > MAX_NAME_LENGTH) {
      validationErrors.name = `Name should not exceed ${MAX_NAME_LENGTH} characters`;
    }
    if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
      validationErrors.location = 'Location is required';
    } else if (data.location.trim().length > MAX_LOCATION_LENGTH) {
      validationErrors.location = `Location should not exceed ${MAX_LOCATION_LENGTH} characters`;
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
    if (typeof data.contact === 'string' && data.contact.trim().length > MAX_CONTACT_LENGTH) {
      validationErrors.contact = `Contact should not exceed ${MAX_CONTACT_LENGTH} characters`;
    }
    if (typeof data.description === 'string' && data.description.trim().length > MAX_DESCRIPTION_LENGTH) {
      validationErrors.description = `Description should not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }
    if (images.length === 0) {
      validationErrors.images = 'At least one image is required';
    } else if (images.length > MAX_IMAGES) {
      validationErrors.images = `You can only upload up to ${MAX_IMAGES} images`;
    }
    if (coordinates === null) {
      validationErrors.coordinates = 'Click the map to set the evacuation center location';
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

    images.slice(0, MAX_IMAGES).forEach(img => form.append('images', img));

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
      setImages([]);
      navigate('/evacuation');
    } catch (error) {
      console.error('Error submitting evacuation center form:', error);
      const fieldErrors = readFieldErrors(error);
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: `Failed to submit form. ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
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
                isRequired
                label="Name"
                variant="bordered"
                labelPlacement="outside"
                name="name"
                placeholder="Enter name of center"
                classNames={{ inputWrapper: 'h-10' }}
                onInput={e => {
                  const v = (e.target as HTMLInputElement).value || '';
                  if (v.length > MAX_NAME_LENGTH) {
                    setErrors(prev => ({ ...prev, name: `Name should not exceed ${MAX_NAME_LENGTH} characters` }));
                  } else {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.name;
                      return copy;
                    });
                  }
                }}
              />
              <Input
                isRequired
                label="Location"
                variant="bordered"
                labelPlacement="outside"
                name="location"
                placeholder="Enter location of center"
                classNames={{ inputWrapper: 'h-10' }}
                onInput={e => {
                  const v = (e.target as HTMLInputElement).value || '';
                  if (v.length > MAX_LOCATION_LENGTH) {
                    setErrors(prev => ({
                      ...prev,
                      location: `Location should not exceed ${MAX_LOCATION_LENGTH} characters`,
                    }));
                  } else {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.location;
                      return copy;
                    });
                  }
                }}
              />
              <Input
                isRequired
                label="Capacity"
                labelPlacement="outside"
                variant="bordered"
                name="capacity"
                placeholder="Enter capacity of center"
                type="number"
                min={1}
                inputMode="numeric"
                pattern="[0-9]*"
                classNames={{ inputWrapper: 'h-10' }}
              />
              <div className=" w-full flex flex-col">
                <Select
                  isRequired
                  label="Select type of center"
                  labelPlacement="outside"
                  variant="bordered"
                  placeholder="Select type"
                  name="type"
                  maxListboxHeight={400}
                  items={types}
                  classNames={{ trigger: 'h-10 min-h-10' }}
                >
                  {types => <SelectItem key={types.key}>{types.label}</SelectItem>}
                </Select>
              </div>
              <div className=" w-full flex flex-col">
                <Select
                  isRequired
                  label="Select status of center"
                  labelPlacement="outside"
                  variant="bordered"
                  placeholder="Select status"
                  name="status"
                  maxListboxHeight={280}
                  items={status}
                  classNames={{ trigger: 'h-10 min-h-10' }}
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
                classNames={{ inputWrapper: 'h-10' }}
                onInput={e => {
                  const v = (e.target as HTMLInputElement).value || '';
                  if (v.length > MAX_CONTACT_LENGTH) {
                    setErrors(prev => ({
                      ...prev,
                      contact: `Contact should not exceed ${MAX_CONTACT_LENGTH} characters`,
                    }));
                  } else {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.contact;
                      return copy;
                    });
                  }
                }}
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
                onInput={e => {
                  const v = (e.target as HTMLTextAreaElement).value || '';
                  if (v.length > MAX_DESCRIPTION_LENGTH) {
                    setErrors(prev => ({
                      ...prev,
                      description: `Description should not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
                    }));
                  } else {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.description;
                      return copy;
                    });
                  }
                }}
              />
            </Form>
          </div>

          {/* Right Column: Images */}
          <div className="h-auto flex flex-col gap-3 md:justify-start mt-4 md:mt-0">
            <div className="order-2 md:order-1">
              {errors.images && <p className="text-red-600 text-sm mt-1">{errors.images}</p>}
              {coordinates === null && errors.coordinates && (
                <p className="text-red-600 text-sm mt-1">{errors.coordinates}</p>
              )}
              {responseMessage && <p className="text-green-600 text-sm mt-1">{responseMessage}</p>}
            </div>
            <p className="text-lg font-semibold order-1 md:order-2">
              Insert Images <span className="text-red-500 text-sm">*</span>
            </p>
            <div className="flex flex-col gap-3 h-auto order-3">
              {images.length < MAX_IMAGES && (
                <Card
                  shadow="sm"
                  className="border-2 border-dashed relative overflow-hidden border-gray-300 dark:border-gray-700 h-36 flex items-center justify-center shrink-0"
                >
                  <CardBody className="p-0 h-full w-full">
                    <button
                      type="button"
                      className="flex flex-col items-center gap-2 justify-center h-full w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <p className="text-gray-500">Add Images</p>
                      {images.length ? (
                        <p className="text-xs text-gray-400">{`${images.length} / ${MAX_IMAGES} added`}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Click to add images</p>
                      )}
                      <Plus color="gray" size={30} />
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        addImages(e.target.files);
                        e.currentTarget.value = '';
                      }}
                    />
                  </CardBody>
                </Card>
              )}

              {images.length > 0 && (
                <div className="flex flex-col gap-3">
                  {images.map((file, idx) => (
                    <Card
                      key={`${file.name}-${file.lastModified}-${idx}`}
                      shadow="sm"
                      className="relative overflow-hidden h-40"
                    >
                      <CardBody className="p-0 h-full w-full">
                        <img
                          src={imagePreviewUrls[idx]}
                          alt={`Preview ${idx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white/80 text-red-600 px-2 py-1 rounded shadow hover:bg-white text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                        >
                          Remove
                        </button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
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
