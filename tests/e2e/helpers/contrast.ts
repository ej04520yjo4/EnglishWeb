import { expect, Locator } from "@playwright/test";

type ContrastKind = "text" | "border" | "focus";

export type ContrastExpectation = {
  label?: string;
  minRatio?: number;
};

export type ContrastReading = {
  label: string;
  ratio: number;
  foreground: string;
  background: string;
  foregroundSource: string;
  backgroundSource: string;
};

type SamplerOptions = {
  kind: ContrastKind;
  label: string;
  pseudo: "::placeholder" | "::before" | "::after" | null;
};

const sampleContrast = async (
  locator: Locator,
  options: SamplerOptions,
): Promise<ContrastReading> => {
  return locator.evaluate((element, sampler) => {
    type Rgba = { r: number; g: number; b: number; a: number };
    type Layer = { color: Rgba; source: string };

    const parseColor = (value: string): Rgba | null => {
      const normalized = value.trim().toLowerCase();
      if (normalized === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
      const hex = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
      if (hex) {
        const expanded = hex.length === 3 || hex.length === 4
          ? hex.split("").map((part) => `${part}${part}`).join("")
          : hex;
        return {
          r: Number.parseInt(expanded.slice(0, 2), 16),
          g: Number.parseInt(expanded.slice(2, 4), 16),
          b: Number.parseInt(expanded.slice(4, 6), 16),
          a: expanded.length === 8
            ? Number.parseInt(expanded.slice(6, 8), 16) / 255
            : 1,
        };
      }
      const rgb = normalized.match(
        /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
      );
      if (!rgb) return null;
      const alpha = rgb[4]
        ? rgb[4].endsWith("%")
          ? Number.parseFloat(rgb[4]) / 100
          : Number.parseFloat(rgb[4])
        : 1;
      return {
        r: Number.parseFloat(rgb[1]),
        g: Number.parseFloat(rgb[2]),
        b: Number.parseFloat(rgb[3]),
        a: Math.max(0, Math.min(1, alpha)),
      };
    };

    const composite = (foreground: Rgba, background: Rgba): Rgba => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha,
      };
    };

    const formatColor = (color: Rgba): string =>
      `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a.toFixed(3)})`;

    const luminance = (color: Rgba): number => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    };

    const contrastRatio = (left: Rgba, right: Rgba): number => {
      const leftLum = luminance(left);
      const rightLum = luminance(right);
      return (Math.max(leftLum, rightLum) + 0.05) /
        (Math.min(leftLum, rightLum) + 0.05);
    };

    const style = getComputedStyle(element);
    if (sampler.kind === "focus" && document.activeElement !== element) {
      throw new Error(`${sampler.label} is not focused.`);
    }
    if (sampler.kind === "focus" && Number.parseFloat(style.outlineOffset) < 0) {
      throw new Error(`${sampler.label} uses an unsupported inset outline.`);
    }

    let opacityNode: HTMLElement | null = element as HTMLElement;
    while (opacityNode) {
      const opacityValue = getComputedStyle(opacityNode).opacity;
      if (opacityValue !== "1") {
        throw new Error(
          `Unsupported group opacity for ${sampler.label}: ${opacityValue}`,
        );
      }
      opacityNode = opacityNode.parentElement;
    }

    const layers: Layer[] = [];
    let current: HTMLElement | null = sampler.kind === "focus"
      ? element.parentElement
      : element as HTMLElement;
    while (current) {
      const currentStyle = getComputedStyle(current);
      if (currentStyle.backgroundImage !== "none") {
        throw new Error(
          `Unsupported background-image for ${sampler.label}: ${currentStyle.backgroundImage}`,
        );
      }
      const backgroundColor = parseColor(currentStyle.backgroundColor);
      if (!backgroundColor) {
        throw new Error(
          `Unsupported background color for ${sampler.label}: ${currentStyle.backgroundColor}`,
        );
      }
      layers.push({
        color: backgroundColor,
        source: `${current.tagName.toLowerCase()} background`,
      });
      if (backgroundColor.a >= 0.999) break;
      current = current.parentElement;
    }
    if (!layers.at(-1) || layers.at(-1)!.color.a < 0.999) {
      throw new Error(`No opaque background found for ${sampler.label}.`);
    }

    let background: Rgba = { r: 0, g: 0, b: 0, a: 0 };
    let backgroundSource = "transparent document background";
    for (const layer of layers.reverse()) {
      background = composite(layer.color, background);
      if (layer.color.a > 0) backgroundSource = layer.source;
    }

    if (sampler.kind === "focus") {
      const outline = parseColor(style.outlineColor);
      if (
        style.outlineStyle === "none" ||
        Number.parseFloat(style.outlineWidth) <= 0 ||
        !outline ||
        outline.a <= 0
      ) {
        throw new Error(
          `${sampler.label} has no visible focus outline: ${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        );
      }
      const paintedOutline = composite(outline, background);
      return {
        label: sampler.label,
        ratio: contrastRatio(paintedOutline, background),
        foreground: formatColor(paintedOutline),
        background: formatColor(background),
        foregroundSource: style.outlineColor,
        backgroundSource,
      };
    }

    if (sampler.kind === "border") {
      const border = parseColor(style.borderTopColor);
      const fill = parseColor(style.backgroundColor);
      if (
        style.borderTopStyle === "none" ||
        Number.parseFloat(style.borderTopWidth) <= 0 ||
        !border ||
        !fill ||
        fill.a < 0.999
      ) {
        throw new Error(
          `${sampler.label} needs a visible border and solid fill: border=${style.borderTopColor}, background=${style.backgroundColor}`,
        );
      }
      const paintedBorder = composite(border, fill);
      return {
        label: sampler.label,
        ratio: contrastRatio(paintedBorder, fill),
        foreground: formatColor(paintedBorder),
        background: formatColor(fill),
        foregroundSource: style.borderTopColor,
        backgroundSource: "target fill",
      };
    }

    const foregroundStyle = getComputedStyle(element, sampler.pseudo);
    const foreground = parseColor(foregroundStyle.color);
    if (!foreground) {
      throw new Error(
        `Unsupported foreground color for ${sampler.label}: ${foregroundStyle.color}`,
      );
    }
    const foregroundOpacity = Number.parseFloat(foregroundStyle.opacity);
    if (!Number.isFinite(foregroundOpacity)) {
      throw new Error(`Unsupported foreground opacity for ${sampler.label}.`);
    }
    const paintedForeground = composite(
      { ...foreground, a: foreground.a * foregroundOpacity },
      background,
    );
    return {
      label: sampler.label,
      ratio: contrastRatio(paintedForeground, background),
      foreground: formatColor(paintedForeground),
      background: formatColor(background),
      foregroundSource: foregroundStyle.color,
      backgroundSource,
    };
  }, options);
};

export const expectTextContrast = async (
  locator: Locator,
  expectation: ContrastExpectation = {},
): Promise<ContrastReading> => {
  const reading = await sampleContrast(locator, {
    kind: "text",
    label: expectation.label ?? "text contrast target",
    pseudo: null,
  });
  expect(
    reading.ratio,
    `${reading.label}: ${reading.foreground} on ${reading.background}`,
  ).toBeGreaterThanOrEqual(expectation.minRatio ?? 4.5);
  return reading;
};

export const expectPlaceholderContrast = async (
  locator: Locator,
  expectation: ContrastExpectation = {},
): Promise<ContrastReading> => {
  const reading = await sampleContrast(locator, {
    kind: "text",
    label: expectation.label ?? "placeholder contrast target",
    pseudo: "::placeholder",
  });
  expect(
    reading.ratio,
    `${reading.label}: ${reading.foreground} on ${reading.background}`,
  ).toBeGreaterThanOrEqual(expectation.minRatio ?? 4.5);
  return reading;
};

export const expectBorderContrast = async (
  locator: Locator,
  expectation: ContrastExpectation = {},
): Promise<ContrastReading> => {
  const reading = await sampleContrast(locator, {
    kind: "border",
    label: expectation.label ?? "border contrast target",
    pseudo: null,
  });
  expect(
    reading.ratio,
    `${reading.label}: ${reading.foreground} on ${reading.background}`,
  ).toBeGreaterThanOrEqual(expectation.minRatio ?? 3);
  return reading;
};

export const expectFocusOutlineContrast = async (
  locator: Locator,
  expectation: ContrastExpectation = {},
): Promise<ContrastReading> => {
  const reading = await sampleContrast(locator, {
    kind: "focus",
    label: expectation.label ?? "focus outline contrast target",
    pseudo: null,
  });
  expect(
    reading.ratio,
    `${reading.label}: ${reading.foreground} on ${reading.background}`,
  ).toBeGreaterThanOrEqual(expectation.minRatio ?? 3);
  return reading;
};
