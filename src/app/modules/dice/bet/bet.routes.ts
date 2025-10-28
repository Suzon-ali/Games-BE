import { Router } from 'express';
import { BetControllers } from './bet.controller';
import { BetValidationSchemas } from './bet.validation';
import validateRequest from '../../../miiddlewares/validateRequest';
import auth from '../../../miiddlewares/auth';
import { LimboBetValidationSchemas } from '../../limbo/bet/bet.validation';
import { LimboBetControllers } from '../../limbo/bet/bet.controller';



const router = Router();

router.post(
  '/bets',
  auth('user'),
  validateRequest(BetValidationSchemas.betValidationSchema),
  BetControllers.handleBet,
);

router.post(
  '/bets/limbo',
  auth('user'),
  validateRequest(LimboBetValidationSchemas.limboBetValidationSchema),
  LimboBetControllers.handleLimboBet,
);

router.get('/next-server-seed-hash', auth('user'), BetControllers.getNextSeedHash);
router.get('/bets', BetControllers.getAllBets);
router.post('/bets/use-seed',auth('user'), BetControllers.rotateServerSeed);
router.get('/getMyBets', auth('user'), BetControllers.getMyBets)
router.post('/verify', BetControllers.verifyBet)


export const BetRoutes = router;
