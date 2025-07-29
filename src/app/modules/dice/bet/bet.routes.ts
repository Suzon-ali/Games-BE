import { Router } from 'express';
import { BetControllers } from './bet.controller';
import { BetValidationSchemas } from './bet.validation';
import validateRequest from '../../../miiddlewares/validateRequest';
import { getNextSeedHash } from '../fairness/seed.controller';
import auth from '../../../miiddlewares/auth';

const router = Router();

router.post(
  '/bets',
  auth('user'),
  validateRequest(BetValidationSchemas.betValidationSchema),
  BetControllers.handleBet,
);

router.get('/next-server-seed-hash', getNextSeedHash);
router.get('/bets', BetControllers.getAllBets);
router.post('/bets/use-seed',auth('user'), BetControllers.rotateServerSeed);
router.get('/getMyBets', auth('user'), BetControllers.getMyBets)
router.post('/verify', BetControllers.verifyBet)


export const BetRoutes = router;
