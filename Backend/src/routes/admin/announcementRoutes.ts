import { upload } from '@/config/multer';
import { AnnouncementController } from '@/controllers/admin/Announcement.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const announcementRoutes = Router();

announcementRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

announcementRoutes.get('/all', AnnouncementController.getAnnouncements);
announcementRoutes.get('/details/:id', AnnouncementController.getAnnouncementDetails);
announcementRoutes.post('/createAnnouncement', upload.single('thumbnail'), AnnouncementController.addAnnouncement);

announcementRoutes.put('/updateAnnouncement/:id', upload.single('thumbnail'), AnnouncementController.updateAnnouncement);

announcementRoutes.delete('/deleteAnnouncement/:id', AnnouncementController.deleteAnnouncement);

export default announcementRoutes;
