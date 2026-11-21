import { motion, useReducedMotion, type SVGMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/*
 * Illustration registry. Each scene is a 400×250 SVG built from theme tokens, so it
 * follows light and dark mode. `still` (map thumbnails) and reduced motion turn
 * the looping animations off; entrance animations stay short.
 */

const C = {
  ink: 'var(--color-foreground)',
  paper: 'var(--color-card)',
  muted: 'var(--color-muted)',
  teal: 'var(--color-primary)',
  amber: 'var(--color-art-2)',
  coral: 'var(--color-art-3)',
  violet: 'var(--color-art-4)',
  line: 'var(--color-border)',
};

interface SceneProps {
  loop: boolean;
}

/** A path that draws itself in. */
function Draw({
  delay = 0,
  ...props
}: SVGMotionProps<SVGPathElement> & { delay?: number }) {
  return (
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: 'easeInOut' }}
      fill="none"
      strokeLinecap="round"
      {...props}
    />
  );
}

/** A dashed path whose dashes flow along it, like data moving through a pipe. */
function Flow({
  d,
  color = C.teal,
  width = 3,
}: {
  d: string;
  color?: string;
  width?: number;
}) {
  return (
    <path
      d={d}
      className="art-flow"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function Pop({
  children,
  delay = 0,
  x,
  y,
}: {
  children: ReactNode;
  delay?: number;
  x: number;
  y: number;
}) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      {children}
    </motion.g>
  );
}

function Bob({
  children,
  loop,
  amount = 5,
  duration = 3,
}: {
  children: ReactNode;
  loop: boolean;
  amount?: number;
  duration?: number;
}) {
  return (
    <motion.g
      animate={loop ? { y: [0, -amount, 0] } : undefined}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.g>
  );
}

function Node({
  x,
  y,
  label,
  color,
  r = 26,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  r?: number;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={C.paper}
        stroke={color}
        strokeWidth={4}
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={C.ink}
        fontFamily="var(--font-heading)"
      >
        {label}
      </text>
    </g>
  );
}

function Lake({ loop }: { loop: boolean }) {
  return (
    <g>
      <ellipse
        cx={200}
        cy={170}
        rx={120}
        ry={46}
        fill={C.teal}
        opacity={0.18}
      />
      <ellipse cx={200} cy={170} rx={96} ry={34} fill={C.teal} opacity={0.35} />
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${140 + i * 20} ${162 + i * 8} q 15 -7 30 0 t 30 0`}
          stroke={C.paper}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          animate={loop ? { x: [0, 10, 0] } : undefined}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

const scenes: Record<string, (p: SceneProps) => ReactNode> = {
  title: ({ loop }) => (
    <>
      <Lake loop={loop} />
      <Flow d="M80 70 C 110 120, 150 140, 180 160" />
      <Flow d="M200 40 L 200 140" color={C.amber} />
      <Flow d="M320 70 C 290 120, 250 140, 220 160" color={C.coral} />
      <Bob loop={loop}>
        <Pop x={70} y={60}>
          <Node x={70} y={60} label="SQL" color={C.teal} />
        </Pop>
      </Bob>
      <Bob loop={loop} amount={7} duration={3.6}>
        <Pop x={200} y={36} delay={0.1}>
          <Node x={200} y={36} label="Spark" color={C.amber} r={30} />
        </Pop>
      </Bob>
      <Bob loop={loop} duration={4.2}>
        <Pop x={330} y={60} delay={0.2}>
          <Node x={330} y={60} label="BI" color={C.coral} />
        </Pop>
      </Bob>
      <text
        x={200}
        y={232}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        letterSpacing={3}
        fill={C.ink}
        opacity={0.6}
        fontFamily="var(--font-heading)"
      >
        ONE COPY · MANY ENGINES
      </text>
    </>
  ),

  onelake: ({ loop }) => (
    <>
      <Lake loop={loop} />
      {[
        { x: 40, y: 40, c: C.teal, l: 'Sales' },
        { x: 160, y: 20, c: C.amber, l: 'Finance' },
        { x: 280, y: 40, c: C.coral, l: 'S3' },
      ].map((w, i) => (
        <Pop key={w.l} x={w.x + 40} y={w.y + 25} delay={i * 0.12}>
          <rect
            x={w.x}
            y={w.y}
            width={80}
            height={50}
            rx={12}
            fill={C.paper}
            stroke={w.c}
            strokeWidth={3}
          />
          <text
            x={w.x + 40}
            y={w.y + 30}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={C.ink}
            fontFamily="var(--font-heading)"
          >
            {w.l}
          </text>
        </Pop>
      ))}
      <Flow d="M80 92 C 90 120, 140 140, 170 152" />
      <Flow d="M200 72 L 200 136" color={C.amber} />
      <Flow d="M320 92 C 310 120, 260 140, 230 152" color={C.coral} />
    </>
  ),

  ingest: ({ loop }) => {
    const tanks = [
      { x: 50, c: '#b07a43', l: 'Bronze' },
      { x: 165, c: '#9aa3ad', l: 'Silver' },
      { x: 280, c: C.amber, l: 'Gold' },
    ];
    return (
      <>
        <Flow d="M120 150 L 165 150" width={6} />
        <Flow d="M235 150 L 280 150" width={6} />
        {tanks.map((t, i) => (
          <Pop key={t.l} x={t.x + 35} y={150} delay={i * 0.15}>
            <rect
              x={t.x}
              y={90}
              width={70}
              height={120}
              rx={18}
              fill={C.paper}
              stroke={t.c}
              strokeWidth={4}
            />
            <motion.rect
              x={t.x + 8}
              width={54}
              rx={10}
              fill={t.c}
              opacity={0.55}
              initial={{ y: 202, height: 0 }}
              animate={{
                y: loop ? [150, 130, 150] : 140,
                height: loop ? [52, 72, 52] : 62,
              }}
              transition={{
                duration: 3,
                delay: i * 0.4,
                repeat: loop ? Infinity : 0,
                ease: 'easeInOut',
              }}
            />
            <text
              x={t.x + 35}
              y={80}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={C.ink}
              fontFamily="var(--font-heading)"
            >
              {t.l}
            </text>
          </Pop>
        ))}
        <Draw d="M40 40 H 360" stroke={C.teal} strokeWidth={4} delay={0.4} />
        <text
          x={200}
          y={30}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          letterSpacing={2}
          fill={C.teal}
          fontFamily="var(--font-heading)"
        >
          PIPELINE · SCHEDULE · NOTIFY
        </text>
      </>
    );
  },

  semantic: ({ loop }) => {
    const dims = [
      { x: 70, y: 50, l: 'Date' },
      { x: 330, y: 50, l: 'Store' },
      { x: 70, y: 200, l: 'Product' },
      { x: 330, y: 200, l: 'Customer' },
    ];
    return (
      <>
        {dims.map((d, i) => (
          <Draw
            key={d.l}
            d={`M${d.x} ${d.y} L 200 125`}
            stroke={C.line}
            strokeWidth={4}
            delay={0.2 + i * 0.1}
          />
        ))}
        {dims.map((d, i) => (
          <Pop key={d.l} x={d.x} y={d.y} delay={0.4 + i * 0.1}>
            <rect
              x={d.x - 45}
              y={d.y - 18}
              width={90}
              height={36}
              rx={18}
              fill={C.paper}
              stroke={C.violet}
              strokeWidth={3}
            />
            <text
              x={d.x}
              y={d.y + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={C.ink}
              fontFamily="var(--font-heading)"
            >
              {d.l}
            </text>
          </Pop>
        ))}
        <Pop x={200} y={125}>
          <rect x={145} y={90} width={110} height={70} rx={16} fill={C.teal} />
          {[0, 1, 2, 3].map((i) => (
            <motion.rect
              key={i}
              x={162 + i * 20}
              width={12}
              rx={3}
              fill={C.paper}
              initial={{ height: 0, y: 148 }}
              animate={{
                height: [10, 18, 26, 34][i],
                y: 148 - [10, 18, 26, 34][i],
              }}
              transition={{
                delay: 0.8 + i * 0.1,
                repeat: loop ? Infinity : 0,
                repeatType: 'reverse',
                duration: 1.6,
                repeatDelay: 1,
              }}
            />
          ))}
        </Pop>
      </>
    );
  },

  governance: ({ loop }) => (
    <>
      <motion.g
        animate={loop ? { rotate: 360 } : undefined}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '200px', originY: '125px' }}
      >
        <circle
          cx={200}
          cy={125}
          r={100}
          fill="none"
          stroke={C.line}
          strokeWidth={3}
          strokeDasharray="4 10"
        />
        {[
          { a: 0, c: C.teal, t: '✓' },
          { a: 120, c: C.amber, t: '★' },
          { a: 240, c: C.violet, t: '◆' },
        ].map((b) => {
          const x = 200 + 100 * Math.cos((b.a * Math.PI) / 180);
          const y = 125 + 100 * Math.sin((b.a * Math.PI) / 180);
          return (
            <g key={b.a}>
              <circle cx={x} cy={y} r={18} fill={b.c} />
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize={16}
                fontWeight={800}
                fill={C.paper}
              >
                {b.t}
              </text>
            </g>
          );
        })}
      </motion.g>
      <Pop x={200} y={125}>
        <path
          d="M200 60 L 250 78 V 124 C 250 158, 228 180, 200 192 C 172 180, 150 158, 150 124 V 78 Z"
          fill={C.teal}
        />
        <rect x={182} y={118} width={36} height={30} rx={6} fill={C.paper} />
        <path
          d="M188 118 v -8 a 12 12 0 0 1 24 0 v 8"
          fill="none"
          stroke={C.paper}
          strokeWidth={5}
        />
      </Pop>
    </>
  ),

  fabriciq: ({ loop }) => {
    const nodes = [
      { x: 90, y: 70, l: 'Customer', c: C.teal },
      { x: 310, y: 70, l: 'Order', c: C.amber },
      { x: 200, y: 190, l: 'Product', c: C.coral },
    ];
    const edges = [
      { d: 'M140 70 H 260', l: 'places' },
      { d: 'M300 100 L 230 165', l: 'contains' },
      { d: 'M100 100 L 170 165', l: 'buys' },
    ];
    return (
      <>
        {edges.map((e, i) => (
          <g key={e.l}>
            <Draw
              d={e.d}
              stroke={C.line}
              strokeWidth={4}
              delay={0.3 + i * 0.15}
            />
            <Flow d={e.d} color={C.violet} width={2} />
          </g>
        ))}
        <text
          x={200}
          y={60}
          textAnchor="middle"
          fontSize={12}
          fontStyle="italic"
          fill={C.ink}
          opacity={0.7}
        >
          places
        </text>
        {nodes.map((n, i) => (
          <Pop key={n.l} x={n.x} y={n.y} delay={i * 0.12}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={44}
              fill={n.c}
              opacity={0.18}
              animate={loop ? { r: [40, 48, 40] } : undefined}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
            />
            <rect
              x={n.x - 48}
              y={n.y - 18}
              width={96}
              height={36}
              rx={18}
              fill={C.paper}
              stroke={n.c}
              strokeWidth={3}
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={C.ink}
              fontFamily="var(--font-heading)"
            >
              {n.l}
            </text>
          </Pop>
        ))}
      </>
    );
  },

  apps: ({ loop }) => (
    <>
      <Pop x={200} y={125}>
        <rect
          x={60}
          y={30}
          width={280}
          height={190}
          rx={18}
          fill={C.paper}
          stroke={C.ink}
          strokeOpacity={0.15}
          strokeWidth={3}
        />
        <rect x={60} y={30} width={280} height={30} rx={18} fill={C.muted} />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={82 + i * 16}
            cy={45}
            r={5}
            fill={[C.coral, C.amber, C.teal][i]}
          />
        ))}
      </Pop>
      {[40, 70, 55, 95, 120].map((h, i) => (
        <motion.rect
          key={i}
          x={90 + i * 34}
          width={22}
          rx={5}
          fill={i === 4 ? C.coral : C.teal}
          initial={{ height: 0, y: 200 }}
          animate={{ height: h, y: 200 - h }}
          transition={{
            delay: 0.3 + i * 0.08,
            type: 'spring',
            stiffness: 120,
            damping: 14,
          }}
        />
      ))}
      <Draw
        d="M80 82 H 320"
        stroke={C.coral}
        strokeWidth={3}
        strokeDasharray="8 8"
        delay={0.8}
      />
      <text
        x={318}
        y={76}
        textAnchor="end"
        fontSize={12}
        fontWeight={800}
        fill={C.coral}
        fontFamily="var(--font-heading)"
      >
        LIMIT
      </text>
      <motion.g
        animate={loop ? { x: [0, 3, -3, 0] } : undefined}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <circle cx={237} cy={70} r={14} fill={C.coral} />
        <text
          x={237}
          y={76}
          textAnchor="middle"
          fontSize={16}
          fontWeight={900}
          fill={C.paper}
        >
          !
        </text>
      </motion.g>
    </>
  ),
};

// Dialogue scenes name their art by theme; map them onto the chapter scenes.
const aliases: Record<string, string> = {
  pipeline: 'ingest',
  'semantic-model': 'semantic',
  'governance-shield': 'governance',
  'fabric-iq': 'fabriciq',
  'app-limits': 'apps',
};

export function Art({
  id,
  className,
  still = false,
}: {
  id: string;
  className?: string;
  still?: boolean;
}) {
  const reduced = useReducedMotion();
  const scene = scenes[aliases[id] ?? id];
  if (!scene) return null;
  return (
    <svg
      viewBox="0 0 400 250"
      className={cn(still && 'art-still', className)}
      role="presentation"
      aria-hidden
    >
      {scene({ loop: !still && !reduced })}
    </svg>
  );
}
