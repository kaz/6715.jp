import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default defineConfig({
	site: "https://6715.jp",
	markdown: {
		extendDefaultPlugins: true,
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex, [rehypeExternalLinks, { rel: [], target: "_blank" }]],
	},
	integrations: [mdx(), sitemap(), compress()],
});
