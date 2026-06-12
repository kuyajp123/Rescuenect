import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Textarea,
  addToast,
} from '@heroui/react';
import axios from 'axios';
import { Edit2, GripVertical, Image, Plus, Trash2, UploadCloud } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MIN_SLIDES = 2;
const MAX_SLIDES = 4;

interface CarouselSlide {
  id: string;
  clientId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  order: number;
}

interface DraftSlide extends CarouselSlide {
  imageFile?: File | null;
  isNew?: boolean;
  isEdited?: boolean;
}

interface SlideFormState {
  title: string;
  subtitle: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const emptyForm = (): SlideFormState => ({
  title: '',
  subtitle: '',
  description: '',
  imageFile: null,
  imagePreview: null,
});

function SortableSlideCard({
  slide,
  onEdit,
  onDelete,
}: {
  slide: DraftSlide;
  onEdit: (slide: DraftSlide) => void;
  onDelete: (slide: DraftSlide) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative touch-none">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-black/70 transition-colors"
      >
        <GripVertical size={16} />
      </div>

      <Card className="overflow-hidden border-2 border-transparent hover:border-primary-500/50 dark:hover:border-primary-400/50 transition-colors shadow-sm h-full">
        <div className="absolute top-2 left-2 z-10 flex gap-1 pointer-events-none">
          <div className="bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{slide.order}</div>
          {slide.isNew && (
            <div className="bg-success/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">New</div>
          )}
          {slide.isEdited && !slide.isNew && (
            <div className="bg-primary/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">Edited</div>
          )}
        </div>

        <div className="relative h-40 bg-default-100 overflow-hidden">
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="flex items-center justify-center h-full text-default-400">
              <Image size={40} />
            </div>
          )}
        </div>

        <CardBody className="gap-2 p-4">
          <p className="font-semibold text-sm truncate pointer-events-none text-default-900 dark:text-white">{slide.title}</p>
          {slide.subtitle && <p className="text-xs text-default-500 dark:text-default-400 truncate pointer-events-none">{slide.subtitle}</p>}
          {slide.description && (
            <p className="text-xs text-default-400 dark:text-default-500 line-clamp-2 pointer-events-none">{slide.description}</p>
          )}
          <div className="flex gap-2 pt-2 mt-auto">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Edit2 size={14} />}
              onPress={() => onEdit(slide)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<Trash2 size={14} />}
              onPress={() => onDelete(slide)}
            >
              Delete
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function CarouselSetup() {
  const navigate = useNavigate();
  const updateUserData = useAuth(state => state.updateUserData);
  const resetOnboardingStore = useOnboardingStore(state => state.reset);
  const user = auth.currentUser;

  const [slides, setSlides] = useState<DraftSlide[]>([]);
  const [serverSlides, setServerSlides] = useState<DraftSlide[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<DraftSlide | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<DraftSlide | null>(null);

  const [form, setForm] = useState<SlideFormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof SlideFormState, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSlides = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.get(API_ENDPOINTS.CAROUSEL.GET_ALL, { headers });
      const fetched: CarouselSlide[] = data.slides ?? [];
      setSlides(fetched);
      setServerSlides(fetched);
      setDeletedIds([]);
      setHasChanges(false);
    } catch {
      // Don't toast error on setup if it's just empty
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const openAdd = () => {
    setEditingSlide(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (slide: DraftSlide) => {
    setEditingSlide(slide);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      imageFile: slide.imageFile ?? null,
      imagePreview: slide.imageUrl,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlide(null);
    setForm(emptyForm());
    setErrors({});
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, imageFile: file, imagePreview: preview }));
  };

  const validateForm = (): boolean => {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!editingSlide && !form.imageFile) errs.imageFile = 'Image is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleModalDone = () => {
    if (!validateForm()) return;

    if (editingSlide) {
      setSlides(prev =>
        prev.map(s =>
          s.id === editingSlide.id
            ? {
                ...s,
                title: form.title.trim(),
                subtitle: form.subtitle.trim(),
                description: form.description.trim(),
                imageUrl: form.imagePreview || s.imageUrl,
                imageFile: form.imageFile || s.imageFile,
                isEdited: true,
              }
            : s
        )
      );
    } else {
      const newSlide: DraftSlide = {
        id: `temp-${Date.now()}`,
        clientId: '',
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        imageUrl: form.imagePreview || '',
        order: slides.length + 1,
        imageFile: form.imageFile,
        isNew: true,
      };
      setSlides(prev => [...prev, newSlide]);
    }

    setHasChanges(true);
    closeModal();
  };

  const promptDelete = (slide: DraftSlide) => {
    setSlideToDelete(slide);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!slideToDelete) return;

    if (!slideToDelete.isNew) {
      setDeletedIds(prev => [...prev, slideToDelete.id]);
    }

    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== slideToDelete.id);
      return filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    });

    setHasChanges(true);
    setDeleteConfirmOpen(false);
    setSlideToDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSlides(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
      });
      setHasChanges(true);
    }
  };

  const handleCompleteSetup = async () => {
    if (slides.length < MIN_SLIDES || slides.length > MAX_SLIDES) {
      addToast({ title: `Carousel must have between ${MIN_SLIDES} and ${MAX_SLIDES} slides.`, color: 'danger' });
      return;
    }

    setIsSaving(true);
    try {
      const token = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Save Carousel slides
      const fd = new FormData();
      const payloadSlides = slides.map(slide => {
        const imageFieldName = `image_${slide.id}`;
        if (slide.imageFile) {
          fd.append(imageFieldName, slide.imageFile);
        }
        return {
          id: slide.id,
          isNew: !!slide.isNew,
          isEdited: !!slide.isEdited,
          title: slide.title,
          subtitle: slide.subtitle,
          description: slide.description,
          order: slide.order,
          imageFieldName: slide.imageFile ? imageFieldName : undefined,
        };
      });

      fd.append('payload', JSON.stringify({ slides: payloadSlides, deletedIds }));

      await axios.put(API_ENDPOINTS.CAROUSEL.SAVE_ALL, fd, { headers });

      // 2. Mark onboarding complete in backend
      await axios.post(API_ENDPOINTS.AUTH.COMPLETE_ONBOARDING, {}, { headers });

      addToast({ title: 'Setup completed successfully!', color: 'success' });

      // 3. Update local user state and redirect
      updateUserData({ onboardingComplete: true });
      resetOnboardingStore();
      navigate('/');
    } catch (err: any) {
      console.error('Setup completion failed:', err);
      const msg = err?.response?.data?.message ?? 'Failed to complete setup. Please try again.';
      addToast({ title: msg, color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const canAdd = slides.length < MAX_SLIDES;
  const canSave = slides.length >= MIN_SLIDES && slides.length <= MAX_SLIDES;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 animate-fade-in-up py-10 w-full">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2 mb-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Final Step: Resident App Carousel</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Set up the image carousel that your residents will see on their mobile app home screen.
          </p>
        </div>

        {/* Slides grid - Sortable */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="rounded-xl h-56 w-full" />
            ))}
          </div>
        ) : slides.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map(s => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {slides.map(slide => (
                  <SortableSlideCard key={slide.id} slide={slide} onEdit={openEdit} onDelete={promptDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 bg-default-50 dark:bg-default-100/50 rounded-2xl border-2 border-dashed border-default-300 dark:border-default-200 text-default-500 ">
            <div className="p-4 bg-white dark:bg-default-200 rounded-full shadow-sm">
              <Image size={48} className="text-default-500 dark:text-default-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-default-700 dark:text-default-300 text-lg">No slides added yet</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">
                Add at least {MIN_SLIDES} slides to display on the home screen.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button color="primary" startContent={<Plus size={16} />} onPress={openAdd}>
                Add First Slide
              </Button>
            </div>
          </div>
        )}

        {/* Action Bar (Moved to bottom) */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-default-200 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Chip
              color={slides.length >= MAX_SLIDES ? 'danger' : slides.length < MIN_SLIDES ? 'warning' : 'success'}
              variant="flat"
              size="lg"
              className="font-medium"
            >
              {slides.length} / {MAX_SLIDES} slides
            </Chip>
            {slides.length < MIN_SLIDES && (
              <span className="text-sm text-warning-600 dark:text-warning-500 font-medium hidden sm:inline-block">
                Add at least {MIN_SLIDES} slides to proceed
              </span>
            )}
            {hasChanges && serverSlides.length > 0 && (
              <Button
                size="sm"
                color="default"
                variant="flat"
                onPress={() => {
                  setSlides(serverSlides);
                  setDeletedIds([]);
                  setHasChanges(false);
                }}
              >
                Revert Changes
              </Button>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              // color="secondary"
              variant="flat"
              startContent={<Plus size={16} />}
              onPress={openAdd}
              isDisabled={!canAdd || isLoading || isSaving}
              className="flex-1 sm:flex-none"
            >
              Add Slide
            </Button>
            <Button
              color="primary"
              onPress={handleCompleteSetup}
              isLoading={isSaving}
              isDisabled={!canSave || isLoading}
              className="font-bold shadow-md flex-1 sm:flex-none"
            >
              Complete Setup
            </Button>
          </div>
        </div>

        {/* Add / Edit Draft Modal */}
        <Modal isOpen={modalOpen} onClose={closeModal} size="lg" scrollBehavior="inside">
          <ModalContent>
            {() => (
              <>
                <ModalHeader>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</ModalHeader>
                <ModalBody className="gap-4">
                  {/* Image upload */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Image {!editingSlide && <span className="text-danger">*</span>}
                    </label>
                    <div
                      className="relative flex flex-col items-center justify-center gap-2 h-44 rounded-xl border-2 border-dashed border-default-300 bg-default-50 cursor-pointer hover:border-primary transition-colors overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {form.imagePreview ? (
                        <img
                          src={form.imagePreview}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <>
                          <UploadCloud size={28} className="text-default-400" />
                          <p className="text-xs text-default-400">Click to upload image</p>
                          <p className="text-xs text-default-300">JPEG, PNG, WEBP · max 10 MB</p>
                        </>
                      )}
                      {form.imagePreview && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                          Click to change
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {errors.imageFile && <p className="text-xs text-danger">{errors.imageFile}</p>}
                  </div>

                  <Input
                    label="Title"
                    labelPlacement="outside"
                    placeholder="Enter slide title"
                    isRequired
                    maxLength={60}
                    value={form.title}
                    onValueChange={v => setForm(p => ({ ...p, title: v }))}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    description={`${form.title.length}/60`}
                  />

                  <Input
                    label="Subtitle"
                    labelPlacement="outside"
                    placeholder="Enter slide subtitle (optional)"
                    maxLength={80}
                    value={form.subtitle}
                    onValueChange={v => setForm(p => ({ ...p, subtitle: v }))}
                    description={`${form.subtitle.length}/80`}
                  />

                  <Textarea
                    label="Description"
                    labelPlacement="outside"
                    placeholder="Enter slide description (optional)"
                    maxLength={300}
                    minRows={3}
                    value={form.description}
                    onValueChange={v => setForm(p => ({ ...p, description: v }))}
                    description={`${form.description.length}/300`}
                  />
                </ModalBody>

                <ModalFooter>
                  <Button variant="flat" onPress={closeModal}>
                    Cancel
                  </Button>
                  <Button color="primary" onPress={handleModalDone}>
                    Save Slide
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} size="sm">
          <ModalContent>
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
              <p className="text-sm">
                Are you sure you want to delete the slide <strong>{slideToDelete?.title}</strong>?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button color="danger" onPress={confirmDelete}>
                Remove
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
