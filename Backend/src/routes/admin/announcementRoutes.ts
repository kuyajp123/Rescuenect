import { upload } from '@/config/multer';
import { AnnouncementController } from '@/controllers/admin/Announcement.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const announcementRoutes = Router();

announcementRoutes.use(AuthMiddleware.verifyToken);

announcementRoutes.post('/createAnnouncement', upload.single('thumbnail'), AnnouncementController.addAnnouncement);

announcementRoutes.put('/updateAnnouncement/:id', upload.single('thumbnail'), AnnouncementController.updateAnnouncement);

announcementRoutes.delete('/deleteAnnouncement/:id', AnnouncementController.deleteAnnouncement);

export default announcementRoutes;
