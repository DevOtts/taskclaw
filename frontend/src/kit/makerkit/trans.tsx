'use client';

import { Trans as TransComponent } from 'react-i18next';

export function Trans(props: React.ComponentProps<typeof TransComponent>) {
  return <TransComponent {...props} />;
}
