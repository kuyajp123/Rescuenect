import AddAnnouncement from '@/pages/contents/announcement/add-announcement';
import { useParams } from 'react-router-dom';

const EditAnnouncement = () => {
  const { id } = useParams();

  return <AddAnnouncement mode="edit" announcementId={id} />;
};

export default EditAnnouncement;
