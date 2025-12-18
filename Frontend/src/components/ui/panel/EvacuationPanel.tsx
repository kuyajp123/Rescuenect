import { Map } from '@/components/ui/Map';
import { types } from '@/config/constant';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import axios from 'axios';
import { Pencil, Save, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const EvacuationPanel = ({ data }: { data: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data?.type === 'evacuation' && data.data) {
      setFormData({
        name: data.data.name,
        status: data.data.status,
        type: data.data.type,
        capacity: data.data.capacity,
        contact: data.data.contact,
        location: data.data.location,
        description: data.data.description,
        lat: data.data.coordinates?.lat || 14.2965,
        lng: data.data.coordinates?.lng || 120.7925,
      });
      setExistingImages(data.data.images || []);
      setNewImages([]);
      setIsEditing(false); // Reset editing mode when data changes
    }
  }, [data]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const totalImages = existingImages.length + newImages.length + filesArray.length;
      if (totalImages > 3) {
        alert('You can only have a maximum of 3 images.');
        return;
      }
      setNewImages([...newImages, ...filesArray]);
    }
  };

  const removeExistingImage = (imgUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imgUrl));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    const token = await user?.getIdToken();

    if (!token) {
      console.error('User is not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      const updatedData = {
        id: data.data.id,
        name: formData.name,
        status: formData.status,
        type: formData.type,
        capacity: formData.capacity,
        contact: formData.contact,
        location: formData.location,
        description: formData.description,
        coordinates: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        keptImages: existingImages,
      };

      submitData.append('data', JSON.stringify(updatedData));
      
      newImages.forEach(file => {
        submitData.append('images', file);
      });

      await axios.put(API_ENDPOINTS.EVACUATION.UPDATE_CENTER, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh data via callback
      if (data.onUpdate) {
        data.onUpdate();
      }
      setIsEditing(false);

    } catch (error) {
      console.error('Error updating evacuation center:', error);
      alert('Failed to update evacuation center.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!data?.data || data.type !== 'evacuation') {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No evacuation center selected.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto gap-4">
      {/* Map Section */}
      <div className="h-[250px] relative rounded-lg overflow-hidden shrink-0">
        <Map
          key={`map-evacuation-${data.data.id}-${isEditing ? 'edit' : 'view'}`}
          data={[
            {
              uid: data.data.id,
              lat: isEditing ? formData.lat : (data.data.coordinates?.lat ?? 0),
              lng: isEditing ? formData.lng : (data.data.coordinates?.lng ?? 0),
            },
          ]}
          center={isEditing ? [formData.lat, formData.lng] : (data.data.coordinates ? [data.data.coordinates.lat, data.data.coordinates.lng] : [14.2965, 120.7925])}
          hasMapStyleSelector={false}
          zoomControl={isEditing} // Enable controls when editing
          dragging={true}
          hasMapControl={false}
          zoom={15}
          onMapClick={isEditing ? (coords) => setFormData({ ...formData, ...coords }) : undefined}
          markerType="default"
          attribution={''}
        />
        {isEditing && (
          <div className="absolute top-2 right-2 z-[9999] bg-white/90 dark:bg-black/90 dark:text-white p-2 rounded text-xs shadow">
            Click map to set location
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{isEditing ? 'Edit Details' : data.data.name}</h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" color="primary" variant="flat" endContent={<Pencil size={16} />} onPress={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <>
              <Button size="sm" color="danger" variant="light" onPress={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" color="primary" endContent={<Save size={16} />} onPress={handleSave} isLoading={isLoading}>
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Details/Form Section */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        {isEditing ? (
          <div className="flex flex-col gap-4">
             <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Status"
              selectedKeys={formData.status ? [formData.status] : []}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <SelectItem key="available">Available</SelectItem>
              <SelectItem key="full">Full</SelectItem>
              <SelectItem key="closed">Closed</SelectItem>
            </Select>

             <Select
              label="Type"
              items={types}
              selectedKeys={formData.type ? [formData.type] : []}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
              <Input
                label="Contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            
            <Input
              label="Location Name"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
             
             <div className="hidden">
                <Input
                  label="Lat"
                  type="number"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                />
                <Input
                  label="Lng"
                  type="number"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                />
             </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <p className="text-sm font-semibold mb-2">Images (Max 3)</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* Existing */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group flex-shrink-0 w-80 h-60">
                    <img src={url} alt="Existing" className="w-full h-full object-cover rounded-lg border shadow-sm" />
                    <button onClick={() => removeExistingImage(url)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {/* New */}
                {newImages.map((file, index) => (
                   <div key={`new-${index}`} className="relative group flex-shrink-0 w-80 h-60">
                    <img src={URL.createObjectURL(file)} alt="New" className="w-full h-full object-cover rounded-lg border border-primary shadow-sm" />
                    <button onClick={() => removeNewImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {/* Upload Button */}
                {(existingImages.length + newImages.length) < 3 && (
                   <label className="flex-shrink-0 w-80 h-60 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800">
                      <Upload size={32} className="text-gray-400" />
                      <span className="text-sm mt-2 text-gray-500">Add Image</span>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                   </label>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col gap-4">
             {/* Read-only View */}
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <p className="capitalize font-medium">{data.data.status}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Type</p>
                  <p className="capitalize font-medium">{data.data.type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Capacity</p>
                  <p className="font-medium">{data.data.capacity}</p>
                </div>
                 <div>
                  <p className="text-gray-500 text-xs">Contact</p>
                  <p className="font-medium">{data.data.contact}</p>
                </div>
             </div>
             
             <div>
                <p className="text-gray-500 text-xs">Location</p>
                <p className="font-medium">{data.data.location}</p>
                <p className="text-xs text-gray-400 mt-1">({data.data.coordinates?.lat}, {data.data.coordinates?.lng})</p>
             </div>

             <div>
                <p className="text-gray-500 text-xs">Description</p>
                <p className="text-sm mt-1">{data.data.description}</p>
             </div>

             <div>
                <p className="text-gray-500 text-xs mb-2">Images</p>
                <div className="flex p-4 gap-2 overflow-x-auto">
                  {data.data.images?.map((imgUrl: string, index: number) => (
                    <img key={index} src={imgUrl} alt="Center" className="w-100 h-auto object-cover rounded" />
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
