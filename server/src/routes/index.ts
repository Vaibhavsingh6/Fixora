import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { userRouter } from './user.js';
import { adminRouter } from './admin.js';
import { aiRouter } from './ai.js';
import { issuesRouter } from './issues.js';
import { responsiblePeopleRouter } from './responsiblePeople.js';
import { uploadRouter } from './upload.js';

export const apiRouter = Router();

// Mount Health checks
apiRouter.use(healthRouter);

// Mount Auth endpoints
apiRouter.use('/auth', authRouter);

// Mount Protected User endpoints
apiRouter.use('/user', userRouter);

// Mount Admin-Only endpoints
apiRouter.use('/admin', adminRouter);

// Mount AI Triage endpoint (/api/analyze-issue)
apiRouter.use(aiRouter);

// Mount Image Upload endpoint (/api/upload-image)
apiRouter.use('/upload-image', uploadRouter);

// Mount Issues endpoints (/api/issues)
apiRouter.use('/issues', issuesRouter);

// Mount Responsible People directory (/api/responsible-people)
apiRouter.use('/responsible-people', responsiblePeopleRouter);
