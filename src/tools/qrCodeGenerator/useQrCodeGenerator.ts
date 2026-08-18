import { useMemo, useState } from 'react';
import { buildQrValue, getQrTypeDefinition } from './encode';
import { createBlankForms, DEFAULT_QR_STYLE } from './types';
import type { QrForms, QrStyle, QrTypeId, ValidationResult } from './types';

// Per-type touched-field tracking, keyed by QR type so switching tabs never
// leaks "this field is invalid" state from one type's form into another's —
// each type keeps its own independent set of fields the user has blurred.
type TouchedByType = Partial<Record<QrTypeId, Set<string>>>;

export const useQrCodeGenerator = (redirectPageUrl: string, initialType: QrTypeId = 'url') => {
  const [activeType, setActiveTypeState] = useState<QrTypeId>(initialType);
  const [forms, setForms] = useState<QrForms>(createBlankForms);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_QR_STYLE);
  const [touchedByType, setTouchedByType] = useState<TouchedByType>({});

  const updateForm = <T extends QrTypeId>(type: T, patch: Partial<QrForms[T]>) => {
    setForms((current) => ({ ...current, [type]: { ...current[type], ...patch } }));
  };

  // Switching tabs never touches `forms` for other types (each type's data
  // already lives on its own key in `forms` and `updateForm` only patches the
  // active one) — this is just here so the active type itself updates.
  const setActiveType = (type: QrTypeId) => {
    setActiveTypeState(type);
  };

  const markTouched = (field: string) => {
    setTouchedByType((current) => {
      const existing = current[activeType] ?? new Set<string>();
      if (existing.has(field)) return current;
      const next = new Set(existing);
      next.add(field);
      return { ...current, [activeType]: next };
    });
  };

  const touchedFields = touchedByType[activeType] ?? new Set<string>();

  const activeTypeDefinition = useMemo(() => getQrTypeDefinition(activeType), [activeType]);

  const validation: ValidationResult = useMemo(
    () => activeTypeDefinition.validate(forms[activeType]),
    [activeTypeDefinition, forms, activeType],
  );

  // Only surfaces an error for a field once the user has actually interacted
  // with it (blurred it at least once) — never shown on a pristine field.
  const getFieldError = (field: string): string | undefined =>
    touchedFields.has(field) ? validation.errors[field] : undefined;

  const qrValue = useMemo(() => activeTypeDefinition.encode(forms[activeType], redirectPageUrl), [activeType, activeTypeDefinition, forms, redirectPageUrl]);

  // Resets only the active type's form data + touched state back to blank —
  // other types' forms and touched state are left completely alone.
  const reset = () => {
    const blank = createBlankForms();
    setForms((current) => ({ ...current, [activeType]: blank[activeType] }));
    setTouchedByType((current) => {
      const next = { ...current };
      delete next[activeType];
      return next;
    });
  };

  return {
    activeType,
    setActiveType,
    activeTypeDefinition,
    forms,
    updateForm,
    style,
    setStyle,
    qrValue,
    validation,
    touchedFields,
    markTouched,
    getFieldError,
    reset,
  };
};
