import { InternalController } from '@/controllers/Internal.Controller';
import express from 'express';

const internalRouter = express.Router();

internalRouter.post('/scheduled/client-deletions/process', InternalController.processClientDeletions);

export default internalRouter;
