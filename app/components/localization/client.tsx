'use client';
import { ReactNode } from 'react';
import { translateTree } from '../../../lib/localization/tree';
import { useLanguage } from './provider';
export default function LocalizedClient({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return translateTree(children, t);
}
