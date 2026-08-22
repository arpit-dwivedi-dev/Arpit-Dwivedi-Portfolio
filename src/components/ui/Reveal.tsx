import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'none';

interface RevealProps {
  children: ReactNode;
  /** Stagger position within a group. Multiplied by 60ms. */
  index?: number;
  /** Which way the element travels in from. */
  from?: Direction;
  className?: string;
  /** Rendered element. Defaults to a div. */
  as?: 'div' | 'section' | 'article' | 'li' | 'ul';
  id?: string;
}

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 16 },
  left: { x: -24 },
  right: { x: 24 },
  none: {},
};

/**
 * The site's single scroll-reveal primitive.
 *
 * Before this, 21 separate `whileInView` blocks were scattered across nine
 * components, each with its own distance, duration and delay — so nothing
 * shared a rhythm and, more importantly, only the hero ever checked
 * prefers-reduced-motion. `motion` does not disable whileInView on its own,
 * so every one of those reveals ran regardless of the OS setting.
 *
 * Under reduced motion this renders a plain element with no motion props at
 * all. That matters more than setting a zero duration: an element whose
 * `initial` is opacity 0 stays invisible if the animation never runs, so the
 * CSS kill switch in index.css cannot be the whole fix — it would leave a
 * reduced-motion visitor looking at a blank page.
 *
 * Transform and opacity only, once per element, never replayed on scroll-up.
 */
export const Reveal = ({
  children,
  index = 0,
  from = 'up',
  className,
  as = 'div',
  id,
}: RevealProps) => {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  }

  const Motion = motion[as];
  const offset = OFFSET[from];

  return (
    <Motion
      id={id}
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px -8% 0px' }}
      transition={{
        duration: 0.55,
        delay: index * 0.06,
        // Decelerating cubic — arrives softly rather than snapping, which is
        // what keeps a stagger of six from reading as six separate events.
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      {children}
    </Motion>
  );
};

// The four loose motion values that used to be exported here (REVEAL_INITIAL,
// REVEAL_IN_VIEW, REVEAL_VIEWPORT, revealTransition) existed for exactly one
// caller: ProjectCard, which could not wrap itself in <Reveal> without
// inserting a div between the grid and an h-full child and collapsing the
// equal-height rows. The projects ledger has no equal-height rows to collapse,
// so ProjectRow uses <Reveal as="li"> like every other list on the site and
// the escape hatch is gone. Re-adding it means re-adding the bug where a
// second copy of these numbers drifts from the component's.
