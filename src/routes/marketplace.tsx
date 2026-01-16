import { createFileRoute } from '@tanstack/react-router';
import Marketplace from '../pages/Marketplace';

export const Route = createFileRoute('/marketplace')({
  component: Marketplace,
});
