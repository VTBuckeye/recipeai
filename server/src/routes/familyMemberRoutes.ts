import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from '../controllers/familyMemberController';

const router = express.Router();

// All routes require authentication
router.use(verifySession());

// GET /api/family-members - Get all family members for the user
router.get('/', getFamilyMembers);

// POST /api/family-members - Create a new family member
router.post('/', createFamilyMember);

// PUT /api/family-members/:id - Update a family member
router.put('/:id', updateFamilyMember);

// DELETE /api/family-members/:id - Delete a family member
router.delete('/:id', deleteFamilyMember);

export default router;
