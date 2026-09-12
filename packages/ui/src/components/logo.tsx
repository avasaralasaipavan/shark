import { type ComponentProps } from "solid-js"
import { brandCells } from "@opencode-ai/brand"

// Shark fin mark drawn on a 16x18 unit grid so it can be reused at any scale.
const FIN_WEAK =
  "M3 13C3.5 6.5 5.2 3.5 8.7 1.2C12 3.6 13.5 7 14.2 11.6C10.8 10.8 7.6 12.2 3 13Z"
const FIN_STRONG =
  "M5.8 11C6.2 7.4 7.6 5.4 9.6 3.9C11.4 5.4 12.8 7.6 13.4 9.9C10.6 9.6 7.9 10.4 5.8 11Z"

const Fin = (props: { class?: string; scale?: number }) => {
  const scale = props.scale ?? 1
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`scale(${scale})`}>
        <path data-slot="logo-mark-shadow" d={FIN_WEAK} fill="var(--icon-weak-base)" />
        <path data-slot="logo-mark-o" d={FIN_STRONG} fill="var(--icon-strong-base)" />
      </g>
    </svg>
  )
}

export const Mark = (props: { class?: string }) => {
  return <Fin class={props.class} />
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="scale(5)">
        <path data-slot="logo-logo-mark-shadow" d={FIN_WEAK} fill="var(--icon-base)" />
        <path data-slot="logo-logo-mark-o" d={FIN_STRONG} fill="var(--icon-strong-base)" />
      </g>
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  const u = 6
  const cells = brandCells()
  const width = Math.max(
    ...[...cells.solid, ...cells.top, ...cells.bottom].flatMap((cell) => [cell.x + cell.width, cell.y + cell.height]),
  )
  const wordWidth = width * u
  const wordHeight = 3 * u
  const scale = 2.5
  const finWidth = 16 * scale
  const finHeight = 18 * scale
  const gap = u
  const offset = finWidth + gap
  const wordY = Math.max(0, (finHeight - wordHeight) / 2)
  const render = (cell: { x: number; y: number; width: number; height: number }, fill: string) => (
    <rect
      x={offset + cell.x * u}
      y={wordY + cell.y * u}
      width={cell.width * u}
      height={cell.height * u}
      fill={fill}
    />
  )
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${offset + wordWidth} ${finHeight}`}
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g transform={`scale(${scale})`}>
        <path data-slot="logo-fin-shadow" d={FIN_WEAK} fill="var(--icon-weak-base)" />
        <path data-slot="logo-fin-shark" d={FIN_STRONG} fill="var(--icon-strong-base)" />
      </g>
      <g data-slot="logo-wordmark">
        {cells.solid.map((cell) => render(cell, "var(--icon-strong-base)"))}
        {cells.top.map((cell) => render(cell, "var(--icon-base)"))}
        {cells.bottom.map((cell) => render(cell, "var(--icon-base)"))}
      </g>
    </svg>
  )
}