import React from 'react';
import Svg, { Rect, Circle, Path, G, Defs, ClipPath } from 'react-native-svg';

export type FlagCode = 'DE' | 'FR' | 'NL' | 'ES' | 'AT' | 'EU' | 'US' | 'GB' | 'KR';

interface FlagProps {
  code: FlagCode;
  size?: number;
}

const W = 60;
const H = 40;

function Horizontal({ bands }: { bands: { color: string; y: number; h: number }[] }) {
  return (
    <>
      {bands.map((b, i) => (
        <Rect key={i} x={0} y={b.y} width={W} height={b.h} fill={b.color} />
      ))}
    </>
  );
}

function Vertical({ bands }: { bands: { color: string; x: number; w: number }[] }) {
  return (
    <>
      {bands.map((b, i) => (
        <Rect key={i} x={b.x} y={0} width={b.w} height={H} fill={b.color} />
      ))}
    </>
  );
}

function EuStars() {
  const stars = [];
  const cx = W / 2;
  const cy = H / 2;
  const r = 11;
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    stars.push(
      <Circle
        key={i}
        cx={cx + r * Math.cos(angle)}
        cy={cy + r * Math.sin(angle)}
        r={1.7}
        fill="#FFCC00"
      />,
    );
  }
  return <>{stars}</>;
}

function UsStars() {
  const dots = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      dots.push(
        <Circle
          key={`${row}-${col}`}
          cx={3.2 + col * 3.9}
          cy={3.2 + row * 3.9}
          r={1.1}
          fill="#FFFFFF"
        />,
      );
    }
  }
  return <>{dots}</>;
}

function FlagBody({ code }: { code: FlagCode }) {
  switch (code) {
    case 'DE':
      return (
        <Horizontal
          bands={[
            { color: '#000000', y: 0, h: H / 3 },
            { color: '#DD0000', y: H / 3, h: H / 3 },
            { color: '#FFCE00', y: (H / 3) * 2, h: H / 3 },
          ]}
        />
      );
    case 'FR':
      return (
        <Vertical
          bands={[
            { color: '#002395', x: 0, w: W / 3 },
            { color: '#FFFFFF', x: W / 3, w: W / 3 },
            { color: '#ED2939', x: (W / 3) * 2, w: W / 3 },
          ]}
        />
      );
    case 'NL':
      return (
        <Horizontal
          bands={[
            { color: '#AE1C28', y: 0, h: H / 3 },
            { color: '#FFFFFF', y: H / 3, h: H / 3 },
            { color: '#21468B', y: (H / 3) * 2, h: H / 3 },
          ]}
        />
      );
    case 'ES':
      return (
        <Horizontal
          bands={[
            { color: '#AA151B', y: 0, h: H / 4 },
            { color: '#F1BF00', y: H / 4, h: H / 2 },
            { color: '#AA151B', y: (H / 4) * 3, h: H / 4 },
          ]}
        />
      );
    case 'AT':
      return (
        <Horizontal
          bands={[
            { color: '#ED2939', y: 0, h: H / 3 },
            { color: '#FFFFFF', y: H / 3, h: H / 3 },
            { color: '#ED2939', y: (H / 3) * 2, h: H / 3 },
          ]}
        />
      );
    case 'EU':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#003399" />
          <EuStars />
        </>
      );
    case 'US':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <Rect key={i} x={0} y={(H / 13) * i} width={W} height={H / 13} fill="#B22234" />
          ))}
          <Rect x={0} y={0} width={W * 0.4} height={(H / 13) * 7} fill="#3C3B6E" />
          <UsStars />
        </>
      );
    case 'GB':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#012169" />
          <Path d="M0 0 L60 40 M60 0 L0 40" stroke="#FFFFFF" strokeWidth={8} />
          <Path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth={3.5} />
          <Path d={`M${W / 2} 0 L${W / 2} ${H} M0 ${H / 2} L${W} ${H / 2}`} stroke="#FFFFFF" strokeWidth={13} />
          <Path d={`M${W / 2} 0 L${W / 2} ${H} M0 ${H / 2} L${W} ${H / 2}`} stroke="#C8102E" strokeWidth={7.5} />
        </>
      );
    case 'KR':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
          <G>
            <Circle cx={W / 2} cy={H / 2} r={9} fill="#CD2E3A" />
            <Path
              d={`M${W / 2 - 9} ${H / 2} A4.5 4.5 0 0 1 ${W / 2} ${H / 2} A4.5 4.5 0 0 0 ${W / 2 + 9} ${H / 2} A9 9 0 0 1 ${W / 2 - 9} ${H / 2} Z`}
              fill="#0047A0"
            />
          </G>
          <G fill="#000000">
            <Rect x={8} y={9.5} width={9} height={1.4} transform="rotate(33 12.5 10.2)" />
            <Rect x={8} y={12.2} width={9} height={1.4} transform="rotate(33 12.5 12.9)" />
            <Rect x={43} y={9.5} width={9} height={1.4} transform="rotate(-33 47.5 10.2)" />
            <Rect x={43} y={12.2} width={9} height={1.4} transform="rotate(-33 47.5 12.9)" />
            <Rect x={8} y={26.4} width={9} height={1.4} transform="rotate(-33 12.5 27.1)" />
            <Rect x={8} y={29.1} width={9} height={1.4} transform="rotate(-33 12.5 29.8)" />
            <Rect x={43} y={26.4} width={9} height={1.4} transform="rotate(33 47.5 27.1)" />
            <Rect x={43} y={29.1} width={9} height={1.4} transform="rotate(33 47.5 29.8)" />
          </G>
        </>
      );
    default:
      return <Rect x={0} y={0} width={W} height={H} fill="#CBD5E1" />;
  }
}

export function Flag({ code, size = 24 }: FlagProps) {
  const height = (size * H) / W;
  return (
    <Svg width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <ClipPath id={`flag-clip-${code}`}>
          <Rect x={0} y={0} width={W} height={H} rx={3} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#flag-clip-${code})`}>
        <FlagBody code={code} />
      </G>
    </Svg>
  );
}

export default Flag;
