import { ReactNode } from 'react';
import { translateTree } from '../../../lib/localization/tree';
import { serverTranslator } from '../../../lib/localization/server';
export default async function LocalizedServer({ children }: { children: ReactNode }) {
  return translateTree(children, await serverTranslator());
}
