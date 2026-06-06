'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

function useCanAnimate() {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  return mounted && !reduceMotion;
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

type MotionSectionProps = HTMLMotionProps<'section'> & {
  delay?: number;
};

export function MotionSection({ children, className, delay = 0, ...props }: MotionSectionProps) {
  const canAnimate = useCanAnimate();

  return (
    <motion.section
      className={className}
      initial={canAnimate ? fadeUp.hidden : false}
      whileInView={canAnimate ? fadeUp.visible : undefined}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

type MotionHeroProps = HTMLMotionProps<'section'>;

export function MotionHero({ children, className, ...props }: MotionHeroProps) {
  const canAnimate = useCanAnimate();

  return (
    <motion.section
      className={className}
      initial={canAnimate ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

type MotionStaggerProps = HTMLMotionProps<'div'>;

export function MotionStagger({ children, className, ...props }: MotionStaggerProps) {
  const canAnimate = useCanAnimate();

  return (
    <motion.div
      className={className}
      initial={canAnimate ? 'hidden' : false}
      whileInView={canAnimate ? 'visible' : undefined}
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type MotionItemProps = HTMLMotionProps<'div'>;

export function MotionItem({ children, className, ...props }: MotionItemProps) {
  const canAnimate = useCanAnimate();

  return (
    <motion.div
      className={className}
      variants={canAnimate ? fadeUp : undefined}
      transition={{ duration: 0.4, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type MotionCardProps = HTMLMotionProps<'div'>;

export function MotionCard({ children, className, ...props }: MotionCardProps) {
  const canAnimate = useCanAnimate();

  return (
    <motion.div
      className={className}
      initial={canAnimate ? { opacity: 0, y: 24, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
