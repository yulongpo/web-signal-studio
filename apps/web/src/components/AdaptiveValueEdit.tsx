/**
 * Web AdaptiveValueEdit — Qt AdaptiveValueEdit parity (commit Enter/Tab blur,
 * discard Escape, unit-aware parse/format). Used by DetectPage DetectionCard.
 */
import { useEffect, useState, type FocusEvent, type KeyboardEvent } from 'react';
import {
  formatAdaptiveValue,
  parseAdaptiveValue,
  type UnitKind,
} from './adaptiveValue';

export type AdaptiveValueEditProps = {
  kind: UnitKind;
  value: number;
  /** Convert committed SI/base units into the parent store value (e.g. Time→ms). */
  toStore?: (parsed: number) => number;
  /** Convert parent store value into SI/base units for parse/format. */
  fromStore?: (store: number) => number;
  disabled?: boolean;
  'data-testid'?: string;
  'data-object-name'?: string;
  className?: string;
  title?: string;
  onCommit: (storeValue: number) => void;
};

export function AdaptiveValueEdit({
  kind,
  value,
  toStore = (v) => v,
  fromStore = (v) => v,
  disabled,
  className,
  title,
  onCommit,
  ...data
}: AdaptiveValueEditProps) {
  const base = fromStore(value);
  const [text, setText] = useState(() => formatAdaptiveValue(base, kind));
  const [draft, setDraft] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!draft) {
      setText(formatAdaptiveValue(fromStore(value), kind));
      setInvalid(false);
    }
    // fromStore is stable in DetectPage call sites (inline identity ok for drafts).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid resetting draft on render
  }, [value, kind, draft]);

  const commit = () => {
    if (!draft && text === formatAdaptiveValue(fromStore(value), kind)) return;
    if (!draft) return;
    const parsed = parseAdaptiveValue(text, kind);
    if (parsed == null) {
      setInvalid(true);
      return;
    }
    setDraft(false);
    setInvalid(false);
    const next = toStore(parsed);
    setText(formatAdaptiveValue(parsed, kind));
    onCommit(next);
  };

  const discard = () => {
    setDraft(false);
    setInvalid(false);
    setText(formatAdaptiveValue(fromStore(value), kind));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      discard();
    }
  };

  const onBlur = (_e: FocusEvent<HTMLInputElement>) => {
    // Match Qt Tab commit path: when focus moves to another control, commit.
    // relatedTarget null (window blur) → leave draft (Qt: window blur does not commit).
    if (_e.relatedTarget instanceof HTMLElement) {
      commit();
    }
  };

  return (
    <input
      type="text"
      className={className}
      data-testid={data['data-testid']}
      data-object-name={data['data-object-name']}
      data-adaptive-kind={kind}
      data-parameter-draft={draft ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      title={title}
      value={text}
      disabled={disabled}
      onChange={(e) => {
        setText(e.target.value);
        setDraft(true);
        setInvalid(false);
      }}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}
