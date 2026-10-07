import { Children, cloneElement, isValidElement, ReactNode, ReactElement } from 'react';
// Translate render output, never mutate the DOM or the values submitted by forms.
// Dictionaries contain authored text only. User content is explicitly marked translate=no.
const attributes = ['aria-label', 'aria-description', 'aria-valuetext', 'title', 'alt', 'placeholder', 'label'] as const;
const opaqueTags = new Set(['code', 'script', 'style', 'textarea']);
export function translateTree(node: ReactNode, t: (text: string) => string): ReactNode {
  if (typeof node === 'string') return t(node);
  if (Array.isArray(node)) return Children.map(node, child => translateTree(child, t));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props.translate === 'no' || (typeof element.type === 'string' && opaqueTags.has(element.type))) return element;
  const props: Record<string, unknown> = {};
  for (const attribute of attributes) if (typeof element.props[attribute] === 'string') props[attribute] = t(element.props[attribute] as string);
  if ('children' in element.props) props.children = translateTree(element.props.children as ReactNode, t);
  return cloneElement(element, props);
}
