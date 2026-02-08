import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { AnnouncementDataCard } from '@/types/types';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Edit, MapPin, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AnnouncementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<AnnouncementDataCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) {
        setError('Announcement ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.ANNOUNCEMENT.GET_ANNOUNCEMENT_DETAILS, {
          params: { id },
        });
        setAnnouncement(response.data as AnnouncementDataCard);
      } catch (err) {
        console.error('Failed to load announcement details:', err);
        setError('We could not load this announcement. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  useEffect(() => {
    document.title = announcement ? `${announcement.title} - Announcement Details` : 'Announcement Details';
  });

  const handleDelete = async (): Promise<boolean> => {
    if (!id) {
      setDeleteError('Announcement ID is missing.');
      return false;
    }
    if (!user) {
      setDeleteError('You must be signed in to delete announcements.');
      return false;
    }
    try {
      setIsDeleting(true);
      setDeleteError('');
      const idToken = await user.getIdToken();
      await axios.delete(`${API_ENDPOINTS.ANNOUNCEMENT.DELETE_ANNOUNCEMENT}/${id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      navigate('/announcement');
      return true;
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      setDeleteError('We could not delete this announcement. Please try again.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(announcement?.content ?? '', {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'a',
        'ul',
        'ol',
        'li',
        'blockquote',
        'h1',
        'h2',
        'code',
        'pre',
        'img',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style'],
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
  }, [announcement?.content]);

  const formatDate = (timestamp: AnnouncementDataCard['createdAt']) => {
    const seconds = timestamp?._seconds || timestamp?.seconds || 0;
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-default-500">Loading announcement...</div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-danger">{error || 'Announcement not found.'}</p>
        <Button variant="flat" onPress={() => navigate('/announcement')}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="flat" startContent={<ArrowLeft size={16} />} onPress={() => navigate('/announcement')}>
          Back
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 items-start">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <Chip color="primary" variant="flat">
              {announcement.category.toUpperCase()}
            </Chip>
            <div className="flex items-center gap-2 text-xs text-default-500 mr-auto">
              <Clock size={12} />
              {formatDate(announcement.createdAt)}
            </div>
            <div className="flex flex-row gap-3">
              <Button
                startContent={<Edit size={16} />}
                variant="flat"
                onPress={() => navigate(`/announcement/edit/${id}`)}
              >
                Edit
              </Button>
              <Button
                startContent={<Trash size={16} />}
                variant="flat"
                color="danger"
                isDisabled={isDeleting}
                onPress={() => setIsDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}

          <div>
            <p className="text-2xl font-semibold">{announcement.title}</p>
            {announcement.subtitle && <p className="text-sm text-default-500">{announcement.subtitle}</p>}
          </div>
        </CardHeader>

        <CardBody className="space-y-5">
          {announcement.thumbnail && (
            <div className='w-full flex justify-center'>
              <Image
                src={announcement.thumbnail}
                alt={announcement.title}
                className="w-full max-h-105 object-cover rounded-xl border border-default-200"
              />
            </div>
          )}

          {announcement.barangays && announcement.barangays.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-1 text-default-500" />
              <div className="flex flex-wrap gap-2">
                {announcement.barangays.map(barangay => (
                  <Chip key={barangay} variant="flat">
                    {barangay}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div
            className="text-sm leading-relaxed text-foreground [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-default-600 dark:[&_blockquote]:border-default-500 dark:[&_blockquote]:text-default-400 [&_code]:rounded [&_code]:bg-default-100 [&_code]:px-1 [&_pre]:my-3 [&_pre]:rounded-lg [&_pre]:bg-default-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:leading-relaxed dark:[&_code]:bg-default-50 dark:[&_pre]:bg-default-50"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </CardBody>
      </Card>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete announcement?</ModalHeader>
              <ModalBody>This action cannot be undone. The announcement and its thumbnail will be removed.</ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    const ok = await handleDelete();
                    if (ok) {
                      onClose();
                    }
                  }}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AnnouncementDetails;
