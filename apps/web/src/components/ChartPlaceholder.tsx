/**
 * PROVISIONAL — Bot-B chart surface stubs (Bot-C replaces with WebGL).
 */
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  testId: string;
  children?: ReactNode;
  tall?: boolean;
}

export function ChartPlaceholder({ title, subtitle, testId, children, tall }: Props) {
  return (
    <div
      className={`chart-placeholder${tall ? ' chart-placeholder-tall' : ''}`}
      data-testid={testId}
      role="img"
      aria-label={title}
    >
      <div className="chart-placeholder-label">
        <strong>{title}</strong>
        {subtitle ? <span className="muted">{subtitle}</span> : null}
      </div>
      <div className="chart-placeholder-grid" aria-hidden />
      {children}
    </div>
  );
}