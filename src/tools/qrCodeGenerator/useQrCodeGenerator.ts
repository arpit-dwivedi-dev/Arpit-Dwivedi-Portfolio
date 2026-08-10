import { useMemo, useState } from 'react';
import { buildQrValue } from './encode';
import { createBlankForms, DEFAULT_QR_STYLE } from './types';
import type { QrForms, QrStyle, QrTypeId } from './types';

export const useQrCodeGenerator = (redirectPageUrl: string) => {
  const [activeType, setActiveType] = useState<QrTypeId>('url');
  const [forms, setForms] = useState<QrForms>(createBlankForms);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_QR_STYLE);

  const updateForm = <T extends QrTypeId>(type: T, patch: Partial<QrForms[T]>) => {
    setForms((current) => ({ ...current, [type]: { ...current[type], ...patch } }));
  };

  const qrValue = useMemo(() => buildQrValue(activeType, forms, redirectPageUrl), [activeType, forms, redirectPageUrl]);

  return { activeType, setActiveType, forms, updateForm, style, setStyle, qrValue };
};
