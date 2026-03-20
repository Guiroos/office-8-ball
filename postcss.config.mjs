/**
 * Removes Tailwind v4's wildcard font-size meta-rule `font-size: var(--text-*)`.
 * Tailwind generates this rule for CSS-variable-based arbitrary values, but the
 * literal `*` in var() is invalid CSS that Turbopack's strict parser rejects.
 * The rule is never matched at runtime — removing it has no functional effect.
 *
 * @type {import('postcss').Plugin}
 */
const removeTailwindTextWildcard = {
  postcssPlugin: "remove-tailwind-text-wildcard",
  Rule(rule) {
    if (
      rule.nodes?.some(
        (node) =>
          node.type === "decl" &&
          node.prop === "font-size" &&
          node.value.includes("var(--text-*)"),
      )
    ) {
      rule.remove();
    }
  },
};

const config = {
  plugins: ["@tailwindcss/postcss", removeTailwindTextWildcard],
};

export default config;
